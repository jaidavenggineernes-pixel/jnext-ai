// @ts-ignore
import midtransClient from "midtrans-client";

// Initialize Midtrans Snap client
// The keys will be loaded from the environment variables (.env)
// If they are missing, it defaults to a placeholder to prevent crashes during development.
export const snap = new midtransClient.Snap({
  isProduction: false, // Set to false for Sandbox mode
  serverKey: process.env.MIDTRANS_SERVER_KEY || "YOUR_SERVER_KEY",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY",
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "YOUR_SERVER_KEY",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY",
});
