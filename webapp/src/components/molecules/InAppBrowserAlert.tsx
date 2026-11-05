"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

const inAppBrowserMarkers = ["instagram", "fban", "fbav", "fbios", "messenger"];

export function isInstagramOrFacebookInAppBrowser(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return inAppBrowserMarkers.some((marker) => normalized.includes(marker));
}

export function InAppBrowserAlert() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isInstagramOrFacebookInAppBrowser(window.navigator.userAgent));
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="in-app-alert" role="alert">
      <div className="in-app-alert__icon" aria-hidden="true">
        <AlertTriangle size={18} />
      </div>
      <div className="in-app-alert__body">
        <p className="in-app-alert__title">Instagram / Facebook アプリ内ブラウザを検知しました</p>
        <p className="in-app-alert__text">
          右上の「…」から Safari / Chrome などのブラウザで開いてください。EPUB
          の保存は外部ブラウザの利用をおすすめします。
        </p>
      </div>
      <ExternalLink size={18} aria-hidden="true" />
    </aside>
  );
}
