import express from 'express';

const app = express();

// Test endpoint chỉ cho Zalo auth
app.get('/api/auth/zalo/test', (req, res) => {
  console.log('=== ZALO TEST ENDPOINT HIT ===');
  res.json({ 
    success: true, 
    message: 'Zalo test working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/zalo/login', (req, res) => {
  console.log('=== ZALO LOGIN ENDPOINT HIT ===');
  res.json({ 
    success: true, 
    message: 'Zalo login working!',
    query: req.query
  });
});

app.get('/api/auth/zalo/callback', (req, res) => {
  console.log('=== ZALO CALLBACK ENDPOINT HIT ===');
  console.log('Query params:', req.query);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Zalo Callback</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>✅ Zalo Callback Working!</h1>
      <p>Query: ${JSON.stringify(req.query)}</p>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'ZALO_LOGIN_SUCCESS',
            message: 'Test callback successful'
          }, window.location.origin);
          window.close();
        }
      </script>
    </body>
    </html>
  `);
});

const port = 3001;
app.listen(port, () => {
  console.log(`Zalo test server running on port ${port}`);
});