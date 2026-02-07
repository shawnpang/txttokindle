"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [kindleEmail, setKindleEmail] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) return "Drag a .txt file here, or click to choose";
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  async function onSubmit() {
    setStatus("");
    if (!file) return setStatus("Please choose a .txt file.");
    if (!kindleEmail.trim()) return setStatus("Please enter your Kindle email.");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kindleEmail", kindleEmail.trim());

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
        <p className="mt-2 text-sm text-gray-600">
          Upload a .txt file and send it to your Kindle email.
        </p>

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

        <button
          className="mt-5 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={busy}
          onClick={onSubmit}
        >
          {busy ? "Sending…" : "Send to Kindle"}
        </button>

        {status && (
          <div className="mt-4 rounded-md bg-gray-100 px-3 py-2 text-sm">{status}</div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          Note: your Kindle must allow the sender address (Amazon “Approved Personal Document E-mail List”).
        </div>
      </div>
    </main>
  );
}
