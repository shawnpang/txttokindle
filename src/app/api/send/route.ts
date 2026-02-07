import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

export const runtime = "nodejs"; // nodemailer needs Node runtime

const schema = z.object({
  kindleEmail: z.string().email(),
});

function env(name: string, required = true): string {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing env var: ${name}`);
  return v || "";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const kindleEmail = String(form.get("kindleEmail") || "").trim();
    const parsed = schema.safeParse({ kindleEmail });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid Kindle email." }, { status: 400 });
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

    // Only allow txt for MVP
    const name = file.name || "document.txt";
    const lower = name.toLowerCase();
    if (!lower.endsWith(".txt")) {
      return NextResponse.json({ ok: false, error: "Only .txt is supported for now." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const transporter = nodemailer.createTransport({
      host: env("SMTP_HOST"),
      port: Number(env("SMTP_PORT")),
      secure: Number(env("SMTP_PORT")) === 465,
      auth: {
        user: env("SMTP_USER"),
        pass: env("SMTP_PASS"),
      },
    });

    const from = env("SMTP_FROM");

    // Minimal subject/body; Kindle doesn’t need anything special.
    await transporter.sendMail({
      from,
      to: parsed.data.kindleEmail,
      subject: "Kindle Delivery",
      text: "Sent via txttokindle.",
      attachments: [
        {
          filename: name,
          content: buf,
          contentType: "text/plain; charset=utf-8",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    // Don’t leak sensitive info to client
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? `Server error: ${e.message}` : "Server error." },
      { status: 500 }
    );
  }
}
