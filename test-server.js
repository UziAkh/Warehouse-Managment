const express = require('express');
const app = express();

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello World! Server is working.');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});