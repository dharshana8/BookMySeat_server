import express from 'express';
import { submitContact, getAllContacts, getUserContacts, updateContactStatus, submitFeedback, deleteContact } from '../Controller/ContactController.js';
import { auth, requireAdmin } from '../Middleware/auth.js';

const router = express.Router();

router.post('/submit', auth, submitContact);
router.get('/all', auth, requireAdmin, getAllContacts);
router.get('/my-tickets', auth, getUserContacts);
router.put('/:id', auth, requireAdmin, updateContactStatus);
router.post('/:id/feedback', auth, submitFeedback);
router.delete('/:id', auth, requireAdmin, deleteContact);

export default router;