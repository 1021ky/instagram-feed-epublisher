# Cloud Run 実行用サービスアカウント
resource "google_service_account" "cloud_run_runtime" {
  account_id   = "${var.app_name}-runner"
  display_name = "Cloud Run Runtime SA for ${var.app_name}"
}

# Secret Manager 参照権限をランタイム SA に付与
resource "google_secret_manager_secret_iam_member" "secret_accessor" {
  for_each = google_secret_manager_secret.app_secrets

  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

# Cloud Run v2 サービス
resource "google_cloud_run_v2_service" "app" {
  name     = var.app_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_runtime.email
    timeout         = "300s"

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      # 初期デプロイ用イメージ（CI/CD によるビルド・デプロイで最新イメージに更新されます）
      image = "us-docker.pkg.dev/cloudrun/container/hello:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }

      ports {
        container_port = 8080
      }

      dynamic "env" {
        for_each = local.secrets
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app_secrets[env.value].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.initial_versions
  ]
}

# 未認証アクセス（一般公開）の許可
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 独自ドメインマッピング
resource "google_cloud_run_domain_mapping" "domain" {
  location = var.region
  name     = var.domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.app.name
  }

  depends_on = [google_cloud_run_v2_service.app]
}
