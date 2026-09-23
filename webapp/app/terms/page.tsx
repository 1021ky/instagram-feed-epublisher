import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/common/LegalPage";
import { CONTACT_FORM_URL, LEGAL_UPDATED_AT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "利用規約 | FeedsToBook",
  description: "FeedsToBook の利用規約です。",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="利用規約"
      description="FeedsToBook の利用条件、禁止事項、免責事項、および運営上の取り扱いを定めています。"
      updatedAt={LEGAL_UPDATED_AT}
    >
      <LegalSection title="1. 適用">
        <p>
          本規約は、FeedsToBook が提供する Instagram
          投稿の取得、選択、電子書籍生成およびダウンロード機能の利用条件を定めるものです。
        </p>
      </LegalSection>

      <LegalSection title="2. 利用条件">
        <ul>
          <li>
            利用者は、自ら利用権限を有する Instagram
            アカウントについてのみ本サービスを利用してください。
          </li>
          <li>
            利用者は、Meta および Instagram
            の利用規約、コミュニティ規定、関連法令を遵守するものとします。
          </li>
          <li>
            本サービスは、利用者自身の閲覧・保存・振り返りを目的とした電子書籍生成のために提供されます。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 禁止事項">
        <ul>
          <li>第三者のアカウントやコンテンツを権限なく取得・利用する行為</li>
          <li>本サービスまたは Instagram API に過度な負荷を与える行為</li>
          <li>違法、公序良俗違反、権利侵害、またはこれらを助長する目的で利用する行為</li>
          <li>本サービスの運営を妨害し、またはセキュリティを害する行為</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. サービス内容の変更・停止">
        <p>
          FeedsToBook
          は、保守、障害対応、法令対応、外部サービスの仕様変更その他の理由により、事前の予告なく本サービスの全部または一部を変更、停止または終了することがあります。
        </p>
      </LegalSection>

      <LegalSection title="5. 免責事項">
        <ul>
          <li>
            Instagram API や Meta
            の仕様変更、制限、障害により、本サービスの全部または一部が利用できない場合があります。
          </li>
          <li>
            生成された電子書籍の表示結果や端末ごとの互換性について、常時完全性を保証するものではありません。
          </li>
          <li>
            利用者が本サービスを利用して保存・管理する投稿データ、著作物その他の権利関係については、利用者自身の責任で確認してください。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. データの取り扱い">
        <p>
          投稿データおよび生成された電子書籍は、ユーザーの要求に応じた処理のためにのみ取り扱い、サーバーへ永続保存しません。
        </p>
        <p>
          詳細は <Link href="/privacy">プライバシーポリシー</Link> および{" "}
          <Link href="/data-deletion">データ削除手順</Link> をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="7. 規約の変更">
        <p>
          FeedsToBook
          は、必要に応じて本規約を変更できます。変更後の規約は、本ページに掲載した時点から効力を生じます。
        </p>
      </LegalSection>

      <LegalSection title="8. お問い合わせ先">
        <p>本規約に関するお問い合わせは、以下の窓口（お問い合わせフォーム）をご利用ください。</p>
        <p>
          <a href={CONTACT_FORM_URL} target="_blank" rel="noreferrer">
            お問い合わせ窓口を開く
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
