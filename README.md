# txttokindle

A tiny web app that lets anyone:
1) drag & drop a `.txt` file
2) enter their **Kindle “Send to Kindle” email**
3) click **Send** → Amazon delivers it to their Kindle

## Tech
- Next.js (App Router) + Tailwind
- Email sending via **Resend** (recommended for Vercel)

## Local dev

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

## Environment variables

Create `.env.local`:

```bash
# Resend
RESEND_API_KEY=
RESEND_FROM="TxtToKindle <send@yourdomain.com>"

# Safety
REQUIRE_KINDLE_DOMAIN=true
MAX_UPLOAD_BYTES=10485760
```

## Deploy (Vercel)
1) Push to GitHub
2) Import the repo in Vercel
3) Add the env vars in Vercel Project Settings → Environment Variables
4) Deploy

## Important notes
- Users must allow your sender address/domain in Amazon:
  **Approved Personal Document E-mail List**
- Before making this public, add:
  - CAPTCHA (Cloudflare Turnstile)
  - Rate limiting
  - Terms/Privacy

