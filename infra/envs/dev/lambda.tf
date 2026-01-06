resource "aws_lambda_function" "api" {
  function_name = "edgeops-dev-api"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "src/server.handler"
  runtime       = "nodejs20.x"

  filename         = "../../../dist/api.zip"
  source_code_hash = filebase64sha256("../../../dist/api.zip")

  environment {
    variables = {
      SERVICE_NAME = "edgeops-api"
      VERSION      = "v0.1.0"
      DEPLOYMENT   = "stable"
      ENVIRONMENT  = "dev"
      COMMIT       = "local"
    }
  }
}
