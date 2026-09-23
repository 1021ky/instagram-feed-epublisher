import type { ReactNode } from "react";

type LegalPageProps = {
  children: ReactNode;
  description: string;
  title: string;
  updatedAt: string;
};

type LegalSectionProps = {
  children: ReactNode;
  title: string;
};

export function LegalPage({ children, description, title, updatedAt }: LegalPageProps) {
  return (
    <main className="page legal-page">
      <a href="/" className="legal-page__back" aria-label="トップページへ戻る">
        ← トップページへ戻る
      </a>
      <article className="card legal-page__card">
        <header className="legal-page__header">
          <div className="badge">Meta 審査対応</div>
          <div>
            <h1>{title}</h1>
            <p className="lede">{description}</p>
          </div>
          <p className="legal-page__updated">最終更新日: {updatedAt}</p>
        </header>
        {children}
      </article>
    </main>
  );
}

export function LegalSection({ children, title }: LegalSectionProps) {
  return (
    <section className="legal-page__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
