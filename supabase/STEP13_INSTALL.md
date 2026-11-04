# BHARATEE Level 3 — Phase 13: Income, Expense and Cashbook

This package adds secure finance-entry workflows for the two business units. Keep all work on the `level3-development` branch until tests are complete.

## Files

- `004_finance_workflows.sql` — Supabase migration. It adds RPCs for quick completed sales, existing-order receipts, refunds, expenses, opening/closing cashbook sessions, default expense categories, and replaces the accounting dashboard RPC with a corrected zero-transaction-safe implementation.
- `finance-management.js` — front-end forms for those RPC workflows. It expects `admin.html` to have the existing global Supabase client (`db`), selected business (`selected`) and language (`lang`).

## Step 1 — Install database migration

1. Open Supabase Dashboard → SQL Editor → New Query.
2. Open `004_finance_workflows.sql` from this package.
3. Copy the complete file into the SQL Editor and click Run once.
4. If it succeeds, the finance RPCs and default expense categories are ready. If it errors, stop and share the exact error text; do not repeatedly rerun it blindly.

This migration is written for the schema from `001_initial_schema.sql` and replaces `get_accounting_dashboard` from migration `003_accounting_dashboard.sql`.

## Step 2 — Add the finance UI to the local development folder

Put these three files side by side:

```text
project-folder/
  index.html
  admin.html
  accounting-dashboard.js
  finance-management.js
```

Add the following script tags at the end of `admin.html`, after its existing main `</script>` and before `</body>`, in this exact order:

```html
<script src="./accounting-dashboard.js"></script>
<script src="./finance-management.js"></script>
```

If `accounting-dashboard.js` is already included, add only the `finance-management.js` line beneath it. Do not add duplicate script tags.

## Step 3 — Test locally

1. Open the development folder in VS Code.
2. Start Live Server for `admin.html`.
3. Sign in with the Supabase Owner account.
4. Select BHARATEE DIGITAL SERVICE or BHARATEE GRAPHIX.
5. Verify the Finance Operations area loads, expense categories appear, order selector loads, and cashbook status appears.
6. Only enter real business transactions. This package writes to your live Supabase database; it is not a disposable demo database.

## What each form does

- **Quick income / completed sale:** creates a completed order, its single line item and a receipt transaction atomically. Use for a completed counter or studio sale. It may optionally create/link a customer.
- **Existing order payment / refund:** records another receipt or a refund against an existing order. It prevents over-collection and refunds beyond the net amount received.
- **Business expense:** records amount, category, vendor, payment method, date and notes. Expense receipt-file upload is deliberately not enabled yet; private storage upload policies and signed access need a separate pass.
- **Daily cashbook:** opens one cash session per business, calculates expected cash from cash receipts/refunds/expenses, and closes the session with counted cash and variance.
- **Recent entries:** shows latest payment/refund and expense entries.

## Security notes

- Frontend uses only the Supabase Publishable key already configured in `admin.html`.
- No Supabase Secret or `service_role` key belongs in browser code.
- Finance write operations use authenticated PostgreSQL RPC functions with `SECURITY DEFINER`, fixed `search_path`, explicit `auth.uid()` and active business-role checks.
- The accepted finance roles are Owner, Admin, Manager and Accountant.
- Payment/refund transactions are append-only in the intended workflow. Do not manually edit financial rows in Table Editor.
- Do not merge into `main` until tested with separate roles and the figures reconcile.

## Accounting interpretation

- Net collections = receipts − refunds.
- Operating movement = net collections − recorded expenses (cash-basis movement, not formal accrual profit).
- Pending customer balance = order total − net receipts, floored at zero.
- Cashbook variance = actual counted closing cash − expected cash.
- The daily order-value metric is not the same as money received; use collections for receipts.

## Not included yet

- Private receipt upload, receipt preview and deletion controls.
- Tax/GST reports, depreciation, bank reconciliation and accrual accounting.
- Full order, customer and wedding-booking management interfaces.
- WhatsApp automation.
