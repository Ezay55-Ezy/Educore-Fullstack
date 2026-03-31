# EduCore Frontend - Vite Setup

## Quick Start

### 1. Install Dependencies
```bash
cd educore-frontend
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

The `.env` file should contain:
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=EduCore
VITE_APP_ENV=development
```

### 3. Start Development Server
```bash
npm run dev
```

Server will start on **http://localhost:3000** with automatic proxy to backend at `http://localhost:5000`

### 4. Debug Mode
Open browser console (F12) and watch for these logs during login:

```
=== EduCore Login Submission ===
EduCore: Login Started
Admission No: [your-admission-no]
CONFIG loaded: true
API_BASE_URL from CONFIG: http://localhost:5000/api
Target API Endpoint: http://localhost:5000/api/auth/login
Fetching from: http://localhost:5000/api/auth/login
Auth Response Status: 200 OK
Auth Response Data: {...}
✅ Login successful! Redirecting...
```

**If you see "❌ Login Error"** check:
- Backend running on port 5000? → `curl http://localhost:5000/`
- Network tab shows request? → F12 → Network
- Response status code? → Should be 200 or 401 (not stuck/timeout)
- CORS errors? → Check browser console

## Build for Production

```bash
npm run build
npm run preview
```

## Why Vite?
- ⚡ **Fast HMR** (Hot Module Replacement) - instant updates on save
- 📦 **Light setup** - minimal dev dependencies
- 🔧 **Proxy support** - `/api` routes automatically forward to backend
- ✅ **React ready** - plug-and-play React support

## Troubleshooting

### Port 3000 already in use
```bash
npx kill-port 3000
npm run dev
```

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:5000/

# If not, start it
cd ../educore-backend
npm start
```

### Login button still freezes
1. Check browser console (F12) for error logs
2. Check Network tab to see if request is being sent
3. Verify `VITE_API_URL` in .env matches backend URL
4. Restart dev server: `npm run dev`
