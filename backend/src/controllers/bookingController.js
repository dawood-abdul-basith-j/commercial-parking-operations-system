
const db = require("../config/db");
const { writeAuditLog } = require("../utils/auditLogger");

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];

const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "ACTIVE"],
  ACTIVE: ["COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}


function parseSqlDateTime(value) {
  // Preserve the existing API format: YYYY-MM-DD HH:mm:ss.
  // These are timezone-less database wall-clock values.
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);

  const [y, mo, d, h, mi, s] = parts;

  if (
    mo < 1 || mo > 12 ||
    d < 1 || h > 23 || mi > 59 || s > 59
  ) {
    return null;
  }

  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));

  // Reject impossible calendar dates such as February 30.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d ||
    date.getUTCHours() !== h ||
    date.getUTCMinutes() !== mi ||
    date.getUTCSeconds() !== s
  ) {
    return null;
  }

  return {
    sql: value,
    comparisonValue: date.getTime(),
  };
}

function parsePaginationInteger(value, fallback, maximum) {
  if (value === undefined) return fallback;

  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > maximum) {
    return null;
  }

  return number;
}


// Determine which bookings the authenticated user may access.
async function resolveBookingScope(req) {
  const role = normalizeRole(req.user?.role);

  if (role === "CUSTOMER") {
    const [customers] = await db.execute(
      "SELECT customer_id FROM customers WHERE user_id = ? LIMIT 1",
      [req.user.user_id]
    );

    if (customers.length === 0) {
      return {
        error: {
          status: 403,
          message: "No customer profile is associated with this account.",
        },
      };
    }

    return {
      kind: "customer",
      customerId: customers[0].customer_id,
    };
  }

  if (
    ["SUPER_ADMIN", "SUPER_ADMINISTRATOR"].includes(role)
  ) {
    return { kind: "all" };
  }

  // Staff must have an active assignment to a parking location.
  if (
    ["OPERATOR", "PARKING_OPERATOR", "BRANCH_MANAGER"].includes(role)
  ) {
    const [operators] = await db.execute(
      `SELECT location_id
       FROM operators
       WHERE user_id = ?
         AND employment_status = 'ACTIVE'
       LIMIT 1`,
      [req.user.user_id]
    );

    if (operators.length === 0) {
      return {
        error: {
          status: 403,
          message: "No active parking-location assignment was found.",
        },
      };
    }

    return {
      kind: "location",
      locationId: operators[0].location_id,
    };
  }

  return {
    error: {
      status: 403,
      message: "Your role cannot access booking operations.",
    },
  };
}

function scopeFilter(scope, locationAlias = "l") {
  if (scope.kind === "customer") {
    return {
      sql: "b.customer_id = ?",
      params: [scope.customerId],
    };
  }

  if (scope.kind === "location") {
    return {
      sql: `${locationAlias}.location_id = ?`,
      params: [scope.locationId],
    };
  }

  return {
    sql: "1 = 1",
    params: [],
  };
}

function sendScopeError(res, scope) {
  return res.status(scope.error.status).json({
    success: false,
    message: scope.error.message,
  });
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function canAccessBooking(scope, booking) {
  if (scope.kind === "all") {
    return true;
  }

  if (scope.kind === "customer") {
    return Number(booking.customer_id) === Number(scope.customerId);
  }

  if (scope.kind === "location") {
    return Number(booking.location_id) === Number(scope.locationId);
  }

  return false;
}

async function createBooking(req, res) {
  const {
    customer_id,
    vehicle_id,
    slot_id,
    expected_entry_time,
    expected_exit_time,
    booking_source = "ONLINE",
  } = req.body || {};

  if (
    !isPositiveInteger(vehicle_id) ||
    !isPositiveInteger(slot_id) ||
    !expected_entry_time ||
    !expected_exit_time
  ) {
    return res.status(400).json({
      success: false,
      message: "Vehicle, slot, entry time and exit time are required.",
    });
  }


  const entry = parseSqlDateTime(expected_entry_time);
  const exit = parseSqlDateTime(expected_exit_time);

  if (!entry || !exit) {
    return res.status(400).json({
      success: false,
      message: "Entry and exit times must use YYYY-MM-DD HH:mm:ss and be valid dates.",
    });
  }

  if (exit.comparisonValue <= entry.comparisonValue) {
    return res.status(400).json({
      success: false,
      message: "Exit time must be later than entry time.",
    });
  }

  if (
    typeof booking_source !== "string" ||
    !["ONLINE", "WALK_IN"].includes(booking_source.trim().toUpperCase())
  ) {
    return res.status(400).json({
      success: false,
      message: "Booking source must be ONLINE or WALK_IN.",
    });
  }


  let connection;

  try {
    const scope = await resolveBookingScope(req);

    if (scope.error) {
      return sendScopeError(res, scope);
    }

    let customerId;

    if (scope.kind === "customer") {
      // Customer identity always comes from the authenticated account.
      customerId = scope.customerId;

      if (
        customer_id !== undefined &&
        Number(customer_id) !== Number(customerId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot create bookings for another customer.",
        });
      }
    } else {
      if (!isPositiveInteger(customer_id)) {
        return res.status(400).json({
          success: false,
          message: "A valid customer ID is required.",
        });
      }

      customerId = Number(customer_id);
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock the requested slot and retrieve its location.
    const [slots] = await connection.execute(
      `SELECT
         s.slot_id,
         s.is_active,
         l.location_id
       FROM parking_slots s
       JOIN parking_layouts l ON l.layout_id = s.layout_id
       WHERE s.slot_id = ?
       FOR UPDATE`,
      [Number(slot_id)]
    );

    if (
      slots.length === 0 ||
      Number(slots[0].is_active) !== 1
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Parking slot does not exist or is inactive.",
      });
    }

    if (
      scope.kind === "location" &&
      Number(slots[0].location_id) !== Number(scope.locationId)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "This parking slot is outside your assigned location.",
      });
    }

    const [customers] = await connection.execute(
      "SELECT customer_id FROM customers WHERE customer_id = ?",
      [customerId]
    );

    if (customers.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Customer does not exist.",
      });
    }

    const [vehicles] = await connection.execute(
      `SELECT vehicle_id
       FROM vehicles
       WHERE vehicle_id = ? AND customer_id = ?`,
      [Number(vehicle_id), customerId]
    );

    if (vehicles.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "The selected vehicle does not belong to this customer.",
      });
    }

    const placeholders = ACTIVE_BOOKING_STATUSES.map(() => "?").join(", ");

    const [conflicts] = await connection.execute(
      `SELECT booking_id
       FROM bookings
       WHERE slot_id = ?
         AND booking_status IN (${placeholders})
         AND expected_entry_time < ?
         AND expected_exit_time > ?
       LIMIT 1`,
      [
        Number(slot_id),
        ...ACTIVE_BOOKING_STATUSES,
        expected_exit_time,
        expected_entry_time,
      ]
    );

    if (conflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "The parking slot is already reserved for that time period.",
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO bookings (
        customer_id,
        vehicle_id,
        slot_id,
        booking_date,
        reservation_time,
        expected_entry_time,
        expected_exit_time,
        booking_status,
        booking_source
      ) VALUES (?, ?, ?, CURRENT_DATE(), NOW(), ?, ?, 'PENDING', ?)`,
      [
        customerId,
        Number(vehicle_id),
        Number(slot_id),
        expected_entry_time,
        expected_exit_time,
        booking_source,
      ]
    );

    await writeAuditLog(connection, {
      userId: req.user.user_id,
      moduleName: "BOOKINGS",
      action: `CREATED booking_id=${result.insertId} status=PENDING`,
      ipAddress: req.ip,
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking_id: result.insertId,
      booking_status: "PENDING",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Booking rollback failed:", rollbackError.message);
      }
    }

    console.error("Booking creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


async function getAllBookings(req, res) {
  const page = parsePaginationInteger(req.query.page, 1, 1000000);
  const limit = parsePaginationInteger(req.query.limit, 20, 100);

  if (page === null || limit === null) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive integer and limit must be between 1 and 100.",
    });
  }

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    return res.status(400).json({
      success: false,
      message: "Requested page is too large.",
    });
  }

  try {
    const scope = await resolveBookingScope(req);

    if (scope.error) {
      return sendScopeError(res, scope);
    }

    const filter = scopeFilter(scope);

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM bookings b
       JOIN parking_slots s ON s.slot_id = b.slot_id
       JOIN parking_layouts l ON l.layout_id = s.layout_id
       WHERE ${filter.sql}`,
      filter.params
    );

    const total = Number(countRows[0].total);

    const [rows] = await db.execute(
      `SELECT
         b.booking_id,
         b.customer_id,
         b.vehicle_id,
         b.slot_id,
         b.booking_date,
         b.reservation_time,
         b.expected_entry_time,
         b.expected_exit_time,
         b.booking_status,
         b.booking_source
       FROM bookings b
       JOIN parking_slots s ON s.slot_id = b.slot_id
       JOIN parking_layouts l ON l.layout_id = s.layout_id
       WHERE ${filter.sql}
       ORDER BY b.booking_id DESC
       LIMIT ? OFFSET ?`,
      [...filter.params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Fetching bookings failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
}

async function getBookingById(req, res) {
  const bookingId = Number(req.params.id);

  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID.",
    });
  }

  try {
    const scope = await resolveBookingScope(req);

    if (scope.error) {
      return sendScopeError(res, scope);
    }

    const filter = scopeFilter(scope);

    const [rows] = await db.execute(
      `SELECT
         b.booking_id,
         b.customer_id,
         b.vehicle_id,
         b.slot_id,
         b.booking_date,
         b.reservation_time,
         b.expected_entry_time,
         b.expected_exit_time,
         b.booking_status,
         b.booking_source
       FROM bookings b
       JOIN parking_slots s ON s.slot_id = b.slot_id
       JOIN parking_layouts l ON l.layout_id = s.layout_id
       WHERE b.booking_id = ?
         AND ${filter.sql}
       LIMIT 1`,
      [bookingId, ...filter.params]
    );

    // Return 404 for both nonexistent and inaccessible bookings.
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Fetching booking failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking.",
    });
  }
}

async function updateBookingStatus(req, res) {
  const bookingId = Number(req.params.id);
  const { booking_status } = req.body || {};

  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID.",
    });
  }

  if (
    typeof booking_status !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      ALLOWED_STATUS_TRANSITIONS,
      booking_status
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking status.",
    });
  }

  let connection;

  try {
    const scope = await resolveBookingScope(req);

    if (scope.error) {
      return sendScopeError(res, scope);
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT
         b.booking_id,
         b.customer_id,
         b.booking_status,
         l.location_id
       FROM bookings b
       JOIN parking_slots s ON s.slot_id = b.slot_id
       JOIN parking_layouts l ON l.layout_id = s.layout_id
       WHERE b.booking_id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const booking = rows[0];

    if (!canAccessBooking(scope, booking)) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const role = normalizeRole(req.user.role);
    const currentStatus = booking.booking_status;

    // Customers may cancel their own pending or confirmed booking,
    // but cannot confirm, activate, or complete a booking themselves.
    if (role === "CUSTOMER") {
      if (booking_status !== "CANCELLED") {
        await connection.rollback();

        return res.status(403).json({
          success: false,
          message: "Customers may only cancel their own bookings.",
        });
      }

      if (!["PENDING", "CONFIRMED"].includes(currentStatus)) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: `Cannot cancel a booking with status ${currentStatus}.`,
        });
      }
    } else {
      const allowedNextStatuses =
        ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedNextStatuses.includes(booking_status)) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: `Cannot change booking status from ${currentStatus} to ${booking_status}.`,
        });
      }
    }

    await connection.execute(
      `UPDATE bookings
       SET booking_status = ?
       WHERE booking_id = ?`,
      [booking_status, bookingId]
    );

    await writeAuditLog(connection, {
      userId: req.user.user_id,
      moduleName: "BOOKINGS",
      action: `STATUS_CHANGED booking_id=${bookingId} from=${currentStatus} to=${booking_status}`,
      ipAddress: req.ip,
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      booking_id: bookingId,
      previous_status: currentStatus,
      booking_status,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Status update rollback failed:", rollbackError.message);
      }
    }

    console.error("Updating booking status failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking status.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
};
