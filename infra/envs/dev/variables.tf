variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "edgeops"
}

# --- Day 4: Progressive Delivery Controls ---

variable "api_version" {
  description = "API version string returned by /api/version"
  type        = string
  default     = "v0.1.0"
}

variable "api_deployment" {
  description = "Deployment label returned by /api/version (stable or canary)"
  type        = string
  default     = "stable"
}

variable "api_commit" {
  description = "Commit identifier returned by /api/version"
  type        = string
  default     = "local"
}

variable "stable_version" {
  description = "Pinned stable Lambda version number (string). Example: \"1\""
  type        = string
}

variable "canary_weight" {
  description = "Percent of traffic routed to canary (0.0 - 1.0). Example: 0.1 = 10%"
  type        = number
  default     = 0.0
}

variable "active_dashboard_color" {
  description = "Which dashboard environment CloudFront should serve: blue or green"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.active_dashboard_color)
    error_message = "active_dashboard_color must be either 'blue' or 'green'"
  }
}
