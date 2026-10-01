# Architecture decisions

- Use Lovable built-in Stripe payments with embedded checkout and automatic tax calculation; Brazil-based sellers remain responsible for tax filing.
- Derive lifetime access from `platform_admins`; custom clinic plans use server-controlled limits, optional expiry, and explicit AI access.