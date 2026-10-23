# REEVITA — Policy Content Review (`/policies/*`)

Scope: `src/lib/policies.ts` → `src/app/policies/[slug]/page.tsx` (shipping, returns, terms,
privacy). Rule applied: **a statement may appear only if the repository proves it**; everything else
is listed as requiring owner/legal approval. No refund, warranty or delivery commitment has been
invented.

## 1. Statements backed by the code/configuration — VERIFIED

| Statement (page) | Source of truth |
| --- | --- |
| “Cash on delivery only; nothing is collected online.” (terms) | `orders.payment_method` CHECK `('cod','online')` + checkout collects no card fields |
| “No card data is collected.” (privacy) | No card inputs anywhere in `src/` |
| “COD fee = 0 / added to total if configured.” (terms) | `brand.codFee = 0` in `src/data/catalog.json`, rendered conditionally |
| “Free shipping for orders ≥ 1,000 EGP.” (shipping) | `brand.freeShippingThreshold = 1000`, enforced in `place_order` |
| “Delivery time: 1–4 working days.” (shipping) | `brand.deliveryEstimateAr` |
| “Returns within 14 days.” (returns) | `brand.returnWindowDays = 14` |
| “Egypt only.” (shipping) | `governorates` table + `place_order` rejects unknown/inactive governorates |
| Support phone / e-mail (all pages) | `brand.supportPhoneDisplay`, `brand.email` |
| “Prices shown in EGP.” (terms) | `currency = 'EGP'` default and formatting helpers |
| “Data used to fulfil the order; shared with the carrier.” (privacy) | Order fields collected at checkout; no analytics/third-party scripts in the app |

## 2. Statements that need the owner’s approval

| # | Statement | Why approval is required |
| --- | --- | --- |
| P1 | “Confirmation call before shipping; REEVITA may cancel an order it cannot confirm.” (terms) | Business process — confirm it is the real operating rule |
| P2 | “Opened or used products cannot be returned.” (returns) | Commercial restriction; must match the owner’s returns policy |
| P3 | “Refund/return handled after phone confirmation.” (returns) | No refund method or timing is stated — the owner must supply it (cash on collection, transfer, timeline) |
| P4 | “We do not sell customer data.” (privacy) | Legal commitment |
| P5 | “Data shared with the shipping company.” (privacy) | Must name the actual carrier/processor |
| P6 | “Contact us to access/correct/delete your data.” (privacy) | Retention period and deletion SLA are not defined |
| P7 | Any tax statement | **Removed** — the previous draft claimed prices include applicable taxes, which the repository does not prove |
| P8 | Consumer-protection compliance wording | Not asserted anywhere; requires Egyptian counsel |

## 3. Gaps the owner must close before launch

1. **Full legal entity details** (registered name, address, commercial register/tax ID if required) —
   not present anywhere in the app.
2. **Refund method and timing** — the returns page describes the window and product condition but not
   how/when money is returned (COD refunds are operationally different from card refunds).
3. **Named shipping carrier** and its liability terms.
4. **Privacy retention period** and the lawful basis for processing.
5. **Policy versioning/effective date** — the pages currently carry no date or version.
6. **Legal review of the Arabic wording** before publication.

## 4. Technical state

* All four pages render from configured values (no hard-coded prices).
* Pages are `robots: noindex` and excluded from `sitemap.ts` while unapproved.
* Each page shows an explicit “operational draft, subject to legal review” banner.
* Checkout links to `terms` + `returns` under the consent checkbox; the checkbox label itself is
  unchanged so its accessible name stays stable.

**Status: PARTIALLY VERIFIED** — the factual statements match the configuration; every commercial or
legal commitment still requires owner/legal approval.
