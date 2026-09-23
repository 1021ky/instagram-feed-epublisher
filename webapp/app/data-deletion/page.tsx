import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "データ削除手順 | FeedsToBook",
  description: "FeedsToBook のデータ削除手順です。",
};

const updatedAt = "2026年9月23日";
const contactUrl = "https://github.com/1021ky/instagram-feed-epublisher/issues";

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="データ削除手順"
      description="Meta の Data Deletion Instructions URL 要件に対応するため、FeedsToBook におけるデータ削除方法と Instagram 側の連携解除手順を案内します。"
      updatedAt={updatedAt}
    >
      <LegalSection title="1. 本サービスで保持しないデータ">
        <p>
          FeedsToBook は、Instagram 投稿データおよび生成した EPUB
          ファイルをサーバー上へ永続保存しません。
        </p>
        <p>
          投稿写真、キャプション、投稿 URL などは、ユーザーがその場で EPUB
          を生成してダウンロードするために一時的に利用され、処理完了後にサーバーへ残さない運用としています。
        </p>
      </LegalSection>

      <LegalSection title="2. アプリ内でできる削除・連携終了手順">
        <ol>
          <li>
            FeedsToBook
            にログインしている場合は、トップページ右上の「ログアウト」を選択してください。
          </li>
          <li>ブラウザに保存された Cookie を削除すると、保持中のログイン状態も解除されます。</li>
          <li>
            本サービスには、投稿データや生成済み EPUB を保存し続ける会員ストレージ機能はありません。
          </li>
        </ol>
        <p>
          そのため、アプリ内で継続保管される投稿データの削除申請は通常不要です。個別確認が必要な場合は、下記窓口へご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="3. Instagram アプリ側での連携解除手順">
        <ol>
          <li>Instagram または Facebook の設定画面を開きます。</li>
          <li>「設定」→「アプリとウェブサイト」（または同等の連携管理画面）へ進みます。</li>
          <li>FeedsToBook に関連する連携を選択し、削除または連携解除を実行します。</li>
        </ol>
        <p>
          連携解除後は、Instagram 側から本サービスへの再アクセスが停止されます。操作名は Meta 側 UI
          の更新により変更される場合があります。
        </p>
      </LegalSection>

      <LegalSection title="4. 削除依頼の問い合わせ先">
        <p>
          連携解除後も確認したい事項がある場合や、削除に関する問い合わせを行いたい場合は、GitHub
          Issues からご連絡ください。
        </p>
        <p>
          その際は、利用した Instagram ユーザー名、連携解除日、問い合わせ内容を記載してください。
        </p>
        <p>
          <a href={contactUrl} target="_blank" rel="noreferrer">
            {contactUrl}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
