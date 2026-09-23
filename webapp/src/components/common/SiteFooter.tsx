export function SiteFooter() {
  return (
    <footer className="footer pb-safe" role="contentinfo">
      <div className="page footer__inner">
        <div className="footer__card">
          <nav className="footer__links" aria-label="法的情報">
            <a href="/privacy">プライバシーポリシー</a>
            <a href="/terms">利用規約</a>
            <a href="/data-deletion">データ削除手順</a>
          </nav>
          <small>© FeedsToBook</small>
        </div>
      </div>
    </footer>
  );
}
