output "cloud_run_url" {
  description = "Cloud Run のデフォルトサービスURL"
  value       = google_cloud_run_v2_service.app.uri
}

output "custom_domain" {
  description = "設定された独自ドメイン"
  value       = var.domain_name
}

output "dns_records" {
  description = "独自ドメイン接続に必要な DNS レコード（A / AAAA 等）"
  value       = google_cloud_run_domain_mapping.domain.status[0].resource_records
}

output "wif_provider" {
  description = "GitHub Actions Secrets (WIF_PROVIDER) に設定する値"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}

output "deployer_service_account_email" {
  description = "GitHub Actions Secrets (WIF_SERVICE_ACCOUNT) に設定する値"
  value       = google_service_account.deployer.email
}

output "project_id" {
  description = "GitHub Actions Secrets (GCP_PROJECT_ID) に設定する値"
  value       = var.project_id
}
