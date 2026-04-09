# YourHRCoach.ai — Project Reference Document (MDC)
**Last Updated:** March 2026
**Maintainer:** Austin Holt (austinjholt)
**GitHub:** github.com/austinjholt

---

## 1. Project Overview

YourHRCoach.ai is an AI-powered HR coaching SaaS built to scale the expertise of Dr. Steve Cohen (HR Solutions On Call). It targets small businesses under 50 employees at $99/month or $997/year. The platform allows users to ask HR questions, generate HR documents, and upload files for review — all powered by the Anthropic Claude API with RAG (Retrieval-Augmented Generation) from a curated knowledge base.

**Strategic goal:** Scale Dr. Steve Cohen's expertise and position for acquisition.

---

## 2. Repositories

| Repo | URL | Netlify Site | Branch Strategy |
|------|-----|-------------|-----------------|
| `yourhrcoach_v3` | github.com/austinjholt/yourhrcoach_v3 | app.yourhrcoach.ai | `main` = production, `dev` = staging |
| `yourhrcoach-landing` | github.com/austinjholt/yourhrcoach-landing | yourhrcoach.ai | `main` = production |

> ⚠️ **Important:** `yourhrcoach-landing` deploys from `master:main`. Always push with:
> `git push origin master:main`

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (single `public/index.html`) |
| Hosting | Netlify (functions + static) |
| Auth | Supabase Magic Link (no passwords) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| RAG Embeddings | Voyage AI (`voyage-large-2`) |
| Payments | Stripe (dedicated YourHRCoach account) |
| Email | Resend (transactional), EmailJS (HR911 form) |
| Document Generation | docx.js (via Netlify function) |
| File Parsing | mammoth.js (Word docs), PDF support |
| Fonts | Google Fonts — Playfair Display, Source Sans 3 |

---

## 4. File Structure

### `yourhrcoach_v3`
```
yourhrcoach_v3/
├── public/
│   └── index.html          # Entire frontend — all HTML, CSS, JS in one file
├── netlify/
│   └── functions/
│       ├── chat.js          # Main AI chat handler (Anthropic + RAG)
│       ├── generate-docx.js # Document generation (docx.js)
│       ├── config.js        # Returns public env vars to frontend
│       ├── stripe-checkout.js
│       ├── billing-portal.js
│       └── subscription-status.js
├── netlify.toml             # Build config, headers, redirects, timeouts
└── package.json
```

### `yourhrcoach-landing`
```
yourhrcoach-landing/
├── public/
│   └── index.html          # Landing page
├── netlify.toml
└── package.json
```

---

## 5. Environment Variables

All secrets live in Netlify → Site Configuration → Environment Variables. Never hardcode in source.

### `yourhrcoach_v3`

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Supabase key (safe for frontend via /api/config) |
| `SUPABASE_SERVICE_KEY` | Server-side Supabase key (functions only, never exposed) |
| `VOYAGE_API_KEY` | RAG embedding generation |
| `STRIPE_SECRET_KEY` | Stripe server-side key |
| `STRIPE_PRICE_MONTHLY` | `price_1TEFT9CauIISdXTwqGLXLQQt` |
| `STRIPE_PRICE_YEARLY` | `price_1TEFTWCauIISdXTwRbwvX00k` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Transactional email |
| `SECRETS_SCAN_OMIT_KEYS` | `STRIPE_PRICE_MONTHLY,STRIPE_PRICE_YEARLY` |

> ⚠️ `SUPABASE_ANON_KEY` is returned via `/api/config` to the frontend. It is safe to expose. `SUPABASE_SERVICE_KEY` must NEVER reach the browser.

### Admin Emails (hardcoded in `index.html`)
```javascript
const ADMIN_EMAILS = ['austin@oncallhrgroup.com', 'steve@oncallhrgroup.com'];
```

---

## 6. Deploy Workflow

### `yourhrcoach_v3` — Standard Deploy
```powershell
git add .
git commit -m "your message"
git push origin main        # deploys to app.yourhrcoach.ai
# OR
git push origin dev         # deploys to dev preview URL
```

### `yourhrcoach-landing` — Deploy
```powershell
git add .
git commit -m "your message"
git push origin master:main  # NOTE: master:main — required for Netlify trigger
```

### Netlify Function Timeout
`chat.js` is set to 26s timeout (Netlify Pro max). Configured in `netlify.toml`:
```toml
[functions."chat"]
  timeout = 26
```

---

## 7. Supabase Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `conversations` | Stores conversation metadata per user |
| `messages` | Stores individual messages per conversation |
| `savings` | Tracks per-user estimated savings counter |
| `documents` | RAG knowledge base chunks |

### Key RPC Functions
- `increment_savings(p_user_id, p_messages, p_documents, p_amount)` — increments savings counters atomically. Use this instead of upsert.
- `match_documents(query_embedding, match_threshold, match_count)` — vector similarity search for RAG

---

## 8. Architecture: How a Chat Request Works

```
User types message
       ↓
index.html → POST /api/chat
       ↓
chat.js (Netlify function)
  1. Voyage AI → generate embedding from user query
  2. Supabase RPC → match_documents (vector search, threshold 0.7, top 5)
  3. Inject RAG context into Claude system prompt
  4. Anthropic API → claude-sonnet-4-6, max_tokens: 4000
     (retries up to 3x on overload_error with 1.5s/3s backoff)
  5. Parse response for DOCUMENT_START/DOCUMENT_END markers
  6. Return { reply, usedRag, document }
       ↓
index.html renders response
  - If document: renders doc card with download button
  - Records savings via increment_savings RPC
  - Appends to conversationHistory (capped at last 20 for API calls)
```

---

## 9. Coding Conventions

### General
- **Frontend is a single file:** All HTML, CSS, and JS lives in `public/index.html`. Do not split into separate files unless specifically directed.
- **No frameworks:** Vanilla JS only — no React, Vue, or jQuery.
- **Prefer complete file replacements** over incremental edits when making significant changes.
- **CSS variables** for all colors — never hardcode hex values inline. Use `:root` vars.
- **CRLF line endings** — Windows environment, files use `\r\n`.

### JavaScript
- All global state variables are declared at the top of the script block (line ~541)
- Use `escHtml()` for any user-generated content inserted into the DOM
- Use `fmtMsg()` only for AI response content — it sanitizes via `escHtml()` first
- Use `data-` attributes for DOM-based event delegation (not inline `onclick` with dynamic IDs)
- Cap `conversationHistory` at `.slice(-20)` when sending to API — full history kept locally
- Use `onclick` property (not `addEventListener`) on dynamically created buttons to avoid listener leaks

### CSS
- All styles in the `<style>` block in `<head>` — no external stylesheets
- Mobile breakpoint: `@media (max-width: 768px)`
- Touch targets minimum 44px on mobile

### Netlify Functions
- All functions use `exports.handler = async (event) => {}` pattern
- Always return CORS headers on every response
- Wrap everything in try/catch — return `{ statusCode: 500, body: JSON.stringify({ error }) }` on failure
- Never log sensitive keys or user data to console

---

## 10. Security Rules

- Supabase anon key exposed via `/api/config` only — never hardcoded in frontend HTML
- Service key used server-side only in Netlify functions
- All user input sanitized with `escHtml()` before DOM insertion
- CSP headers enforced via `netlify.toml` — do not add new external domains without updating `connect-src`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` headers active
- No `eval()` usage anywhere

### CSP Allowed Domains (connect-src)
- `*.supabase.co`, `wss://*.supabase.co`
- `api.anthropic.com`
- `api.stripe.com`
- `api.emailjs.com`
- `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`
- `api.voyageai.com`

---

## 11. Stripe Configuration

| Item | Value |
|------|-------|
| Monthly Price ID | `price_1TEFT9CauIISdXTwqGLXLQQt` |
| Yearly Price ID | `price_1TEFTWCauIISdXTwRbwvX00k` |
| Monthly Price | $99/month |
| Yearly Price | $997/year (saves $191) |
| Trial | 7-day free trial on both plans |
| Account | Dedicated YourHRCoach Stripe account |

---

## 12. EmailJS Configuration (HR911 Consultant Form)

| Item | Value |
|------|-------|
| Public Key | `Sv04chhsD8kSJJpxp` |
| Service ID | `service_qxwmskb` |
| Template ID | `template_t7klncl` |

---

## 13. Known Issues & Gotchas

- **Magic link always redirects to production** — `emailRedirectTo: window.location.origin` means testing auth on dev requires starting the login flow from the dev preview URL directly
- **Anthropic overload errors** — retry logic built into `chat.js` (3 attempts, 1.5s/3s backoff). During Anthropic outages, users will see "Error: Overloaded" — check status.anthropic.com
- **`yourhrcoach-landing` deploy** — must use `git push origin master:main` or Netlify won't trigger
- **savings upsert removed** — only use `increment_savings` RPC for savings tracking. Direct upsert causes 400 errors on conflict

---

## 14. Useful Links

| Resource | URL |
|----------|-----|
| App (production) | app.yourhrcoach.ai |
| Landing page | yourhrcoach.ai |
| Netlify dashboard | app.netlify.com |
| Supabase dashboard | app.supabase.com |
| Anthropic console | console.anthropic.com |
| Anthropic status | status.anthropic.com |
| Stripe dashboard | dashboard.stripe.com |
| GitHub | github.com/austinjholt |
