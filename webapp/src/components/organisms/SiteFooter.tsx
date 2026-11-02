import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer pb-safe" role="contentinfo">
      <div className="page footer__inner">
        <div className="footer__card max-w-3xl mx-auto">
          <nav className="footer__links" aria-label="法的情報">
            <Link href="/privacy">プライバシーポリシー</Link>
            <Link href="/terms">利用規約</Link>
            <Link href="/data-deletion">データ削除手順</Link>
          </nav>
          <small>© FeedsToBook</small>
        </div>
      </div>
    </footer>
  );
}
