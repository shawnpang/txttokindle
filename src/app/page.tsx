"use client";

import { useMemo, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [kindleEmail, setKindleEmail] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileReady, setTurnstileReady] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const fileLabel = useMemo(() => {
    if (!file) return "Drag a .txt file here, or click to choose";
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  async function onSubmit() {
    setStatus("");
    if (!file) return setStatus("Please choose a .txt file.");
    if (!kindleEmail.trim()) return setStatus("Please enter your Kindle email.");
    if (!accepted) return setStatus("Please accept the terms.");
    if (siteKey && !turnstileToken) return setStatus("Please complete the CAPTCHA.");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kindleEmail", kindleEmail.trim());
      if (turnstileToken) form.append("turnstileToken", turnstileToken);

      const res = await fetch("/api/send", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setStatus(json.error || `Request failed (${res.status})`);
      } else {
        setStatus("Sent! Check your Kindle in a few minutes.");
        setFile(null);
        setTurnstileToken("");
        if (window.turnstile) window.turnstile.reset();
      }
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">TxtToKindle</h1>
        <p className="mt-2 text-sm text-gray-600">Upload a .txt file and send it to your Kindle email.</p>

        <label
          className="mt-6 block rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:bg-gray-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
        >
          <input
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="text-sm">{fileLabel}</div>
          <div className="mt-1 text-xs text-gray-500">Max size is configured on the server.</div>
        </label>

        <div className="mt-4">
          <label className="block text-sm font-medium">Kindle email</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="yourname_123@kindle.com"
            value={kindleEmail}
            onChange={(e) => setKindleEmail(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Find it in Amazon → Devices → (your Kindle) → “Send-to-Kindle Email”.
          </p>
        </div>

        {siteKey && (
          <div className="mt-5">
            <script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              async
              defer
              onLoad={() => setTurnstileReady(true)}
            />

            <div
              className="min-h-[65px]"
              ref={(el) => {
                if (!el) return;
                if (!turnstileReady) return;
                if (!window.turnstile) return;
                // Avoid re-rendering multiple widgets
                if (el.dataset.widgetId) return;

                const widgetId = window.turnstile.render(el, {
                  sitekey: siteKey,
                  callback: (token) => setTurnstileToken(token),
                  "expired-callback": () => setTurnstileToken(""),
                  "error-callback": () => setTurnstileToken(""),
                });
                el.dataset.widgetId = widgetId;
              }}
            />

            <p className="mt-2 text-xs text-gray-500">
              CAPTCHA is enabled to prevent abuse.
            </p>
          </div>
        )}

<div className="mt-5 flex items-start gap-2">          <input            id="accept"            type="checkbox"            className="mt-1"            checked={accepted}            onChange={(e) => setAccepted(e.target.checked)}          />          <label htmlFor="accept" className="text-xs text-gray-600">            I confirm I have the rights to send this file and agree to the            <a className="underline ml-1" href="/terms" target="_blank" rel="noreferrer">Terms</a>            and            <a className="underline ml-1" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.          </label>        </div>
        <button
          className="mt-5 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={busy}
          onClick={onSubmit}
        >
          {busy ? "Sending…" : "Send to Kindle"}
        </button>

        {status && <div className="mt-4 rounded-md bg-gray-100 px-3 py-2 text-sm">{status}</div>}

        <div className="mt-6 text-xs text-gray-500">
          Note: your Kindle must allow the sender address (Amazon “Approved Personal Document E-mail List”).
        </div>
      </div>
    </main>
  );
}
