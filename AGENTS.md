# Architecture decisions

- Use Lovable built-in Stripe payments with embedded checkout; Stripe Tax is unavailable for this Brazil account, so the seller handles tax calculation and filing.
- Derive lifetime access from `platform_admins`; custom clinic plans use server-controlled limits, optional expiry, and explicit AI access.