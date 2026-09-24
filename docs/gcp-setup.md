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

Terraform では初期値としてプレースホルダーが登録されているため、実際の機密値を登録します。
（※ `terraform/secrets.tf` に `lifecycle { ignore_changes = [secret_data] }` が設定されているため、登録後に `terraform apply` を再実行しても値は上書きされません）

```bash
# Instagram App Credentials
gcloud secrets versions add INSTAGRAM_CLIENT_ID --data-file=- <<EOF
YOUR_INSTAGRAM_CLIENT_ID
EOF

gcloud secrets versions add INSTAGRAM_CLIENT_SECRET --data-file=- <<EOF
YOUR_INSTAGRAM_CLIENT_SECRET
EOF

# Better Auth Secret (32バイト以上のランダム文字列)
export BETTER_AUTH_SECRET_VAL=$(openssl rand -hex 32)
gcloud secrets versions add BETTER_AUTH_SECRET --data-file=- <<EOF
${BETTER_AUTH_SECRET_VAL}
EOF

# 本番用公開 URL (独自ドメイン)
gcloud secrets versions add BETTER_AUTH_URL --data-file=- <<EOF
https://feedstobook.ksanchu.info
EOF

# お問い合わせフォーム URL (Google Forms 等)
gcloud secrets versions add NEXT_PUBLIC_CONTACT_FORM_URL --data-file=- <<EOF
https://forms.gle/YOUR_FORM_ID
EOF
```

---

## 5. GitHub リポジトリの Secrets 登録

`terraform output` を実行すると、GitHub Actions に設定すべき値が出力されます。

```bash
terraform output
```

出力された値を、GitHub リポジトリの **Settings > Secrets and variables > Actions** に登録します：

| シークレット名        | 設定する値（terraform output）               |
| :-------------------- | :------------------------------------------- |
| `GCP_PROJECT_ID`      | `output.project_id` の値                     |
| `WIF_SERVICE_ACCOUNT` | `output.deployer_service_account_email` の値 |
| `WIF_PROVIDER`        | `output.wif_provider` の値                   |

---

## 6. 独自ドメイン (`ksanchu.info`) の DNS 設定

`terraform output dns_records` で出力される DNS レコードを確認します。

```bash
terraform output dns_records
```

例として、以下のような A レコードおよび AAAA レコードが出力されます：

```text
Record Type: A
Values: 216.239.32.21, 216.239.34.21, 216.239.36.21, 216.239.38.21

Record Type: AAAA
Values: 2001:4860:4802:32::15, ...
```

お使いのドメイン管理サービス（お名前.com、Cloudflare 等）の DNS 設定画面で、`ksanchu.info` に対して上記のレコードを追加してください。

> [!NOTE]
> DNS レコードの設定後、Google のマネージド SSL/TLS 証明書が自動発行され、HTTPS アクセス（`https://feedstobook.ksanchu.info`）が有効化されます（反映まで通常 15分〜数時間程度かかります）。

---

## 7. CI/CD による自動デプロイ

以上の設定が完了したら、GitHub リポジトリの `main` ブランチに PR をマージするか、**Actions** タブから `Deploy to Cloud Run` ワークフローを手動実行（Run workflow）します。

1. GitHub Actions が Workload Identity Federation 経由で一時トークンを取得。
2. Next.js アプリケーションの Docker イメージをマルチステージビルド。
3. Artifact Registry へイメージを push。
4. Cloud Run へ新リビジョンをデプロイし、Secret Manager から機密情報が注入されて稼働開始。
