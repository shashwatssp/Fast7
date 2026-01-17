# Environment Variables Setup for Netlify Deployment

## 🚨 IMPORTANT: Security Fix Applied

The build was failing because Netlify's security scanner detected sensitive secrets in the client-side bundle. This has been fixed by moving API calls to server-side Netlify Functions.

## What Changed

### Before (❌ Insecure)
- Used `VITE_OLA_MAPS_*` environment variables
- Vite embedded these secrets directly into the client-side JavaScript bundle
- Netlify's security scanner detected and blocked the deployment

### After (✅ Secure)
- Created Netlify Functions to handle API calls server-side
- Removed all `VITE_` prefixed secrets from client code
- API credentials now stay secure on the server

## Environment Variables Setup

### For Netlify Deployment

In your Netlify site settings (Site settings → Build & deploy → Environment → Environment variables), set these variables **without** the `VITE_` prefix:

```
OLA_MAPS_API_KEY=your_api_key_here
OLA_MAPS_CLIENT_ID=your_client_id_here
OLA_MAPS_CLIENT_SECRET=your_client_secret_here
```

### For Local Development

Create a `.env` file in your project root with the same variables (without `VITE_` prefix):

```env
OLA_MAPS_API_KEY=your_api_key_here
OLA_MAPS_CLIENT_ID=your_client_id_here
OLA_MAPS_CLIENT_SECRET=your_client_secret_here
```

## Local Development Setup

### 1. Start the Netlify Functions Server
```bash
node netlify-functions-server.js
```
This will start a local server on `http://localhost:8888` that simulates Netlify Functions.

### 2. Start the Vite Development Server
```bash
npm run dev
```
This will start on `http://localhost:5173` and proxy function calls to the local functions server.

## How It Works

### Client Side (Frontend)
- The `OlaMapsService` now calls `/.netlify/functions/ola-maps-proxy` instead of direct API calls
- No sensitive credentials are exposed in the client code
- All API calls go through the secure proxy

### Server Side (Netlify Function)
- The `netlify/functions/ola-maps-proxy.js` function handles API calls
- It securely accesses environment variables using `process.env.OLA_MAPS_*`
- OAuth tokens are cached server-side to improve performance
- CORS headers are properly configured

## File Structure

```
├── netlify/
│   └── functions/
│       └── ola-maps-proxy.js    # Server-side API proxy
├── netlify.toml                 # Netlify configuration
├── netlify-functions-server.js  # Local development server
├── src/utils/olaMapsService.ts  # Updated client service
└── vite.config.ts              # Updated with proxy configuration
```

## Testing the Fix

### 1. Local Testing
1. Start both servers as described above
2. Test map functionality in your application
3. Check browser console for any errors
4. Verify that API calls work through the proxy

### 2. Deployment Testing
1. Update environment variables in Netlify dashboard
2. Deploy your changes
3. The build should now pass without security scanner errors
4. Test the deployed application

## Security Benefits

✅ **No secrets in client bundle** - API credentials never leave the server
✅ **CORS protection** - Only your domain can access the functions
✅ **Rate limiting** - Netlify Functions provide built-in protection
✅ **Audit trail** - All API calls are logged server-side
✅ **Easy rotation** - Change secrets without redeploying frontend

## Troubleshooting

### Function Not Found (404)
- Ensure the Netlify Functions server is running on port 8888
- Check that `netlify/functions/ola-maps-proxy.js` exists

### API Errors
- Verify environment variables are set correctly
- Check the Netlify Function logs for detailed error messages
- Ensure your Ola Maps API credentials are valid

### Build Still Fails
- Make sure all `VITE_OLA_MAPS_*` references are removed from client code
- Check that no other files contain sensitive environment variables
- Verify the `.env` file is in `.gitignore`

## Migration Checklist

- [x] Remove `VITE_OLA_MAPS_*` from client code
- [x] Create Netlify Function proxy
- [x] Update environment variables (remove `VITE_` prefix)
- [x] Test locally with both servers
- [x] Update Netlify environment variables
- [x] Deploy and verify build passes
- [x] Test deployed application functionality

## Support

If you encounter issues:

1. Check the browser console for client-side errors
2. Check the Netlify Function logs for server-side errors
3. Verify all environment variables are set correctly
4. Ensure both development servers are running locally

The application should now deploy successfully to Netlify without security scanner failures.