# Deployment

Approved topology: Vercel for the static hub and Day 1 app; Railway for the stateful license service. The names are configurable.

1. Push the public tracker and application repositories.
2. Deploy `hub/` to Vercel with the tracker files included at build/runtime; set `PORT` only for local or container use.
3. Deploy `license-server/` to Railway with a persistent volume mounted for `DATA_FILE`; set `STRIPE_WEBHOOK_SECRET`, `ADMIN_API_KEY`, `PUBLIC_BASE_URL`, and allowed origins.
4. Create Stripe products/prices, copy their IDs into environment variables, and register the exact `/webhook/stripe` URL.
5. Deploy each app, setting its public license-server URL and Stripe price identifiers.
6. Point custom domains only after health checks pass.

Never commit `.env`. Back up the license database before service changes. The included JSON store is local-ready; use Postgres or another managed transactional database before meaningful production traffic.
