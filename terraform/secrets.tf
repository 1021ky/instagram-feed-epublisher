locals {
  secrets = [
    "INSTAGRAM_CLIENT_ID",
    "INSTAGRAM_CLIENT_SECRET",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_CONTACT_FORM_URL"
  ]
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each = toset(local.secrets)

  secret_id = each.key

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# 初回 apply 時の Cloud Run エラー（シークレットバージョン不在）を防止するため初期バージョンを登録
# ※ 本物の機密値へ gcloud やコンソールから更新された後も、ignore_changes により Terraform で上書きされません
resource "google_secret_manager_secret_version" "initial_versions" {
  for_each = google_secret_manager_secret.app_secrets

  secret      = each.value.id
  secret_data = each.key == "BETTER_AUTH_URL" ? "https://${var.domain_name}" : "placeholder"

  lifecycle {
    ignore_changes = [secret_data]
  }
}
