resource "google_artifact_registry_repository" "app_repo" {
  repository_id = var.app_name
  location      = var.region
  format        = "DOCKER"
  description   = "Docker repository for ${var.app_name}"

  depends_on = [google_project_service.apis]
}
