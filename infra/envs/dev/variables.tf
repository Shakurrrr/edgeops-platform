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

  type        = number
  description = "Traffic weight (0.0 - 1.0) routed to canary version."
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

variable "canary_version" {
  type        = string
  description = "Semantic version string for canary (used only in Lambda env vars)."
  default     = "v0.2.1-canary"
}

variable "frontend_color" {
  type        = string
  description = "Frontend active color (blue|green) for dashboard."
  default     = "blue"
}

variable "canary_function_version" {
  type        = string
  description = "Numeric Lambda version to receive canary traffic (example: 6)"
  default     = ""
}