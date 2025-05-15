const express = require('express');
const router = express.Router();
const Client = require('../models/client');

// Get all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single client
router.get('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a client
router.post('/clients', async (req, res) => {
  const client = new Client({
    name: req.body.name,
    code: req.body.code,
    contactName: req.body.contactName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    notes: req.body.notes
  });

  try {
    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a client
router.patch('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (req.body.name) client.name = req.body.name;
    if (req.body.code) client.code = req.body.code;
    if (req.body.contactName !== undefined) client.contactName = req.body.contactName;
    if (req.body.email !== undefined) client.email = req.body.email;
    if (req.body.phone !== undefined) client.phone = req.body.phone;
    if (req.body.address) client.address = req.body.address;
    if (req.body.active !== undefined) client.active = req.body.active;
    if (req.body.notes !== undefined) client.notes = req.body.notes;
    
    client.updatedAt = Date.now();
    
    const updatedClient = await client.save();
    res.json(updatedClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a client
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;