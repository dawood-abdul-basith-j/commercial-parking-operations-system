
const express = require("express");

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
} = require("../controllers/bookingController");

const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// All booking endpoints require a valid JWT.
router.use(authenticateToken);

router.post("/", createBooking);
router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
