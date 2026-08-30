import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function resolveInstagramAccessToken(_req: Request): Promise<string> {
  // Try to get session
  const headerValues = await headers();
  const session = await auth.api.getSession({
    headers: headerValues,
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Return a mock token for prototype
  return process.env.MOCK_ACCESS_TOKEN || "mock_token";
}
