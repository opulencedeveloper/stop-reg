const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route provider pages to provider template
app.get(/^\/providers\//, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'provider', 'index.html'));
});

// Route domain pages to domain template
app.get(/^\/domains\//, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'domain', 'index.html'));
});

// SPA fallback - serve index.html for all other routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Clean URL routing:');
  console.log('  /providers/* → /public/provider/index.html');
  console.log('  /domains/*   → /public/domain/index.html');
  console.log('  /*           → /public/index.html');
});
