# Day 5 — Blue/Green Deployments for the Dashboard (S3 Origins + CloudFront Cutover)

Day 5 implemented blue/green deployments for the dashboard by provisioning two S3 buckets and switching the CloudFront default origin.

## Goals

- Two dashboard buckets exist: blue and green.
- CloudFront can serve `/` from either bucket based on one variable.
- Deploy to inactive bucket first, then cut over.
- Rollback is immediate by switching back.

## Terraform design

### Variable

In `infra/envs/dev/variables.tf`:

```hcl
variable "active_dashboard_color" {
  description = "Which dashboard bucket CloudFront serves: blue or green"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue","green"], var.active_dashboard_color)
    error_message = "active_dashboard_color must be blue or green"
  }
}
```

### S3 buckets

Create `aws_s3_bucket.dashboard_blue` and `aws_s3_bucket.dashboard_green`, each with:

- versioning enabled
- public access blocks enabled
- bucket policy allowing CloudFront OAC to read objects

### CloudFront origins

In `infra/envs/dev/cloudfront.tf`:

```hcl
locals {
  active_dashboard_origin_id = var.active_dashboard_color == "blue" ? "s3-dashboard-blue" : "s3-dashboard-green"
}
```

Set default cache behavior to:

```hcl
target_origin_id = local.active_dashboard_origin_id
```

`/api/*` behavior remains routed to API Gateway.

## Deploy procedure

### Build dashboard

```powershell
cd apps\dashboard
npm install
npm run build
npm run export
```

### Deploy to blue bucket (stable)

```powershell
aws s3 sync .\out s3://<DASHBOARD_BLUE_BUCKET> --delete
```

### Deploy to green bucket (candidate)

Make a visible UI change (label/version), rebuild and export, then:

```powershell
aws s3 sync .\out s3://<DASHBOARD_GREEN_BUCKET> --delete
```

### Cutover (blue → green)

Set:

```hcl
active_dashboard_color = "green"
```

Apply:

```powershell
cd infra\envs\dev
terraform apply
```

### Rollback (green → blue)

Set:

```hcl
active_dashboard_color = "blue"
```

Apply:

```powershell
terraform apply
```

## Day 5 Completion Criteria

- Dashboard loads from CloudFront and visibly reflects blue/green cutovers.
- Rollback restores previous version immediately.
