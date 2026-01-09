output "dashboard_blue_bucket_name" {
  value = aws_s3_bucket.dashboard_blue.bucket
}

output "dashboard_green_bucket_name" {
  value = aws_s3_bucket.dashboard_green.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}
