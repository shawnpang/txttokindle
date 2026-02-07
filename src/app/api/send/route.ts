import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile";
import { getRatelimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  kindleEmail: z.string().email(),
  turnstileToken: z.string().optional(),
});

function env(name: string, required = true): string {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing env var: ${name}`);
  return v || "";
}

function isKindleEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return lower.endsWith("@kindle.com") || lower.endsWith("@free.kindle.com");
}

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return undefined;
  return xff.split(",")[0]?.trim();
}

export async function POST(req: Request) {
  try {
    // Optional rate limiting (requires Upstash env vars)
    const ratelimit = getRatelimit();
    if (ratelimit) {
      const ip = getClientIp(req) || "unknown";
      const { success } = await ratelimit.limit(`ip:${ip}`);
      if (!success) {
        return NextResponse.json({ ok: false, error: "Rate limit exceeded. Try again later." }, { status: 429 });
      }
    }

    const form = await req.formData();
    const kindleEmail = String(form.get("kindleEmail") || "").trim();
    const turnstileToken = String(form.get("turnstileToken") || "").trim() || undefined;

    const parsed = schema.safeParse({ kindleEmail, turnstileToken });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
    }

    // Optional Turnstile (enabled if TURNSTILE_SECRET_KEY is set)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!parsed.data.turnstileToken) {
        return NextResponse.json({ ok: false, error: "Missing CAPTCHA." }, { status: 400 });
      }
      const ip = getClientIp(req);
      const verdict = await verifyTurnstile({
        secretKey: turnstileSecret,
        token: parsed.data.turnstileToken,
        ip,
      });
      if (!verdict.ok) {
        return NextResponse.json({ ok: false, error: verdict.error }, { status: 403 });
      }
    }

    const requireKindleDomain = (process.env.REQUIRE_KINDLE_DOMAIN || "true").toLowerCase() === "true";
    if (requireKindleDomain && !isKindleEmail(parsed.data.kindleEmail)) {
      return NextResponse.json(
        { ok: false, error: "Please use your Kindle Send-to-Kindle email (…@kindle.com)." },
        { status: 400 }
      );
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
    }

    const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
    if (file.size > maxBytes) {
      return NextResponse.json(
        { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).` },
        { status: 413 }
      );
    }

    const name = (file.name || "document.txt").trim();
    if (!name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json({ ok: false, error: "Only .txt is supported for now." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const resend = new Resend(env("RESEND_API_KEY"));
    const from = env("RESEND_FROM");

    const result = await resend.emails.send({
      from,
      to: [parsed.data.kindleEmail],
      subject: "Kindle Delivery",
      text: "Sent via txttokindle.",
      attachments: [
        {
          filename: name,
          content: buf.toString("base64"),
        },
      ],
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: `Email error: ${result.error.message}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? `Server error: ${e.message}` : "Server error." },
      { status: 500 }
    );
  }
}
