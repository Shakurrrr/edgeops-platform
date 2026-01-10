# Day 2 — Deploying the Dev Environment (Remote State, CloudFront, S3, API Gateway, Lambda)

Day 2 introduced the first platform milestone: provisioning a complete **dev** environment on AWS using Terraform, with a proper remote state backend and production-style edge architecture.

## Goals

By the end of Day 2, the following were true:

- Terraform remote state and locking were enabled (**S3 + DynamoDB**).
- The dev environment was provisioned through Terraform.
- The dashboard was publicly accessible via CloudFront.
- The API was publicly accessible via API Gateway.
- CloudFront routed requests correctly:
  - `/` → S3 (dashboard)
  - `/api/*` → API Gateway (API)
- Terraform outputs were available for later automation.
- The foundation for progressive delivery (canary and blue/green) was established.

## Architecture (Dev)

### Components

- S3 bucket for dashboard hosting
- CloudFront distribution as the single edge ingress
- API Gateway HTTP API for `/api/*`
- Lambda function for Node.js API runtime
- IAM roles and permissions for Lambda
- Terraform remote backend (S3 state + DynamoDB locking)

### Traffic flow

1. `GET /` is served by CloudFront from the S3 origin.
2. `GET /api/*` is routed by CloudFront to API Gateway.
3. API Gateway invokes Lambda.
4. Lambda returns JSON responses containing version identity.

## Implementation Steps

### Step 1 — Terraform remote state (existing backend)

This project used an existing S3 bucket for state storage. Remote backend configuration was set in `infra/envs/dev/main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "<YOUR_STATE_BUCKET>"
    key            = "edgeops/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "edgeops-tf-lock"
    encrypt        = true
  }
}
```

> If you need to create a new backend, provision S3 (versioning + SSE) and DynamoDB lock table first.

### Step 2 — Package the API for Lambda (Windows)

From repo root:

```powershell
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null

Set-Location ".\apps\api"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api.zip" -Force
Set-Location "..\.."
```

This produces:

- `dist/api.zip`

### Step 3 — Terraform apply (dev)

```powershell
cd infra\envs\dev
terraform init
terraform apply
```

## Deploy the Dashboard Build into S3

### Build the dashboard

```powershell
cd apps\dashboard
npm install
npm run build
npm run export
```

### Upload the exported site to S3

```powershell
aws s3 sync .\out s3://edgeops-dev-dashboard-559938827680 --delete
```

## Validation Commands

### API directly (API Gateway)

```powershell
curl https://9ejp8g49lk.execute-api.us-east-1.amazonaws.com/api/version
```

### API through CloudFront

```powershell
curl https://d30tfelv6kj27h.cloudfront.net/api/version
```

### Dashboard

Open in browser:

- https://d30tfelv6kj27h.cloudfront.net

## Outputs used

- `dashboard_bucket_name`: `edgeops-dev-dashboard-559938827680`
- `api_gateway_url`: `https://9ejp8g49lk.execute-api.us-east-1.amazonaws.com`
- `cloudfront_domain_name`: `https://d30tfelv6kj27h.cloudfront.net`

## Issues encountered and resolutions

- Provider download issues on Windows: fixed by clearing `.terraform` and enabling plugin caching, then retrying init.
- Missing AWS permissions: resolved by extending IAM policies for DynamoDB tagging, CloudFront read/list, S3 list/read, and Lambda read operations.
- Partial apply conflicts: resolved by importing pre-created resources into state instead of re-applying blindly.
- Backend upload DNS failures: resolved by stabilizing DNS/network and pushing state with `terraform state push errored.tfstate`.

## Day 2 Completion Criteria

- CloudFront URL loads dashboard.
- `/api/version` works via API Gateway and via CloudFront.
- S3 origin is private and accessible only through CloudFront (OAC).
