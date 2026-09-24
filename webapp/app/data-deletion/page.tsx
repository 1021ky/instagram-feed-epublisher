import Link from "next/link";
import type { Metadata } from "next";
import { LegalContactBox, LegalPage, LegalSection } from "@/components/common/LegalPage";
import { LEGAL_UPDATED_AT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "データ削除手順 | FeedsToBook",
  description: "FeedsToBook のデータ削除手順です。",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="データ削除手順"
      description="FeedsToBook におけるユーザーデータの取り扱い、削除方法、および Instagram アカウントとの連携解除手順をご案内します。"
      updatedAt={LEGAL_UPDATED_AT}
    >
      <LegalSection title="1. 本サービスで保持しないデータ">
        <p>
          FeedsToBook は、Instagram
          投稿データおよび生成した電子書籍ファイルをサーバー上へ永続保存しません。
        </p>
        <p>
          投稿写真、キャプション、投稿 URL
          などは、ユーザーがその場で電子書籍を生成してダウンロードするために一時的に利用され、処理完了後にサーバーへ残さない運用としています。
        </p>
        <p>
          当サービスにおける個人情報の取り扱い全般については、
          <Link href="/privacy">プライバシーポリシー</Link>
          も併せてご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="2. アプリ内でできる削除・連携終了手順">
        <ol>
          <li>
            FeedsToBook にログインしている場合は、トップページ右上の「退会（連携解除）」を選択し、
            確認ダイアログで実行を確定してください。
          </li>
          <li>
            実行後は Instagram 連携の解除を試みるとともに、ブラウザに保存された認証 Cookie
            を削除してログアウトします。
          </li>
          <li>
            本サービスには、投稿データや生成済み電子書籍を保存し続ける会員ストレージ機能はありません。
          </li>
        </ol>
        <p>
          自動処理で連携解除まで完了しない場合は、次項の Instagram
          側管理画面からも解除状況をご確認ください。個別確認が必要な場合は、下記窓口へご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="3. Instagram アプリ側での連携解除手順">
        <ol>
          <li>
            Instagram または Facebook の設定画面を開きます（Web 版の場合は{" "}
            <a
              href="https://www.instagram.com/accounts/manage_access/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram アプリとウェブサイト設定
            </a>{" "}
            から直接アクセスできます）。
          </li>
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
          連携解除後も確認したい事項がある場合や、削除に関するお問い合わせを行いたい場合は、以下の窓口（お問い合わせフォーム）からご連絡ください。
        </p>
        <LegalContactBox note="※送信時は、利用した Instagram ユーザー名、連携解除日をご記載ください。" />
      </LegalSection>
    </LegalPage>
  );
}
