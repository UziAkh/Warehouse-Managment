const express = require('express');
const mongoose = require('mongoose');  // Add this line
const router = express.Router();
const Transaction = require('../models/transaction');
const Product = require('../models/product');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Transactions route is working' });
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('product', 'name sku')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get transactions for a specific product
router.get('/products/:productId/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ product: req.params.productId })
      .populate('product', 'name sku')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an inbound transaction (receive inventory)
router.post('/transactions/inbound', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { productId, quantity, reference, notes } = req.body;
    
    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Product ID and positive quantity are required' });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + quantity;
    
    // Update product quantity
    product.quantity = newQuantity;
    product.updatedAt = Date.now();
    await product.save({ session });
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'inbound',
      product: productId,
      quantity,
      previousQuantity,
      newQuantity,
      reference,
      notes
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate product details in response
    await transaction.populate('product', 'name sku');
    
    res.status(201).json(transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
});

// Create an outbound transaction (ship inventory)
router.post('/transactions/outbound', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { productId, quantity, reference, notes } = req.body;
    
    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Product ID and positive quantity are required' });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if enough inventory
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Not enough inventory available' });
    }
    
    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity - quantity;
    
    // Update product quantity
    product.quantity = newQuantity;
    product.updatedAt = Date.now();
    await product.save({ session });
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'outbound',
      product: productId,
      quantity,
      previousQuantity,
      newQuantity,
      reference,
      notes
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate product details in response
    await transaction.populate('product', 'name sku');
    
    res.status(201).json(transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;