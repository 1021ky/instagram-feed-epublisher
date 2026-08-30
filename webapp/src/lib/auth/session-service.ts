/**
 * @file Session service for resolving Instagram access tokens from Better Auth sessions.
 */
import { auth } from "@/lib/auth";

/**
 * Resolves the Instagram access token from the current session.
 *
 * @param request - The incoming request object
 * @returns The Instagram access token
 * @throws Error if the user is not authenticated or access token is missing
 */
export async function resolveInstagramAccessToken(request: Request): Promise<string> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new Error("未ログインです");
  }

  // If getAccessToken API is available on auth.api, check it first
  if (typeof (auth.api as Record<string, unknown>).getAccessToken === "function") {
    const tokenResult = await (
      auth.api as unknown as {
        getAccessToken: (options: {
          headers: Headers;
          params?: { providerId: string };
        }) => Promise<{ accessToken?: string } | null>;
      }
    ).getAccessToken({
      headers: request.headers,
      params: { providerId: "instagram" },
    });
    if (tokenResult?.accessToken) {
      return tokenResult.accessToken;
    }
  }

  // Get user accounts linked to the user
  if (typeof (auth.api as Record<string, unknown>).listUserAccounts === "function") {
    const accounts = await (
      auth.api as unknown as {
        listUserAccounts: (options: {
          headers: Headers;
        }) => Promise<Array<{ providerId: string; accessToken?: string }>>;
      }
    ).listUserAccounts({
      headers: request.headers,
    });

    const instagramAccount = accounts.find((account) => account.providerId === "instagram");
    if (instagramAccount?.accessToken) {
      return instagramAccount.accessToken;
    }
  }

  throw new Error("Instagram access token not found in session");
}
