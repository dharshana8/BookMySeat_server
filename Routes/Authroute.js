import express from 'express';
import { signup, login, verifyToken } from '../Controller/Authcontroller.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', verifyToken);

export default router;
