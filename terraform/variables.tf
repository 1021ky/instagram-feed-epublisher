variable "project_id" {
  type        = string
  description = "Google Cloud プロジェクトID"
}

variable "region" {
  type        = string
  description = "デフォルトリージョン"
  default     = "asia-northeast1"
}

variable "app_name" {
  type        = string
  description = "アプリケーション名"
  default     = "feedstobook"
}

variable "domain_name" {
  type        = string
  description = "独自ドメイン"
  default     = "ksanchu.info"
}

variable "github_repository" {
  type        = string
  description = "GitHub リポジトリ (owner/repo)"
  default     = "1021ky/instagram-feed-epublisher"
}
