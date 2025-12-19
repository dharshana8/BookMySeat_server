import express from 'express';
import Coupon from '../Model/Couponmodel.js';
import { auth, requireAdmin } from '../Middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const coupon = new Coupon({ ...req.body, createdBy: req.user._id });
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;