"use client";

import { useCallback, useMemo, useState } from "react";
import { authClient, signInWithInstagram } from "@/lib/auth-client";
import { sampleDemoFeedData } from "@/lib/demo/sampleData";
import type { AppMode, UserProfile } from "@/types/ui";
import { createDemoUserProfile, normalizeUsername, toLoggedInUserProfile } from "./profile";

/**
 * 認証・デモモード遷移フックが受け取る外部連携コールバック。
 */
export interface UseAuthFlowOptions {
  onError: (message: string | null) => void;
  onResetDemo: () => void;
  onLoggedOut: () => void;
}

/**
 * 認証・デモモードの状態およびログイン／ログアウト操作ハンドラ。
 */
export interface UseAuthFlowResult {
  appMode: AppMode;
  isLoggedIn: boolean;
  isSessionPending: boolean;
  isDemoMode: boolean;
  canUseApp: boolean;
  loadingLogin: boolean;
  activeProfile: UserProfile | null;
  username: string;
  logoutNotice: { username?: string } | null;
  dismissLogoutNotice: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

/**
 * Better Auth セッションとデモ体験モードの切替、ログイン・ログアウト処理を一元管理するフック。
 */
export function useAuthFlow({
  onError,
  onResetDemo,
  onLoggedOut,
}: UseAuthFlowOptions): UseAuthFlowResult {
  const [appMode, setAppMode] = useState<AppMode>("real");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState<{ username?: string } | null>(null);

  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);
  const isSessionPending = session.isPending;
  const isDemoMode = appMode === "demo";
  const canUseApp = isLoggedIn || isDemoMode;

  const loggedInProfile = useMemo<UserProfile | null>(
    () => toLoggedInUserProfile(session.data?.user),
    [session.data],
  );

  const activeProfile = useMemo<UserProfile | null>(
    () => (isDemoMode ? createDemoUserProfile(sampleDemoFeedData) : loggedInProfile),
    [isDemoMode, loggedInProfile],
  );

  const username = normalizeUsername(activeProfile?.username);

  const dismissLogoutNotice = useCallback(() => {
    setLogoutNotice(null);
  }, []);

  const enterDemoMode = useCallback(() => {
    setAppMode("demo");
  }, []);

  const exitDemoMode = useCallback(() => {
    setAppMode("real");
  }, []);

  const handleLogin = useCallback(async () => {
    setLoadingLogin(true);
    onError(null);
    setLogoutNotice(null);
    try {
      await signInWithInstagram();
    } catch (e) {
      console.error(e);
      onError(e instanceof Error ? e.message : "ログインに失敗しました");
      setLoadingLogin(false);
    }
  }, [onError]);

  const handleLogout = useCallback(async () => {
    if (isDemoMode) {
      setAppMode("real");
      onResetDemo();
      return;
    }
    const loggedOutUsername = activeProfile?.username;
    await authClient.signOut();
    onLoggedOut();
    setLogoutNotice({ username: loggedOutUsername });
  }, [activeProfile?.username, isDemoMode, onLoggedOut, onResetDemo]);

  return {
    appMode,
    isLoggedIn,
    isSessionPending,
    isDemoMode,
    canUseApp,
    loadingLogin,
    activeProfile,
    username,
    logoutNotice,
    dismissLogoutNotice,
    enterDemoMode,
    exitDemoMode,
    handleLogin,
    handleLogout,
  };
}
