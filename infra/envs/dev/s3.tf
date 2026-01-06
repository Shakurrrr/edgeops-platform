resource "aws_s3_bucket" "dashboard" {
  bucket = "${var.project}-${var.environment}-dashboard-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "dashboard" {
  bucket                  = aws_s3_bucket.dashboard.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# This must be in the same dev stack (envs/dev) so it can reference the CloudFront distribution.
resource "aws_s3_bucket_policy" "dashboard_policy" {
  bucket = aws_s3_bucket.dashboard.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "AllowCloudFrontServicePrincipalReadOnly",
        Effect = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action = ["s3:GetObject"],
        Resource = "${aws_s3_bucket.dashboard.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}
