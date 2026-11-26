import type { DemoFeedData, UserProfile } from "@/types/ui";

export interface SessionUserInput {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const INSTAGRAM_LOCAL_EMAIL_SUFFIX = "@instagram.local";

export function toLoggedInUserProfile(
  user: SessionUserInput | null | undefined,
): UserProfile | null {
  if (!user) {
    return null;
  }

  const fallbackUsername = user.email?.endsWith(INSTAGRAM_LOCAL_EMAIL_SUFFIX)
    ? user.email.slice(0, -INSTAGRAM_LOCAL_EMAIL_SUFFIX.length)
    : undefined;

  return {
    id: user.id,
    username: user.name ?? fallbackUsername,
    displayName: user.name ?? fallbackUsername,
    avatarUrl: user.image ?? undefined,
  };
}

export function createDemoUserProfile(
  demo: Pick<DemoFeedData, "username" | "avatarUrl">,
): UserProfile {
  return {
    id: "demo-user",
    username: demo.username,
    displayName: "Demo User",
    avatarUrl: demo.avatarUrl,
  };
}

export function normalizeUsername(username?: string | null): string {
  return username?.replace(/^@/, "") ?? "";
}

export function formatLogoutBannerTitle(username?: string): string {
  const trimmed = username?.trim();
  if (!trimmed) {
    return "FeedsToBook からログアウトしました";
  }
  const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  return `FeedsToBook からログアウトしました（${normalized}）`;
}
