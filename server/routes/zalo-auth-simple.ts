import { Router, Request, Response } from 'express';

const router = Router();

// Simple test endpoint
router.get('/test', (req: Request, res: Response) => {
  console.log('=== SIMPLE ZALO AUTH TEST ENDPOINT HIT ===');
  res.json({ 
    success: true, 
    message: 'Simple Zalo auth router is working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    originalUrl: req.originalUrl
  });
});

// Simple login endpoint
router.get('/login', (req: Request, res: Response) => {
  console.log('=== SIMPLE ZALO LOGIN CALLED ===');
  res.json({ 
    success: true, 
    message: 'Zalo login endpoint working!',
    query: req.query
  });
});

// Simple callback endpoint  
router.get('/callback', (req: Request, res: Response) => {
  console.log('=== SIMPLE ZALO CALLBACK CALLED ===');
  res.json({ 
    success: true, 
    message: 'Zalo callback endpoint working!',
    query: req.query
  });
});

export default router;