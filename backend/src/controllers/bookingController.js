
const db = require("../config/db");

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];

async function createBooking(req, res) {
  const {
    customer_id,
    vehicle_id,
    slot_id,
    expected_entry_time,
    expected_exit_time,
    booking_source = "ONLINE",
  } = req.body;

  if (
    !customer_id ||
    !vehicle_id ||
    !slot_id ||
    !expected_entry_time ||
    !expected_exit_time
  ) {
    return res.status(400).json({
      success: false,
      message: "Customer, vehicle, slot, entry time and exit time are required.",
    });
  }

  const entryTime = new Date(expected_entry_time);
  const exitTime = new Date(expected_exit_time);

  if (
    Number.isNaN(entryTime.getTime()) ||
    Number.isNaN(exitTime.getTime()) ||
    exitTime <= entryTime
  ) {
    return res.status(400).json({
      success: false,
      message: "Exit time must be later than entry time.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Serialize booking attempts for the same slot.
    const [slots] = await connection.execute(
      `SELECT slot_id, is_active
       FROM parking_slots
       WHERE slot_id = ?
       FOR UPDATE`,
      [slot_id]
    );

    if (slots.length === 0 || slots[0].is_active !== 1) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Parking slot does not exist or is inactive.",
      });
    }

    // Verify that the vehicle belongs to the supplied customer.
    const [vehicles] = await connection.execute(
      `SELECT vehicle_id
       FROM vehicles
       WHERE vehicle_id = ? AND customer_id = ?`,
      [vehicle_id, customer_id]
    );

    if (vehicles.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "The selected vehicle does not belong to this customer.",
      });
    }

    // Overlap exists when existing entry < requested exit
    // and existing exit > requested entry.
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
        slot_id,
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
        customer_id,
        vehicle_id,
        slot_id,
        expected_entry_time,
        expected_exit_time,
        booking_source,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking_id: result.insertId,
      booking_status: "PENDING",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
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
  try {
    const [rows] = await db.execute(`
      SELECT
        booking_id,
        customer_id,
        vehicle_id,
        slot_id,
        booking_date,
        reservation_time,
        expected_entry_time,
        expected_exit_time,
        booking_status,
        booking_source
      FROM bookings
      ORDER BY booking_id DESC
    `);

    return res.status(200).json({
      success: true,
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

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID.",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         booking_id,
         customer_id,
         vehicle_id,
         slot_id,
         booking_date,
         reservation_time,
         expected_entry_time,
         expected_exit_time,
         booking_status,
         booking_source
       FROM bookings
       WHERE booking_id = ?`,
      [bookingId]
    );

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


const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "ACTIVE"],
  ACTIVE: ["COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};

async function updateBookingStatus(req, res) {
  const bookingId = Number(req.params.id);
  const { booking_status } = req.body;

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
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
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT booking_id, booking_status
       FROM bookings
       WHERE booking_id = ?
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

    const currentStatus = rows[0].booking_status;
    const allowedNextStatuses =
      ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(booking_status)) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: `Cannot change booking status from ${currentStatus} to ${booking_status}.`,
      });
    }

    await connection.execute(
      `UPDATE bookings
       SET booking_status = ?
       WHERE booking_id = ?`,
      [booking_status, bookingId]
    );

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
        console.error("Rollback failed:", rollbackError.message);
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
