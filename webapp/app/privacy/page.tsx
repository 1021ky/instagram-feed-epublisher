import Link from "next/link";
import type { Metadata } from "next";
import { LegalContactBox, LegalPage, LegalSection } from "@/components/common/LegalPage";
import { LEGAL_UPDATED_AT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "プライバシーポリシー | FeedsToBook",
  description: "FeedsToBook のプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      description="FeedsToBook（以下「当サービス」）が取得する情報、利用目的、保存期間、第三者提供の有無、各地域におけるユーザーの権利およびお問い合わせ窓口について定めています。"
      updatedAt={LEGAL_UPDATED_AT}
    >
      <LegalSection title="1. はじめに（Introduction）">
        <p>
          FeedsToBook
          プロジェクト運営チーム（以下「当運営」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシー（以下「本ポリシー」）は、当サービスをご利用いただく際に、当運営がどのように情報を取得、利用、開示、および保護するかを説明するものです。
        </p>
        <p>
          本ポリシーは世界中のすべてのユーザーに適用され、日本（個人情報保護法・電気通信事業法）、欧州経済領域（EEA）および英国（GDPR）、米国カリフォルニア州（CCPA
          / CPRA）の居住者に向けた固有の法的要件を網羅しています。
        </p>
      </LegalSection>

      <LegalSection title="2. 取得する情報（Information We Collect）">
        <p>当サービスは、Instagram 連携および電子書籍生成のために、次の情報を取得・利用します。</p>
        <ul>
          <li>
            <strong>アカウント識別情報:</strong> Instagram ユーザー
            ID、ユーザー名など、ログインしたアカウントを識別するための情報
          </li>
          <li>
            <strong>投稿情報:</strong> 投稿写真、キャプション、投稿日時、投稿パーマリンク URL
            など、電子書籍生成に必要な投稿情報（ユーザーが電子書籍を生成・ダウンロードする処理時のみ一時的に取り扱います）
          </li>
          <li>
            <strong>セッションおよび技術情報:</strong> ログイン状態を維持するために必要な暗号化
            Cookie、アクセス日時、ブラウザ情報
          </li>
          <li>
            <strong>お問い合わせ情報:</strong>{" "}
            お問い合わせ時にユーザーが任意で入力したメールアドレス、お名前、ご相談内容
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          ※ 決済情報について:
          本サービスは無償で提供されており、クレジットカード番号等の決済情報を取得・保持することは一切ありません。
        </p>
      </LegalSection>

      <LegalSection title="3. 利用目的と GDPR 上の法的根拠（How We Use Your Information）">
        <p>
          取得した情報は、以下の目的に限って利用します。また、欧州一般データ保護規則（GDPR）に基づき、以下の法的根拠に依拠して処理を行います。
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-2.5 sm:p-3 font-semibold">利用目的</th>
                <th className="p-2.5 sm:p-3 font-semibold">取り扱うデータ</th>
                <th className="p-2.5 sm:p-3 font-semibold">GDPR 上の法的根拠</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              <tr>
                <td className="p-2.5 sm:p-3">
                  ユーザー本人が Instagram の投稿を取得し、電子書籍を生成・ダウンロードするため
                </td>
                <td className="p-2.5 sm:p-3">投稿情報、アカウント識別情報</td>
                <td className="p-2.5 sm:p-3">契約の履行（Art. 6(1)(b)）</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">ログイン状態の維持およびセッション管理のため</td>
                <td className="p-2.5 sm:p-3">アカウント識別情報、Cookie</td>
                <td className="p-2.5 sm:p-3">契約の履行（Art. 6(1)(b)）</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">不正利用の防止、セキュリティ維持、障害対応のため</td>
                <td className="p-2.5 sm:p-3">技術ログ、アカウント識別情報</td>
                <td className="p-2.5 sm:p-3">正当な利益（Art. 6(1)(f)）</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">ユーザーからのお問い合わせに対応するため</td>
                <td className="p-2.5 sm:p-3">お問い合わせ情報</td>
                <td className="p-2.5 sm:p-3">正当な利益（Art. 6(1)(f)）/ 同意（Art. 6(1)(a)）</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">法令に基づく義務を遵守するため</td>
                <td className="p-2.5 sm:p-3">該当する情報全般</td>
                <td className="p-2.5 sm:p-3">法的義務の遵守（Art. 6(1)(c)）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="4. Cookie および外部送信（Cookies and External Transmissions）">
        <p>
          当サービスでは、セッション維持およびセキュリティ確保のために必要不可欠な Cookie
          のみを使用しています。広告トラッキングやプロファイリングを目的とした第三者 Cookie
          は使用していません。
        </p>
        <p>
          <strong>外部送信規律に基づく開示:</strong>{" "}
          当サービスは、認証および機能提供のために以下の外部サービスへ必要最小限のデータを送信しています。
        </p>
        <ul>
          <li>
            <strong>Meta Platforms, Inc. (Instagram Graph API):</strong> Instagram
            ログイン認証および投稿一覧の取得のため。送信データ: ユーザーアクセストークン、Instagram
            ユーザー ID。
          </li>
          <li>
            <strong>Google LLC (Google Forms):</strong>{" "}
            お問い合わせフォームの運用のため。送信データ:
            ユーザーがフォーム上で入力した問い合わせ内容等。
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 第三者提供および開示（Sharing and Disclosure）">
        <p>
          当サービスは、法令に基づく場合を除き、取得した情報を第三者へ提供、販売、広告配信へ利用しません。
        </p>
        <p>
          ただし、Instagram ログインおよび電子書籍化に必要な投稿データ取得の範囲において、Meta
          Platforms, Inc. の提供する認証・API
          基盤を利用します。また、サービスの稼働に必要なクラウドインフラ事業者に対し、厳格な機密保持契約のもとでホスティングを委託しています。
        </p>
      </LegalSection>

      <LegalSection title="6. 国際データ移転（International Data Transfers）">
        <p>
          当サービスが取り扱う情報は、日本、米国、または当サービスのインフラ事業者および連携サービス（Meta
          Platforms, Inc. 等）がサーバーを設置するその他の国へ移転され、処理される場合があります。
        </p>
        <p>
          EEA および英国のユーザーについて:
          欧州委員会による十分性認定（日本に対する十分性認定を含みます）または欧州委員会承認の標準契約条項（SCCs）に依拠し、適切な保護水準を確保した上でデータ移転を行います。
        </p>
      </LegalSection>

      <LegalSection title="7. 保存期間とステートレス運用（Data Retention）">
        <p>
          当サービスは、プライバシー・バイ・デザインの理念に基づき、ユーザーのデータを恒久保存しないステートレスな構成を採用しています。
        </p>
        <p>
          投稿データおよび生成された電子書籍データは、ユーザーからの処理要求に応じて一時的に利用するのみで、サーバーへ永続保存しません。電子書籍生成処理の完了後は、当該処理のために取り扱った投稿データおよび生成物をサーバー上に残さない運用としています。
        </p>
        <p>
          ログイン状態の維持に必要なセッション情報は、ユーザーのログアウト操作、Cookie
          の削除、またはセッションの有効期限満了により順次自動的に無効化・破棄されます。
        </p>
      </LegalSection>

      <LegalSection title="8. 地域別の権利規定（Specific Rights by Jurisdiction）">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              A. 欧州経済領域（EEA）および英国の居住者（GDPR）
            </h3>
            <p>
              GDPR
              に基づき、ユーザーは自身の個人データへのアクセス権、訂正権、消去権（忘れられる権利）、処理制限権、データポータビリティ権、異議申立権、および管轄のデータ保護監督機関への異議申立権を有します。当サービスはサーバー上に個人データを恒久保存しない設計ですが、権利行使のご請求には誠実に対応いたします。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              B. カリフォルニア州居住者（CCPA / CPRA）
            </h3>
            <p>
              当サービスは、過去 12
              か月間において個人情報の販売（Sale）およびクロスコンテキスト行動広告のための共有（Share）を行っていません。カリフォルニア州法に基づき、収集された個人情報の開示請求権（知る権利）、削除請求権、訂正請求権、差別されない権利を有します。また、Global
              Privacy Control (GPC) などのオプトアウト嗜好シグナルを尊重します。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              C. 日本の居住者（個人情報保護法）
            </h3>
            <p>
              日本の個人情報保護法に基づき、保有個人データの開示、訂正、追加、削除、利用停止、消去、または第三者提供の停止を請求することができます。
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="9. 安全管理措置（Security Measures）">
        <p>
          当運営は、個人データの安全性を確保するため、以下の技術的・組織的安全管理措置を実施しています。
        </p>
        <ul>
          <li>すべての通信における TLS/SSL による通信暗号化（HTTPS 接続の強制）</li>
          <li>
            認証セッションにおける暗号化 Cookie および HttpOnly / Secure / SameSite 属性の適用
          </li>
          <li>
            投稿データをサーバーに恒久保存しないステートレス設計によるデータ漏洩リスクの最小化
          </li>
          <li>依存ライブラリの定期的な脆弱性監視とセキュリティアップデートの適用</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. 児童のプライバシー（Children's Privacy）">
        <p>
          当サービスは、13 歳未満（EEA またはカリフォルニア州においては 16
          歳未満）のお子様を対象としたサービスではなく、故意にお子様から個人情報を取得することはありません。
        </p>
      </LegalSection>

      <LegalSection title="11. 本ポリシーの変更（Changes to This Privacy Policy）">
        <p>
          当運営は、法令の変更やサービス内容の見直しに伴い、本ポリシーを改定することがあります。改定後のポリシーは本ページ上に掲示された時点から効力を生じるものとします。
        </p>
      </LegalSection>

      <LegalSection title="12. お問い合わせ窓口（Contact Information）">
        <p>
          本ポリシーに関するお問い合わせ、権利行使のご請求は、以下の窓口（お問い合わせフォーム）からご連絡ください。
        </p>
        <LegalContactBox />
        <p className="text-xs text-slate-500 mt-2">
          Instagram アカウントとの連携解除やデータの削除手順については、
          <Link href="/data-deletion">データ削除手順</Link> も併せてご確認ください。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
