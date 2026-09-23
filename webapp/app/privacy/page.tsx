import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | FeedsToBook",
  description: "FeedsToBook のプライバシーポリシーです。",
};

const updatedAt = "2026年9月23日";
const contactUrl = "https://github.com/1021ky/instagram-feed-epublisher/issues";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      description="FeedsToBook が取得する情報、利用目的、保存期間、第三者提供の有無、ユーザーの皆さまが確認できる問い合わせ先を定めています。"
      updatedAt={updatedAt}
    >
      <LegalSection title="1. 取得する情報">
        <p>
          FeedsToBook は、Instagram 連携および EPUB 生成のために、次の情報を取得することがあります。
        </p>
        <ul>
          <li>Instagram ユーザー ID、ユーザー名など、ログインしたアカウントを識別するための情報</li>
          <li>投稿写真、キャプション、投稿日時、投稿 URL など、EPUB 生成に必要な投稿情報</li>
          <li>ログイン状態を維持するために必要な Cookie その他これに準ずるセッション情報</li>
          <li>お問い合わせ時にユーザーが任意で提供した情報</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 利用目的">
        <p>取得した情報は、次の目的に限って利用します。</p>
        <ul>
          <li>ユーザー本人が Instagram の投稿を取得し、EPUB 書籍を生成・ダウンロードするため</li>
          <li>ログイン状態の維持、不正利用の防止、障害対応などサービス運営上必要な確認のため</li>
          <li>ユーザーからのお問い合わせに対応するため</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 保存期間と削除">
        <p>
          投稿データおよび生成された EPUB
          データは、ユーザーからの処理要求に応じて一時的に利用するのみで、サーバーへ永続保存しません。
        </p>
        <p>
          EPUB
          生成処理の完了後は、当該処理のために取り扱った投稿データおよび生成物をサーバー上に残さない運用としています。
        </p>
        <p>
          ログイン状態の維持に必要なセッション情報は、ユーザーのログアウト操作、Cookie
          の削除、またはセッションの有効期限満了により順次無効化されます。
        </p>
      </LegalSection>

      <LegalSection title="4. 第三者提供">
        <p>
          FeedsToBook
          は、法令に基づく場合を除き、取得した情報を第三者へ提供、販売、広告配信へ利用しません。
        </p>
        <p>
          ただし、Instagram ログインおよび Instagram API の利用に必要な範囲では、Meta Platforms,
          Inc. の提供する認証・API 基盤を利用します。
        </p>
      </LegalSection>

      <LegalSection title="5. ユーザーによる管理">
        <p>
          ユーザーはいつでも Instagram 側の連携解除設定またはブラウザの Cookie
          削除によって、本サービスとの連携状態を見直せます。
        </p>
        <p>
          詳細な手順は <a href="/data-deletion">データ削除手順</a> をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="6. お問い合わせ先">
        <p>本ポリシーに関するお問い合わせは、GitHub Issues からご連絡ください。</p>
        <p>
          <a href={contactUrl} target="_blank" rel="noreferrer">
            {contactUrl}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
