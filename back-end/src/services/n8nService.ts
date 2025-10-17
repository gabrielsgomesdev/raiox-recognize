import axios from "axios";
import * as fsSync from "fs";
import FormData from "form-data";

const N8N_URL = process.env.N8N_WEBHOOK_URL as string;
const SECRET = process.env.N8N_SHARED_SECRET || "";

export async function sendToN8n(filePath: string, description: string, hash: string) {
  const form = new FormData();
  form.append("data", fsSync.createReadStream(filePath));
  form.append("description", description);
  form.append("sha256", hash);
  form.append("receivedAt", new Date().toISOString());

  const headers: Record<string, string> = { ...form.getHeaders() };
  if (SECRET) headers["X-Shared-Secret"] = SECRET;

  console.log({
    description,
    sha256: hash,
    receivedAt: new Date().toISOString(),
    fileName: filePath.split("/").pop(),
  });

  // const resp = await axios.post(N8N_URL, form, { headers, timeout: 30000 });
  // console.log("✅ n8n respondeu:", resp.status, resp.data);
}
