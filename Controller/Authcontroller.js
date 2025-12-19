import User from '../Model/Usermodel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }
  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Account already exists with this email. Please login instead.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    
    // Auto-assign admin role for @bookmyseat.com emails
    const role = email.toLowerCase().endsWith('@bookmyseat.com') ? 'admin' : 'user';
    
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ 
      success: true,
      message: `Account created successfully! Welcome to BookMySeat${role === 'admin' ? ' Admin Panel' : ''}.`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Unable to create account. Please try again later.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Account not found. Please check your email or sign up.' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ 
      success: true,
      message: 'Login successful! Welcome back.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Unable to connect to server. Please try again later.' });
  }
}

export async function verifyToken(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
