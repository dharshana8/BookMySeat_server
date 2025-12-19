import express from 'express';
import { listBuses, getBus, createBus, editBus, deleteBus, bookSeats, getBookingsForUser, getAllBookings, updateBusDelay, cancelBooking, clearBusDelay, getDelayHistory } from '../Controller/Buscontroller.js';
import { auth, requireAdmin } from '../Middleware/auth.js';
import Booking from '../Model/Bookingmodel.js';
import Bus from '../Model/Busmodel.js';
const router = express.Router();

router.get('/', listBuses);
router.get('/:id', getBus);
router.post('/', auth, requireAdmin, createBus);
router.put('/:id', auth, requireAdmin, editBus);
router.delete('/:id', auth, requireAdmin, deleteBus);
router.post('/:id/hold', auth, async (req, res) => {
  try {
    const { seats } = req.body;
    if (!seats || seats.length === 0) {
      return res.status(400).json({ message: 'No seats selected' });
    }
    
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    
    // Clean expired holds
    const now = new Date();
    bus.heldSeats = (bus.heldSeats || []).filter(h => h.expiresAt > now);
    
    // Check if seats are available
    for (const s of seats) {
      if (bus.bookedSeats && bus.bookedSeats.includes(s)) {
        return res.status(400).json({ message: `Seat ${s} already booked` });
      }
      const hold = bus.heldSeats.find(h => h.seat === s && String(h.userId) !== String(req.user._id));
      if (hold) {
        return res.status(400).json({ message: `Seat ${s} is temporarily held` });
      }
    }
    
    // Remove existing holds for this user
    bus.heldSeats = bus.heldSeats.filter(h => String(h.userId) !== String(req.user._id));
    
    // Add new holds (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    seats.forEach(seat => {
      bus.heldSeats.push({ seat, userId: req.user._id, expiresAt });
    });
    
    await bus.save();
    return res.json({ message: 'Seats held', expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.post('/:id/book', auth, bookSeats);
router.post('/bookings/:id/cancel', auth, cancelBooking);
router.post('/bookings/:bookingId/cancel', auth, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide a cancellation reason (minimum 5 characters)' });
    }
    
    const booking = await Booking.findById(bookingId).populate('bus');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Check ownership
    if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to cancel this booking' });
    }
    
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }
    
    // Calculate refund based on time before departure
    const now = new Date();
    const departureTime = new Date(booking.bus.departure);
    const hoursBeforeDeparture = (departureTime - now) / (1000 * 60 * 60);
    
    let refundPercentage;
    if (hoursBeforeDeparture >= 24) refundPercentage = 90;
    else if (hoursBeforeDeparture >= 12) refundPercentage = 75;
    else if (hoursBeforeDeparture >= 6) refundPercentage = 50;
    else if (hoursBeforeDeparture >= 2) refundPercentage = 25;
    else refundPercentage = 0;
    
    const refundAmount = Math.round((booking.payment.finalAmount * refundPercentage) / 100);
    
    // Mark booking as cancelled
    booking.status = 'Cancelled';
    booking.cancellation = { 
      cancelledAt: new Date(), 
      reason: reason.trim(),
      refundPercentage, 
      refundAmount,
      refundStatus: refundAmount > 0 ? 'Processing' : 'No Refund',
      estimatedRefundDate: refundAmount > 0 ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : null
    };
    await booking.save();
    
    // Free seats on bus immediately
    const bus = await Bus.findOne({ id: booking.bus.id });
    if (bus) {
      bus.availableSeats = (bus.availableSeats || 0) + booking.seats.length;
      bus.bookedSeats = (bus.bookedSeats || []).filter(s => !booking.seats.includes(s));
      await bus.save();
    }
    
    return res.json({ 
      success: true,
      message: 'Booking cancelled successfully',
      refundAmount, 
      refundPercentage,
      refundStatus: booking.cancellation.refundStatus,
      estimatedRefundDate: booking.cancellation.estimatedRefundDate
    });
  } catch (err) { 
    console.error(err); 
    return res.status(500).json({ message: 'Unable to cancel booking. Please try again.' }); 
  }
});
router.get('/me/bookings', auth, getBookingsForUser);
router.get('/admin/bookings', auth, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('bus')
      .populate('user', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const out = bookings.map(b => ({ 
      ...b, 
      id: b._id,
      busDetails: b.bus // Add busDetails for frontend compatibility
    }));
    return res.json(out);
  } catch (err) { 
    console.error(err); 
    return res.status(500).json({ message: 'Server error' }); 
  }
});

// Download ticket
router.get('/bookings/:bookingId/download', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('bus')
      .populate('user', 'name email');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const ticketData = {
      bookingId: booking._id,
      passengerName: booking.user.name,
      email: booking.user.email,
      busName: booking.bus.name,
      route: `${booking.bus.from} → ${booking.bus.to}`,
      departure: booking.bus.departure,
      arrival: booking.bus.arrival,
      seats: booking.seats,
      amount: booking.payment.finalAmount,
      status: booking.status,
      bookingDate: booking.createdAt
    };
    
    res.json({ success: true, ticket: ticketData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to generate ticket' });
  }
});

// Track booking
router.get('/bookings/:bookingId/track', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('bus')
      .populate('user', 'name');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Simulate tracking data
    const now = new Date();
    const departure = new Date(booking.bus.departure);
    const arrival = new Date(booking.bus.arrival);
    
    let trackingStatus = 'Not Started';
    let currentLocation = booking.bus.from;
    
    if (now >= departure && now < arrival) {
      trackingStatus = 'In Transit';
      currentLocation = 'En route';
    } else if (now >= arrival) {
      trackingStatus = 'Arrived';
      currentLocation = booking.bus.to;
    }
    
    const trackingData = {
      bookingId: booking._id,
      busName: booking.bus.name,
      route: `${booking.bus.from} → ${booking.bus.to}`,
      status: trackingStatus,
      currentLocation,
      departure: booking.bus.departure,
      arrival: booking.bus.arrival,
      estimatedArrival: arrival,
      lastUpdated: new Date()
    };
    
    res.json({ success: true, tracking: trackingData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to get tracking info' });
  }
});

// Clear all bookings (admin only)
router.delete('/admin/bookings/clear', auth, requireAdmin, async (req, res) => {
  try {
    await Booking.deleteMany({});
    // Reset all bus seats
    await Bus.updateMany({}, { $set: { bookedSeats: [], availableSeats: '$totalSeats' } });
    return res.json({ message: 'All bookings cleared successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/delay', auth, requireAdmin, updateBusDelay);
router.delete('/:id/delay', auth, requireAdmin, clearBusDelay);
router.get('/admin/delays', auth, requireAdmin, getDelayHistory);

export default router;
