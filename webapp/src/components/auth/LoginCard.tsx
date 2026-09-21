"use client";

import { BookOpen, Hash, Sparkles } from "lucide-react";

type LoginCardProps = {
  loadingLogin: boolean;
  onDemo: () => void;
  onLogin: () => void;
};

const valuePoints = [
  {
    icon: Hash,
    title: "100日チャレンジをまとめる",
    description: "ハッシュタグや期間で必要な投稿だけをしぼり込みます。",
  },
  {
    icon: Sparkles,
    title: "EPUBの表紙つきで整える",
    description: "タイトル・著者情報を入れて、読み返しやすい一冊にできます。",
  },
  {
    icon: BookOpen,
    title: "Kindleに保存して読み返す",
    description: "ダウンロードした EPUB をそのまま端末に保管できます。",
  },
];

export function LoginCard({ loadingLogin, onDemo, onLogin }: LoginCardProps) {
  return (
    <section className="login-card card">
      <div className="login-card__intro">
        <div className="login-card__icon" aria-hidden="true">
          <span className="login-card__icon-ring" />
          <span className="login-card__icon-core" />
          <span className="login-card__icon-dot" />
        </div>
        <div className="card__header">
          <span className="tag">ログイン</span>
          <h2>Instagram の100日チャレンジを、本として残そう</h2>
          <p>
            投稿をまとめて抽出し、表紙つきの EPUB に変換できます。まずは Instagram
            ログイン、またはデモデータで体験してください。
          </p>
        </div>
      </div>

      <ul className="login-card__values">
        {valuePoints.map(({ description, icon: Icon, title }) => (
          <li key={title} className="login-card__value">
            <Icon size={18} aria-hidden="true" />
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="actions">
        <button className="primary" onClick={onLogin} disabled={loadingLogin}>
          {loadingLogin ? "移動中..." : "Instagramでログイン"}
        </button>
        <button className="ghost" onClick={onDemo}>
          デモデータ（100日チャレンジ）ですぐに体験
        </button>
      </div>
    </section>
  );
}
