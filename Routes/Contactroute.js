import express from 'express';
import { submitContact, getAllContacts, updateContactStatus, deleteContact } from '../Controller/ContactController.js';
import { auth, requireAdmin } from '../Middleware/auth.js';

const router = express.Router();

router.post('/submit', auth, submitContact);
router.get('/all', auth, requireAdmin, getAllContacts);
router.put('/:id', auth, requireAdmin, updateContactStatus);
router.delete('/:id', auth, requireAdmin, deleteContact);

export default router;