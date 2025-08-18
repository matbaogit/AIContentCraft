# Zalo Development Setup Guide

## Current Issue Analysis:
- **Error**: -14003 "Invalid redirect_uri" 
- **Callback URL added**: `https://toolbox.vn/api/zalo-proxy/callback` ✅
- **Problem**: Proxy endpoints not deployed to toolbox.vn yet

## Immediate Solutions:

### Option 1: Direct Development Setup (Fastest)
For immediate testing, add your Replit domain directly to Zalo Developer Console:

**Add this callback URL:**
```
https://11a56b9f-4269-48a7-b12d-cde3c89de60d-00-28s4cntgjrwsd.riker.replit.dev/api/auth/zalo/callback
```

**Switch to direct OAuth temporarily:**
1. Set environment variable: `FORCE_DIRECT_OAUTH=true`
2. Test OAuth flow directly without proxy

### Option 2: Deploy Proxy to toolbox.vn (Production Ready)
1. Upload proxy files to toolbox.vn
2. Configure environment variables
3. Test complete proxy flow

## Quick Fix Implementation:
I'll add a development mode that allows direct OAuth while keeping proxy for production.