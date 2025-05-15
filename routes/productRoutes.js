const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a product
router.post('/products', async (req, res) => {
  const product = new Product({
    name: req.body.name,
    sku: req.body.sku,
    upc: req.body.upc,
    description: req.body.description,
    quantity: req.body.quantity || 0
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product
router.patch('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (req.body.name) product.name = req.body.name;
    if (req.body.sku) product.sku = req.body.sku;
    if (req.body.upc !== undefined) product.upc = req.body.upc;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.quantity !== undefined) product.quantity = req.body.quantity;
    product.updatedAt = Date.now();
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get product by UPC
router.get('/products/upc/:upc', async (req, res) => {
  try {
    console.log("Looking up UPC:", req.params.upc); // Debug log
    const product = await Product.findOne({ upc: req.params.upc });
    
    if (!product) {
      console.log("No product found for UPC:", req.params.upc);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log("Found product:", product.name, "for UPC:", req.params.upc);
    res.json(product);
  } catch (err) {
    console.error("UPC lookup error:", err);
    res.status(500).json({ message: err.message });
  }
});

// In productRoutes.js

// Get all products
router.get('/products', async (req, res) => {
  try {
    let query = {};
    
    // Filter by client if specified
    if (req.query.client) {
      query.client = req.query.client;
    }
    
    const products = await Product.find(query)
      .populate('client', 'name code') // Make sure this populate is included
      .sort({ name: 1 });
      
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Also update the single product endpoint
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('client', 'name code');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;