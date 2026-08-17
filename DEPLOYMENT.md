# Projectly UI Deployment

## Vercel

Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set these environment variables in Vercel:

```text
VITE_API_BASE_URL=https://<projectly-api-domain>/api
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

`vercel.json` rewrites all routes to `index.html` so React Router URLs like
`/workspaces/1/projects/2/cards/3` work after refresh.

After deploy, add the Vercel domain to the backend `CORS_ORIGINS` value.
