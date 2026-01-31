import Contact from '../Model/ContactModel.js';

export async function submitContact(req, res) {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Please login to submit a support request' });
    }
    
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      userId: req.user._id
    });
    
    return res.status(201).json({ message: 'Support request submitted successfully!' });
  } catch (err) {
    console.error('submitContact error:', err);
    return res.status(500).json({ message: 'Failed to submit request. Please try again.' });
  }
}

export async function getAllContacts(req, res) {
  try {
    const contacts = await Contact.find()
      .populate('userId', 'name email')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return res.json(contacts);
  } catch (err) {
    console.error('getAllContacts error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function getUserContacts(req, res) {
  try {
    const contacts = await Contact.find({ userId: req.user._id })
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return res.json(contacts);
  } catch (err) {
    console.error('getUserContacts error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function updateContactStatus(req, res) {
  try {
    const { status, adminResponse } = req.body;
    const contactId = req.params.id;
    
    const updates = { status };
    if (adminResponse) {
      updates.adminResponse = adminResponse.trim();
      updates.respondedBy = req.user._id;
      updates.respondedAt = new Date();
    }
    
    const contact = await Contact.findByIdAndUpdate(contactId, updates, { new: true })
      .populate('userId', 'name email')
      .populate('respondedBy', 'name email');
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    return res.json({ message: 'Contact updated successfully', contact });
  } catch (err) {
    console.error('updateContactStatus error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function submitFeedback(req, res) {
  try {
    const { satisfied, rating, comment } = req.body;
    const contactId = req.params.id;
    
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    
    if (contact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const updates = {
      userFeedback: {
        satisfied,
        rating,
        comment: comment?.trim(),
        submittedAt: new Date()
      },
      followUpNeeded: !satisfied,
      status: satisfied ? 'Closed' : 'Open'
    };
    
    const updatedContact = await Contact.findByIdAndUpdate(contactId, updates, { new: true })
      .populate('respondedBy', 'name email');
    
    return res.json({ message: 'Feedback submitted successfully', contact: updatedContact });
  } catch (err) {
    console.error('submitFeedback error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}

export async function deleteContact(req, res) {
  try {
    const contactId = req.params.id;
    
    const contact = await Contact.findByIdAndDelete(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    return res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('deleteContact error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
}