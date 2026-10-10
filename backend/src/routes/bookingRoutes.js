
const express = require("express");

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", createBooking);
router.get("/", getAllBookings);
router.get("/:id", getBookingById);

// Update booking status
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
