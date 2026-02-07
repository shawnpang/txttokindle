# txttokindle

A tiny web app that lets anyone:
1) drag & drop a `.txt` file
2) enter their **Kindle “Send to Kindle” email**
3) click **Send** → Amazon delivers it to their Kindle

## Tech
- Next.js (App Router) + Tailwind
- Email via **Resend** (Vercel-friendly)
- Optional anti-abuse:
  - Cloudflare Turnstile CAPTCHA
  - Rate limiting (Upstash Redis)

## Local dev

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

## Environment variables

```bash
# Resend
RESEND_API_KEY=
RESEND_FROM="TxtToKindle <send@yourdomain.com>"

# Safety
REQUIRE_KINDLE_DOMAIN=true
MAX_UPLOAD_BYTES=10485760

# (Recommended) Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# (Recommended) Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Deploy (Vercel)
1) Push to GitHub
2) Import the repo in Vercel
3) Add env vars in Vercel Project Settings → Environment Variables
4) Deploy

## Important notes
- Users must allow your sender address/domain in Amazon:
  **Approved Personal Document E-mail List**

