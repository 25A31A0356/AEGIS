import { startTunnel } from "untun";

async function main() {
  const port = parseInt(process.env.TUNNEL_PORT || "3000", 10);
  console.log(`[Cloudflare] Starting Cloudflare Quick Tunnel for port ${port}...`);

  try {
    const tunnel = await startTunnel({ port });
    const url = await tunnel.getURL();
    console.log("==================================================");
    console.log(`🚀 CLOUDFLARE PUBLIC TUNNEL URL:`);
    console.log(`👉 ${url}`);
    console.log("==================================================");
  } catch (err) {
    console.error("[Cloudflare] Failed to start tunnel:", err);
  }
}

main();
