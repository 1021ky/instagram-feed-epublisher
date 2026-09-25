# Google Cloud & CI/CD 環境構築手順書 (Terraform IaC)

本ドキュメントでは、FeedsToBook（`instagram-feed-epublisher`）を Google Cloud Run に自動デプロイするための環境構築手順を説明します。
インフラおよび権限設定はすべて `terraform/` 配下の Terraform（IaC）コードで宣言的に管理され、キーレス認証（Workload Identity Federation）によりセキュアな CI/CD を実現します。

---

## 1. 前提条件

以下のツールがローカル環境にインストールされ、認証されていることを確認してください。

- **Google Cloud SDK (`gcloud`)**: オーナー権限を持つアカウントで `gcloud auth login` および `gcloud auth application-default login` を完了していること。
- **Terraform**: `v1.5.0` 以上（`terraform version` で確認可能）。

---

## 2. GCP プロジェクトの準備

GCP プロジェクトの新規作成および課金アカウントの紐付けを行います。

```bash
# 任意のプロジェクトIDを設定（全世界で一意である必要があります）
export PROJECT_NAME="FeedsToBook"
export PROJECT_ID="feedstobook-$(openssl rand -hex 3)"

# 1. プロジェクトの作成
gcloud projects create "${PROJECT_ID}" --name="${PROJECT_NAME}"

# 2. デフォルトプロジェクトの設定
gcloud config set project "${PROJECT_ID}"

# 3. 請求先アカウント（Billing Account）の紐付け
# 課金アカウント一覧を確認し、適切な ACCOUNT_ID を指定してください
gcloud billing accounts list
export BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID"
gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT_ID}"
```

---

## 3. Terraform によるインフラ・権限の一括構築

リポジトリルートの `terraform/` ディレクトリに移動し、プロビジョニングを実行します。

```bash
cd terraform

# 1. 初期化
terraform init

# 2. 実行計画の確認
terraform plan -var="project_id=${PROJECT_ID}"

# 3. リソースの作成
terraform apply -var="project_id=${PROJECT_ID}"
```

### Terraform で自動作成・設定されるリソース

| 分類                     | 作成リソース                             | 説明                                                                        |
| :----------------------- | :--------------------------------------- | :-------------------------------------------------------------------------- |
| **API**                  | `google_project_service`                 | Cloud Run, Artifact Registry, Secret Manager, IAM, IAM Credentials の有効化 |
| **コンテナレジストリ**   | `google_artifact_registry_repository`    | Docker リポジトリ（`feedstobook`、東京リージョン）                          |
| **機密情報管理**         | `google_secret_manager_secret`           | 5 つのシークレットコンテナの作成と安全な初期バージョン管理                  |
| **アプリケーション基盤** | `google_cloud_run_v2_service`            | Cloud Run サービス（ゼロスケール、メモリ 2Gi、タイムアウト 300秒）          |
| **アクセス制御**         | `google_cloud_run_v2_service_iam_member` | 未認証アクセス（`allUsers`）への公開許可                                    |
| **独自ドメイン**         | `google_cloud_run_domain_mapping`        | `ksanchu.info` のマッピングと SSL 証明書リクエスト                          |
| **キーレス CI/CD 認証**  | `google_iam_workload_identity_pool*`     | GitHub Actions 専用の OIDC プール & プロバイダ                              |
| **サービスアカウント**   | `google_service_account`                 | Cloud Run 実行用 SA & GitHub Actions デプロイ用 SA                          |
| **IAM 権限**             | `google_project_iam_member`              | デプロイヤー SA への Cloud Run 管理・Artifact Registry 書込等の権限付与     |

---

## 4. Secret Manager への本番機密値の登録

Terraform では初回 apply 時の Cloud Run エラーを防止するため初期バージョン（プレースホルダー）が登録されています。
実際の値は Secret Manager の新バージョン（version 2 以降）として `gcloud` コマンド等で注入します。
（※ `terraform/secrets.tf` に `lifecycle { ignore_changes = [secret_data] }` が設定されているため、登録後に `terraform apply` を再実行しても値は上書きされず保護されます）

### 登録コマンド（末尾の改行を含めない `echo -n` で実行）

```bash
PROJECT_ID="feeds-to-book"

# 1. Better Auth Secret (32バイト以上のランダム暗号鍵を自動生成して登録)
openssl rand -hex 32 | gcloud secrets versions add BETTER_AUTH_SECRET \
  --project="${PROJECT_ID}" --data-file=-

# 2. 本番用公開 URL (独自ドメイン開通前は Cloud Run デフォルト URL、開通後にドメインへ更新可能)
echo -n "https://feedstobook-qzjrsxqziq-an.a.run.app" | gcloud secrets versions add BETTER_AUTH_URL \
  --project="${PROJECT_ID}" --data-file=-

# 3. Instagram App ID (Meta for Developers)
echo -n "YOUR_INSTAGRAM_CLIENT_ID" | gcloud secrets versions add INSTAGRAM_CLIENT_ID \
  --project="${PROJECT_ID}" --data-file=-

# 4. Instagram App Secret (Meta for Developers)
echo -n "YOUR_INSTAGRAM_CLIENT_SECRET" | gcloud secrets versions add INSTAGRAM_CLIENT_SECRET \
  --project="${PROJECT_ID}" --data-file=-

# 5. お問い合わせフォーム URL (Google Forms 等)
echo -n "https://forms.gle/YOUR_FORM_ID" | gcloud secrets versions add NEXT_PUBLIC_CONTACT_FORM_URL \
  --project="${PROJECT_ID}" --data-file=-
```

---

## 5. GitHub リポジトリの Variables（環境変数）登録

GitHub Actions から GCP への認証には **Workload Identity Federation (WIF)** を使用します。
WIF は秘密鍵（サービスアカウントキー JSON）を発行せず、GitHub の OIDC トークンとリポジトリ名を GCP 側で検証するセキュアな仕組みです。
そのため、プロバイダ名や SA メールアドレスは秘密情報ではなく設定値であるため、Secrets ではなく **Variables (`vars`)** で管理します。

### GitHub CLI (`gh`) での登録（推奨）

リポジトリルートで以下のコマンドを実行します：

```bash
gh variable set GCP_PROJECT_ID --body "feeds-to-book"
gh variable set WIF_PROVIDER --body "projects/240898930397/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
gh variable set WIF_SERVICE_ACCOUNT --body "github-actions-deployer@240898930397.iam.gserviceaccount.com"
```

### GitHub Web UI からの登録

1. GitHub リポジトリの **Settings > Secrets and variables > Actions** を開く。
2. **「Variables」タブ**（Secrets タブの隣）を選択。
3. **「New repository variable」** をクリックし、以下の 3 つを追加：

| 変数名 (Name)         | 設定値 (Value)                                                                                       | 説明                                             |
| :-------------------- | :--------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `GCP_PROJECT_ID`      | `feeds-to-book`                                                                                      | GCP プロジェクト ID                              |
| `WIF_PROVIDER`        | `projects/240898930397/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | Workload Identity プロバイダのリソース名         |
| `WIF_SERVICE_ACCOUNT` | `github-actions-deployer@240898930397.iam.gserviceaccount.com`                                       | デプロイ実行用サービスアカウントのメールアドレス |

> [!NOTE]
> `.github/workflows/deploy.yml` 内では `${{ vars.GCP_PROJECT_ID || secrets.GCP_PROJECT_ID }}` のように記述されており、Variables と Secrets のどちらに設定されていても動作するようフォールバック設計になっています。

---

## 6. 独自ドメイン (`feedstobook.ksanchu.info`) の有効化と DNS 設定

独自ドメインマッピングは、Google Search Console での所有権確認に時間がかかる場合があるため、**初期構築時はデフォルト無効（`enable_custom_domain = false`）** となっています。
初期構築完了後、Cloud Run のデフォルト URL（`https://feedstobook-xxxxx-an.a.run.app`）で先行して稼働・CI/CD テストを行えます。

### 6-1. ドメイン所有権確認後の有効化

Search Console で親ドメイン `ksanchu.info` の所有権が確認できたら、以下のコマンドでドメインマッピングを追加作成します：

```bash
cd terraform
terraform apply -var="project_id=${PROJECT_ID}" -var="enable_custom_domain=true"
```

### 6-2. DNS レコードの設定

apply 完了後、`terraform output dns_records` で DNS 設定レコードが出力されます：

```bash
terraform output dns_records
```

お使いのドメイン管理サービス（Cloudflare 等）の DNS 管理画面で、サブドメイン `feedstobook` に対して出力された CNAME レコード（または A / AAAA レコード）を追加してください。

> [!NOTE]
> DNS レコードの設定後、Google のマネージド SSL/TLS 証明書が自動発行され、HTTPS アクセス（`https://feedstobook.ksanchu.info`）が有効化されます（反映まで通常 15分〜数時間程度かかります）。

---

## 7. CI/CD による自動デプロイ

以上の設定が完了したら、GitHub リポジトリの `main` ブランチに PR をマージするか、**Actions** タブから `Deploy to Cloud Run` ワークフローを手動実行（Run workflow）します。

1. GitHub Actions が Workload Identity Federation 経由で一時トークンを取得。
2. Next.js アプリケーションの Docker イメージをマルチステージビルド。
3. Artifact Registry へイメージを push。
4. Cloud Run へ新リビジョンをデプロイし、Secret Manager から機密情報が注入されて稼働開始。
