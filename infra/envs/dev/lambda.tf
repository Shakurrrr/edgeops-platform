locals {
  api_zip_path = "${path.module}/../../../dist/api.zip"
}

# Lambda Function (publishes versions on every code change)
resource "aws_lambda_function" "api" {
  function_name = "edgeops-dev-api"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "src/server.handler"
  runtime       = "nodejs20.x"

  filename         = local.api_zip_path
  source_code_hash = filebase64sha256(local.api_zip_path)

  # Critical: publishes a numeric version on every update (1,2,3...)
  publish = true

  environment {
    variables = {
      SERVICE_NAME = "edgeops-api"
      VERSION      = var.api_version
      DEPLOYMENT   = var.api_deployment
      ENVIRONMENT  = var.environment
      COMMIT       = var.api_commit
    }
  }
}

# Stable alias with optional canary routing
resource "aws_lambda_alias" "stable" {
  name             = "stable"
  function_name    = aws_lambda_function.api.function_name
  function_version = aws_lambda_function.api.version

  dynamic "routing_config" {
    for_each = (var.canary_weight > 0 && var.canary_function_version != "") ? [1] : []
    content {
      additional_version_weights = {
        var.canary_function_version = var.canary_weight
      }
    }
  }
}

