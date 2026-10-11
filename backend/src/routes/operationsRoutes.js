const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticateToken);

// -------------------------------------------------------------
// MODULE 3.3: QR CODE & ENTRY MANAGEMENT
// -------------------------------------------------------------

// FR-3.3.1: Get QR Code and OTP for a booking
router.get("/qr/:bookingId", async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  try {
    const [rows] = await db.execute(
      `SELECT q.qr_code, q.otp, q.expiry_time, q.verification_status,
              b.booking_id, b.slot_id, b.booking_status
       FROM bookings b
       LEFT JOIN qr_verifications q ON q.booking_id = b.booking_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    let record = rows[0];

    // If QR record doesn't exist yet, auto-generate one
    if (!record.qr_code) {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const qrPayload = `CPOS-ENTRY:BK-${bookingId}:OTP-${generatedOtp}`;
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.execute(
        `INSERT INTO qr_verifications (booking_id, qr_code, otp, expiry_time, verification_status)
         VALUES (?, ?, ?, ?, 'PENDING')`,
        [bookingId, qrPayload, generatedOtp, expiry]
      );

      record = {
        booking_id: bookingId,
        slot_id: record.slot_id,
        booking_status: record.booking_status,
        qr_code: qrPayload,
        otp: generatedOtp,
        expiry_time: expiry,
        verification_status: "PENDING"
      };
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error("QR lookup error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve QR code." });
  }
});

// FR-3.3.2 & FR-3.3.3: Operator verifies QR/OTP for Vehicle Entry
router.post("/entry/verify", requireRole(["PARKING_OPERATOR", "BRANCH_MANAGER", "SUPER_ADMINISTRATOR"]), async (req, res) => {
  const { otp, booking_id } = req.body;
  if (!otp && !booking_id) {
    return res.status(400).json({ success: false, message: "Booking ID or OTP required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let query = `SELECT q.*, b.slot_id, b.booking_status 
                 FROM qr_verifications q 
                 JOIN bookings b ON b.booking_id = q.booking_id 
                 WHERE `;
    const params = [];
    if (otp) {
      query += `q.otp = ?`;
      params.push(String(otp).trim());
    } else {
      query += `q.booking_id = ?`;
      params.push(Number(booking_id));
    }

    const [qrs] = await connection.execute(query, params);
    if (qrs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Invalid or unrecognized QR/OTP pass." });
    }

    const record = qrs[0];

    // Transition booking to ACTIVE and slot to OCCUPIED
    await connection.execute(
      `UPDATE bookings SET booking_status = 'ACTIVE' WHERE booking_id = ?`,
      [record.booking_id]
    );

    await connection.execute(
      `UPDATE parking_slots SET slot_status = 'OCCUPIED', occupied = TRUE WHERE slot_id = ?`,
      [record.slot_id]
    );

    await connection.execute(
      `UPDATE qr_verifications SET verification_status = 'VERIFIED' WHERE qr_id = ?`,
      [record.qr_id]
    );

    // Record parking session check-in
    await connection.execute(
      `INSERT INTO parking_sessions (booking_id, check_in_time, session_status)
       VALUES (?, NOW(), 'ACTIVE')`,
      [record.booking_id]
    );

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Vehicle Check-in verified for Booking #${record.booking_id}. Slot #${record.slot_id} marked Occupied.`,
      booking_id: record.booking_id,
      slot_id: record.slot_id
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Entry verification error:", err.message);
    return res.status(500).json({ success: false, message: "Entry verification failed." });
  } finally {
    if (connection) connection.release();
  }
});

// FR-3.3.4: Operator marks Vehicle Exit & releases Slot
router.post("/exit/verify", requireRole(["PARKING_OPERATOR", "BRANCH_MANAGER", "SUPER_ADMINISTRATOR"]), async (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ success: false, message: "Booking ID is required for checkout." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [bks] = await connection.execute(
      `SELECT booking_id, slot_id, booking_status FROM bookings WHERE booking_id = ?`,
      [Number(booking_id)]
    );

    if (bks.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const booking = bks[0];

    await connection.execute(
      `UPDATE bookings SET booking_status = 'COMPLETED' WHERE booking_id = ?`,
      [booking.booking_id]
    );

    await connection.execute(
      `UPDATE parking_slots SET slot_status = 'AVAILABLE', occupied = FALSE WHERE slot_id = ?`,
      [booking.slot_id]
    );

    await connection.execute(
      `UPDATE parking_sessions 
       SET check_out_time = NOW(), session_status = 'COMPLETED'
       WHERE booking_id = ? AND session_status = 'ACTIVE'`,
      [booking.booking_id]
    );

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Vehicle Checkout complete for Booking #${booking.booking_id}. Slot #${booking.slot_id} is now Available.`,
      booking_id: booking.booking_id,
      slot_id: booking.slot_id
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Exit verification error:", err.message);
    return res.status(500).json({ success: false, message: "Exit verification failed." });
  } finally {
    if (connection) connection.release();
  }
});

// -------------------------------------------------------------
// MODULE 3.4: PAYMENT & INVOICE MANAGEMENT
// -------------------------------------------------------------

// FR-3.4.1: Process Online Payment
router.post("/payments/process", async (req, res) => {
  const { booking_id, payment_method, amount } = req.body;
  if (!booking_id || !payment_method) {
    return res.status(400).json({ success: false, message: "Booking ID and payment method required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const txRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payAmount = Number(amount || 25.00);
    const tax = Number((payAmount * 0.10).toFixed(2));
    const total = Number((payAmount + tax).toFixed(2));

    const [payResult] = await connection.execute(
      `INSERT INTO payments (booking_id, amount, tax, payment_method, transaction_reference, payment_status, payment_date)
       VALUES (?, ?, ?, ?, ?, 'COMPLETED', NOW())`,
      [Number(booking_id), payAmount, tax, payment_method, txRef]
    );

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(payResult.insertId).padStart(5, '0')}`;
    await connection.execute(
      `INSERT INTO invoices (booking_id, payment_id, invoice_number, subtotal, tax, total_amount, generated_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [Number(booking_id), payResult.insertId, invoiceNumber, payAmount, tax, total]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Payment processed and digital invoice generated.",
      data: {
        payment_id: payResult.insertId,
        transaction_reference: txRef,
        invoice_number: invoiceNumber,
        total_amount: total
      }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Payment error:", err.message);
    return res.status(500).json({ success: false, message: "Payment processing failed." });
  } finally {
    if (connection) connection.release();
  }
});

// FR-3.4.2 & FR-3.4.3: Get Invoices & Payment History for Booking or User
router.get("/invoices/booking/:bookingId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT i.*, p.payment_method, p.transaction_reference, p.payment_status
       FROM invoices i
       JOIN payments p ON p.payment_id = i.payment_id
       WHERE i.booking_id = ?`,
      [Number(req.params.bookingId)]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch invoices." });
  }
});

// -------------------------------------------------------------
// MODULE 3.5: PARKING MANAGEMENT & PRICING
// -------------------------------------------------------------

router.get("/pricing", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, l.location_name 
       FROM pricing_policies p 
       JOIN parking_locations l ON l.location_id = p.location_id`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch pricing." });
  }
});

router.post("/pricing", requireRole(["BRANCH_MANAGER", "SUPER_ADMINISTRATOR"]), async (req, res) => {
  const { location_id, vehicle_type, hourly_rate, daily_rate } = req.body;
  try {
    await db.execute(
      `INSERT INTO pricing_policies (location_id, vehicle_type, hourly_rate, daily_rate, effective_from)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [location_id || 1, vehicle_type || 'FOUR_WHEELER', hourly_rate || 20.00, daily_rate || 150.00]
    );
    return res.status(201).json({ success: true, message: "Pricing policy configured successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to configure pricing." });
  }
});

// -------------------------------------------------------------
// MODULE 3.6: VIRTUAL QUEUE MANAGEMENT
// -------------------------------------------------------------

router.get("/queue", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT q.*, u.full_name, u.email 
       FROM virtual_queues q 
       JOIN customers c ON c.customer_id = q.customer_id
       JOIN users u ON u.user_id = c.user_id
       WHERE q.queue_status = 'WAITING'
       ORDER BY q.queue_number ASC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch queue." });
  }
});

router.post("/queue/join", async (req, res) => {
  try {
    const [customers] = await db.execute("SELECT customer_id FROM customers WHERE user_id = ?", [req.user.user_id]);
    const customerId = customers[0]?.customer_id || 1;

    const [maxQ] = await db.execute("SELECT MAX(queue_number) AS max_num FROM virtual_queues WHERE queue_status = 'WAITING'");
    const nextNum = (maxQ[0]?.max_num || 0) + 1;

    const [result] = await db.execute(
      `INSERT INTO virtual_queues (customer_id, location_id, queue_number, queue_status)
       VALUES (?, 1, ?, 'WAITING')`,
      [customerId, nextNum]
    );

    return res.status(201).json({
      success: true,
      message: `Joined virtual queue at Position #${nextNum}. You will be notified when a slot opens.`,
      queue_id: result.insertId,
      queue_position: nextNum
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to join queue." });
  }
});

// -------------------------------------------------------------
// MODULE 3.7: DIGITAL VALET MANAGEMENT
// -------------------------------------------------------------

router.get("/valet", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.*, b.slot_id, veh.vehicle_number, veh.model
       FROM valet_tasks v
       JOIN bookings b ON b.booking_id = v.booking_id
       JOIN vehicles veh ON veh.vehicle_id = v.vehicle_id
       ORDER BY v.valet_id DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch valet tasks." });
  }
});

router.post("/valet/request-retrieval", async (req, res) => {
  const { valet_id } = req.body;
  try {
    await db.execute(
      `UPDATE valet_tasks 
       SET retrieval_requested = TRUE, requested_at = NOW(), valet_status = 'RETRIEVAL_REQUESTED'
       WHERE valet_id = ?`,
      [Number(valet_id)]
    );
    return res.status(200).json({ success: true, message: "Vehicle retrieval requested. Valet dispatched." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to request retrieval." });
  }
});

// -------------------------------------------------------------
// MODULE 3.8: VIOLATION & PENALTY MANAGEMENT
// -------------------------------------------------------------

router.get("/violations", async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM violations ORDER BY violation_id DESC`);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch violations." });
  }
});

router.post("/violations/issue", requireRole(["PARKING_OPERATOR", "BRANCH_MANAGER", "SUPER_ADMINISTRATOR"]), async (req, res) => {
  const { vehicle_number, violation_type, fine_amount, booking_id } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO violations (booking_id, vehicle_number, violation_type, fine_amount, penalty_status)
       VALUES (?, ?, ?, ?, 'ISSUED')`,
      [booking_id || null, vehicle_number || 'UNKNOWN', violation_type || 'OVERSTAY', fine_amount || 50.00]
    );
    return res.status(201).json({ success: true, message: "Penalty notice recorded.", violation_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to record violation." });
  }
});

router.post("/violations/dispute", async (req, res) => {
  const { violation_id, dispute_reason } = req.body;
  try {
    await db.execute(
      `UPDATE violations SET penalty_status = 'DISPUTED', dispute_reason = ? WHERE violation_id = ?`,
      [dispute_reason, Number(violation_id)]
    );
    return res.status(200).json({ success: true, message: "Dispute submitted for manager review." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to submit dispute." });
  }
});

// -------------------------------------------------------------
// MODULE 3.9: REPORTS & ANALYTICS
// -------------------------------------------------------------

router.get("/analytics/summary", requireRole(["BRANCH_MANAGER", "SUPER_ADMINISTRATOR"]), async (req, res) => {
  try {
    const [slotStats] = await db.execute(
      `SELECT 
         COUNT(*) AS total_slots,
         SUM(CASE WHEN occupied = TRUE OR slot_status = 'OCCUPIED' THEN 1 ELSE 0 END) AS occupied_slots
       FROM parking_slots`
    );

    const [revStats] = await db.execute(
      `SELECT 
         IFNULL(SUM(total_amount), 0) AS total_revenue,
         COUNT(*) AS total_invoices
       FROM invoices`
    );

    const [bkStats] = await db.execute(
      `SELECT 
         COUNT(*) AS total_reservations,
         SUM(CASE WHEN booking_status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_reservations,
         SUM(CASE WHEN booking_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_reservations
       FROM bookings`
    );

    const totalSlots = slotStats[0]?.total_slots || 12;
    const occupiedSlots = slotStats[0]?.occupied_slots || 0;
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total_slots: totalSlots,
        occupied_slots: occupiedSlots,
        available_slots: totalSlots - occupiedSlots,
        occupancy_rate: `${occupancyRate}%`,
        total_revenue: revStats[0]?.total_revenue || 0,
        total_invoices: revStats[0]?.total_invoices || 0,
        reservations: bkStats[0] || {}
      }
    });
  } catch (err) {
    console.error("Analytics error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate analytics summary." });
  }
});

module.exports = router;
