import Bus from '../Model/Busmodel.js';
import Booking from '../Model/Bookingmodel.js';
import User from '../Model/Usermodel.js';
import Delay from '../Model/DelayModel.js';

export async function listBuses(req, res) {
  try {
    const { from, to, date, type, minFare, maxFare } = req.query;
    const q = {};
    if (from) q.from = new RegExp(from, 'i');
    if (to) q.to = new RegExp(to, 'i');
    if (type) q.type = type;
    if (minFare || maxFare) q.fare = {};
    if (minFare) q.fare.$gte = Number(minFare);
    if (maxFare) q.fare.$lte = Number(maxFare);
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      q.departure = { $gte: startDate, $lt: endDate };
    }
    const buses = await Bus.find(q)
      .select('-description -checkpoints')
      .sort({ departure: 1 })
      .lean()
      .limit(100);
    return res.json(buses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function getBus(req, res) {
  try {
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    return res.json(bus);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function createBus(req, res) {
  try {
    const payload = req.body;
    if (!payload.id) payload.id = 'BUS-' + Date.now();
    const bus = await Bus.create(payload);
    return res.status(201).json(bus);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function editBus(req, res) {
  try {
    const bus = await Bus.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    return res.json(bus);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteBus(req, res) {
  try {
    const bus = await Bus.findOneAndDelete({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Helper to clean expired holds
async function cleanExpiredHolds(bus) {
  const now = new Date();
  const validHolds = (bus.heldSeats || []).filter(h => h.expiresAt > now);
  if (validHolds.length !== (bus.heldSeats || []).length) {
    bus.heldSeats = validHolds;
    await bus.save();
  }
}

export async function bookSeats(req, res) {
  try {
    const { seats, payment } = req.body;
    
    if (!seats || seats.length === 0) {
      return res.status(400).json({ message: 'No seats selected' });
    }
    
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    // Clean expired holds first
    await cleanExpiredHolds(bus);
    
    // Validate payment status
    if (!payment || payment.status !== 'Completed') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    
    // Check seats availability (booked or held by others)
    const now = new Date();
    for (const s of seats) {
      if (bus.bookedSeats && bus.bookedSeats.includes(s)) {
        return res.status(400).json({ message: `Seat ${s} already booked` });
      }
      const hold = (bus.heldSeats || []).find(h => h.seat === s && h.expiresAt > now);
      if (hold && String(hold.userId) !== String(req.user._id)) {
        return res.status(400).json({ message: `Seat ${s} is temporarily held` });
      }
    }
    
    // Remove holds for this user's seats
    bus.heldSeats = (bus.heldSeats || []).filter(h => !seats.includes(h.seat) || String(h.userId) !== String(req.user._id));
    
    // Update bus seats permanently
    bus.bookedSeats = [...(bus.bookedSeats || []), ...seats];
    bus.availableSeats = Math.max(0, (bus.availableSeats || bus.totalSeats || 0) - seats.length);
    await bus.save();
    
    // Create confirmed booking with bus details
    let booking = await Booking.create({ 
      user: req.user._id, 
      bus: bus._id, 
      seats, 
      payment, 
      status: 'Confirmed',
      busDetails: {
        name: bus.name,
        from: bus.from,
        to: bus.to,
        operator: bus.operator,
        busNumber: bus.busNumber,
        departure: bus.departure,
        arrival: bus.arrival,
        fare: bus.fare
      }
    });
    
    booking = await booking.populate('user', '-password');
    booking = await booking.populate('bus');
    
    const out = booking.toObject();
    out.id = booking._id;
    out.busDetails = booking.bus;
    
    return res.status(201).json(out);
  } catch (err) {
    console.error('Booking error:', err.message);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function getBookingsForUser(req, res) {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId })
      .populate('bus')
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .lean();
    
    // map to include id field and busDetails for frontend compatibility
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
}

export async function getAllBookings(req, res) {
  try {
    const bookings = await Booking.find()
      .populate('bus')
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .lean();
    const out = bookings.map(b => ({ 
      ...b, 
      id: b._id,
      busDetails: b.bus
    }));
    return res.json(out);
  } catch (err) {
    console.error('getAllBookings error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function updateBusDelay(req, res) {
  try {
    const { delayMinutes, reason } = req.body;
    
    if (!delayMinutes || !reason) {
      return res.status(400).json({ message: 'Delay minutes and reason are required' });
    }
    
    const delay = parseInt(delayMinutes);
    if (isNaN(delay) || delay < 1 || delay > 480) {
      return res.status(400).json({ message: 'Delay must be between 1 and 480 minutes' });
    }
    
    if (reason.trim().length < 3) {
      return res.status(400).json({ message: 'Reason must be at least 3 characters' });
    }
    
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    
    // Store original times if not already delayed
    const originalDeparture = bus.delayInfo?.originalDeparture ? new Date(bus.delayInfo.originalDeparture) : new Date(bus.departure);
    const originalArrival = bus.delayInfo?.originalArrival ? new Date(bus.delayInfo.originalArrival) : new Date(bus.arrival);
    
    const newDeparture = new Date(originalDeparture.getTime() + delay * 60000);
    const newArrival = new Date(originalArrival.getTime() + delay * 60000);
    
    // Create delay record
    const delayRecord = await Delay.create({
      busId: bus.id,
      delayMinutes: delay,
      reason: reason.trim(),
      updatedBy: req.user._id,
      originalDeparture,
      originalArrival,
      newDeparture,
      newArrival
    });
    
    // Update bus
    bus.departure = newDeparture;
    bus.arrival = newArrival;
    bus.delayInfo = {
      isDelayed: true,
      delayMinutes: delay,
      reason: reason.trim(),
      updatedAt: new Date(),
      updatedBy: req.user.name,
      originalDeparture,
      originalArrival,
      delayRecordId: delayRecord._id
    };
    bus.status = `Delayed by ${delay} min`;
    
    await bus.save();
    
    return res.json({ 
      message: 'Bus delay updated successfully', 
      bus,
      delayRecord
    });
  } catch (err) {
    console.error('updateBusDelay error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function clearBusDelay(req, res) {
  try {
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    
    if (!bus.delayInfo?.isDelayed) {
      return res.status(400).json({ message: 'Bus is not delayed' });
    }
    
    // Restore original times
    bus.departure = bus.delayInfo.originalDeparture;
    bus.arrival = bus.delayInfo.originalArrival;
    bus.delayInfo = {
      isDelayed: false,
      clearedAt: new Date(),
      clearedBy: req.user.name
    };
    bus.status = 'On Time';
    
    // Mark delay record as inactive
    if (bus.delayInfo.delayRecordId) {
      await Delay.findByIdAndUpdate(bus.delayInfo.delayRecordId, { isActive: false });
    }
    
    await bus.save();
    
    return res.json({ 
      message: 'Bus delay cleared successfully', 
      bus
    });
  } catch (err) {
    console.error('clearBusDelay error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function getDelayHistory(req, res) {
  try {
    const delays = await Delay.find()
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    return res.json(delays);
  } catch (err) {
    console.error('getDelayHistory error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function cancelBooking(req, res) {
  try {
    const { reason } = req.body;
    const bookingId = req.params.id;
    
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ message: 'Cancellation reason must be at least 5 characters' });
    }
    
    const booking = await Booking.findById(bookingId).populate('bus');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }
    
    // Calculate refund
    const bookingDate = new Date(booking.createdAt);
    const today = new Date();
    const isSameDay = bookingDate.toDateString() === today.toDateString();
    const refundPercentage = isSameDay ? 75 : 50;
    const refundAmount = Math.round((booking.payment.finalAmount * refundPercentage) / 100);
    
    // Update booking status
    booking.status = 'Cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason: reason.trim(),
      refundAmount,
      refundPercentage
    };
    
    await booking.save();
    
    // Restore bus seats
    if (booking.bus) {
      const bus = await Bus.findById(booking.bus._id);
      if (bus) {
        bus.bookedSeats = bus.bookedSeats.filter(seat => !booking.seats.includes(seat));
        bus.availableSeats = Math.min(bus.totalSeats, bus.availableSeats + booking.seats.length);
        await bus.save();
      }
    }
    
    return res.json({ 
      message: 'Booking cancelled successfully',
      refundAmount,
      refundPercentage
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}
