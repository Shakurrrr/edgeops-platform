# Lambda Function (publishes versions)

resource "aws_lambda_function" "api" {
  function_name = "edgeops-dev-api"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "src/server.handler"
  runtime       = "nodejs20.x"

  filename         = "../../../dist/api.zip"
  source_code_hash = filebase64sha256("../../../dist/api.zip")

  # Critical: every change publishes a numbered version
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

# Stable alias with weighted canary routing

resource "aws_lambda_alias" "stable" {
  name          = "stable"
  function_name = aws_lambda_function.api.function_name

  # Stable points to pinned version 1
  function_version = aws_lambda_function.api.version

  # Route % of traffic to newest version (v2) = canary
  routing_config {
    additional_version_weights = {
      "${aws_lambda_function.api.version}" = var.canary_weight
    }
  }
}

