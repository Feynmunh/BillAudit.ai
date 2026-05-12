Economics
=========

Value proposition
-----------------
If BillAudit finds $500 per month in avoidable AI spend, the annualized value is $6,000. That makes a paid Credex consultation or implementation engagement easy to justify.

Funnel assumptions
------------------
- Visitor runs audit without login.
- Savings number creates urgency.
- Email capture unlocks benchmark context and sends the audit confirmation to the user-entered address.
- High-savings users become Credex leads.

Savings tiers
-------------
- High: more than $500 monthly savings
- Moderate: $50 to $500 monthly savings
- Optimal: less than $50 monthly savings

Commercial angle
----------------
Credex can use BillAudit as a wedge into AI infrastructure optimization, vendor consolidation, usage analytics, and procurement advisory.

Implementation note
-------------------
The current MVP reduces funnel friction with same-origin API calls, no external auth step, compact logo-only tool selection, and Resend transactional email after lead capture. Supabase Postgres keeps `/audit/:uuid` public URLs durable enough for follow-up sales workflows, and `NEXT_PUBLIC_CREDEX_BOOKING_URL` can route high-savings users directly to a consultation CTA.
