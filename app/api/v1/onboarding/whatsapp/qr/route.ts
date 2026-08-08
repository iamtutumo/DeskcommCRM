import { NextResponse } from "next/server";
import { loadAuthUser, resolveActiveOrg } from "@/lib/auth/server";
import { activeQrTransport, evolutionQrImageBytes } from "@/lib/channels/transport";
import { getEvolutionClient } from "@/lib/evolution";

/**
 * Proxy/QR do WhatsApp para o browser poder <img src="..." /> sem expor a API key.
 *
 *  - WAHA: GET /api/{session}/auth/qr?format=image → image/png bytes (proxy).
 *  - Evolution: GET /instance/connect/{name} → JSON com `qrcode.base64`; aqui se
 *    decodifica e devolve como image/png.
 */
export async function GET() {
  const user = await loadAuthUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) return new NextResponse(null, { status: 404 });

  const provider = activeQrTransport();
  if (!provider) return new NextResponse(null, { status: 503 });

  const sessionName = `org_${activeOrg.orgId.slice(0, 8)}`;

  if (provider === "evolution") {
    const client = getEvolutionClient();
    if (!client) return new NextResponse(null, { status: 503 });
    let res;
    try {
      res = await client.connectInstance(sessionName);
    } catch {
      return new NextResponse(null, {
        status: 502,
        headers: { "x-evolution-state": "connect-failed" },
      });
    }
    const img = evolutionQrImageBytes(res.qrcode?.base64);
    if (!img) {
      return new NextResponse(null, {
        status: 409,
        headers: { "x-evolution-state": "no-qr" },
      });
    }
    return new NextResponse(new Uint8Array(img), {
      status: 200,
      headers: { "content-type": "image/png", "cache-control": "no-store, max-age=0" },
    });
  }

  const baseUrl = process.env.WAHA_API_BASE_URL;
  const apiKey = process.env.WAHA_API_KEY;
  if (!baseUrl || !apiKey || apiKey === "dev_plaintext_change_me") {
    return new NextResponse(null, { status: 503 });
  }

  const upstream = await fetch(
    `${baseUrl}/api/${encodeURIComponent(sessionName)}/auth/qr?format=image`,
    { headers: { "X-Api-Key": apiKey }, cache: "no-store" },
  );
  if (!upstream.ok) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: { "x-waha-status": String(upstream.status) },
    });
  }

  const ct = upstream.headers.get("content-type") ?? "image/png";
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": ct,
      "cache-control": "no-store, max-age=0",
    },
  });
}
