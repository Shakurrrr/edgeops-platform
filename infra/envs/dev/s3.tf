
# BLUE DASHBOARD BUCKET (Stable)


resource "aws_s3_bucket" "dashboard_blue" {
  bucket = "${var.project}-${var.environment}-dashboard-blue-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "dashboard_blue" {
  bucket = aws_s3_bucket.dashboard_blue.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "dashboard_blue" {
  bucket                  = aws_s3_bucket.dashboard_blue.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Allow CloudFront OAC access to BLUE bucket
resource "aws_s3_bucket_policy" "dashboard_blue_policy" {
  bucket = aws_s3_bucket.dashboard_blue.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnlyBlue",
        Effect    = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action    = ["s3:GetObject"],
        Resource  = "${aws_s3_bucket.dashboard_blue.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}



# GREEN DASHBOARD BUCKET (Release Candidate)


resource "aws_s3_bucket" "dashboard_green" {
  bucket = "${var.project}-${var.environment}-dashboard-green-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "dashboard_green" {
  bucket = aws_s3_bucket.dashboard_green.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "dashboard_green" {
  bucket                  = aws_s3_bucket.dashboard_green.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Allow CloudFront OAC access to GREEN bucket
resource "aws_s3_bucket_policy" "dashboard_green_policy" {
  bucket = aws_s3_bucket.dashboard_green.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnlyGreen",
        Effect    = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action    = ["s3:GetObject"],
        Resource  = "${aws_s3_bucket.dashboard_green.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}
