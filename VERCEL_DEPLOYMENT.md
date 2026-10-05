# OpsPS Vercel web deployment

This project is configured for Expo web static export and deployment to Vercel.

## Build and output

- Build command: `npm run build`
- Output directory: `dist`
- Static export source: `expo export --platform web --output-dir dist`

The repository includes `vercel.json` with a catch-all rewrite to `/index.html` so client-side routes work correctly in a single-page Expo web app.

## Required public environment variables

Set these in the Vercel project environment:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

These are the only browser-safe Supabase variables required by the app.

## Forbidden in browser/client config

Do not expose or commit any of the following in `EXPO_PUBLIC_*` variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- JWT secrets
- API tokens
- any production credential material

These values remain server-side only and must never be shipped to the browser.

## Deployment checklist

1. Add the public Expo/Supabase variables above to Vercel.
2. Ensure the project root is the repository root.
3. Use the existing `npm run build` command.
4. Set the output directory to `dist`.
5. Deploy the Production branch only after confirming the environment values match the production Supabase project.

## Notes

- This app uses Expo Router and the web bundle is exported as a static SPA.
- Do not use a Next.js app structure or a Next.js deployment model; the project is not a Next.js app.
- Keep `.env.local` and all secret-bearing local files out of the repository. The repo ignores `.env*.local` by default.
