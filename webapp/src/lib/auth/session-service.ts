/**
 * @file Better Authのセッションから Instagram アクセストークンを取得するサービス
 * 
 * 注意: このファイル名は "session-service.ts" であり、.gitignore の "session-*" パターンに
 * マッチしてしまいますが、これはアプリケーションの重要なソースコードです。
 * .gitignore では "session-*" パターンで Instaloader が生成するセッションファイルを
 * 除外していますが、このファイルは "!webapp/src/lib/auth/session-service.ts" で
 * 明示的に許可されています。
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

  if (!session?.session || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Get the account linked to the user for Instagram provider
  const accounts = await auth.api.listAccounts({
    headers: request.headers,
  });

  const instagramAccount = accounts.find((account) => account.providerId === "instagram");

  if (!instagramAccount) {
    throw new Error("Instagram account not linked");
  }

  const accessToken = instagramAccount.accessToken;

  if (!accessToken) {
    throw new Error("Instagram access token not found in session");
  }

  return accessToken;
}
