# txttokindle

A simple web app that lets anyone:
1) drag & drop a `.txt` file (a book)
2) enter their **Kindle “Send to Kindle” email**
3) click **Send** → the file is emailed for delivery to their Kindle

## How it works (MVP)
- Frontend: Next.js (App Router) + Tailwind
- Backend: Next.js Route Handler that accepts upload + kindle email
- Delivery: sends an email with the TXT as an attachment using SMTP (via Nodemailer)

> Kindle supports receiving `.txt` by email (Amazon does the conversion/delivery).

## Local dev

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Environment variables
Create `.env.local`:

```bash
# SMTP settings (use a transactional email provider)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="TxtToKindle <no-reply@yourdomain.com>"

# Basic abuse protection
MAX_UPLOAD_BYTES=10485760
```

## Deploy
Any Node hosting works (Vercel/Render/Fly/etc). If you use Vercel, you’ll need an SMTP provider that works from serverless.

## Notes / Safety
- Add rate limiting + captcha before public launch.
- Consider allowlisting kindle domains (`kindle.com`, `free.kindle.com`) and validating emails.
