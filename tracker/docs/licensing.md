# Shared licensing integration

Every paid app delegates entitlement checks to the shared license server. Stripe Checkout redirects only return the buyer to the app; they never unlock features. Stripe sends the raw event body to `POST /webhook/stripe`, where the server validates the `Stripe-Signature` HMAC with `STRIPE_WEBHOOK_SECRET`, rejects stale timestamps, and idempotently applies paid or subscription lifecycle events.

The verified event metadata must include `plan` (`all_access_monthly`, `all_access_lifetime`, or `per_app`) and, for per-app purchases, `app`. The service generates a high-entropy key once, returns it only in the webhook response for this offline implementation, and stores its SHA-256 hash. In production, send the key through a transactional email provider and use a managed database/queue.

Apps call `GET /api/validate?key=…&app=…` from their server-side protected path. Browser redemption may call `POST /api/redeem` for a friendly entitlement summary, but the browser result alone must not guard paid data. Revocation requires `X-Admin-Key`. Subscription deletion or failed/cancelled status shortens entitlement to the paid-through period; `invoice.paid` extends it using the Stripe period end.
