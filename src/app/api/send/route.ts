import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  kindleEmail: z.string().email(),
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

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const kindleEmail = String(form.get("kindleEmail") || "").trim();

    const parsed = schema.safeParse({ kindleEmail });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
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
    const lower = name.toLowerCase();
    if (!lower.endsWith(".txt")) {
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
