import { z } from "zod";

const verifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

export async function verifyTurnstile(params: {
  secretKey: string;
  token: string;
  ip?: string;
}): Promise<{ ok: true } | { ok: false; error: string }>{
  const body = new URLSearchParams();
  body.set("secret", params.secretKey);
  body.set("response", params.token);
  if (params.ip) body.set("remoteip", params.ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) return { ok: false, error: `Turnstile verify failed (${res.status})` };

  const json = verifyResponseSchema.safeParse(await res.json());
  if (!json.success) return { ok: false, error: "Turnstile verify parse failed" };
  if (!json.data.success) {
    return { ok: false, error: `Turnstile blocked (${(json.data["error-codes"] || []).join(",")})` };
  }

  return { ok: true };
}
