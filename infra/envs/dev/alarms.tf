resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "edgeops-dev-apigw-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  dimensions = {
    ApiName = aws_apigatewayv2_api.api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "apigw_latency" {
  alarm_name          = "edgeops-dev-apigw-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  dimensions = {
    ApiName = aws_apigatewayv2_api.api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "edgeops-dev-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}
