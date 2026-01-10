# EdgeOps Platform

A production-style, edge-first deployment platform that demonstrates progressive delivery (canary) for a serverless API and blue/green deployments for a static frontend—operated via Terraform and GitHub Actions with governance, drift detection, and cost guardrails.

## What this project demonstrates

- **Edge-first architecture**: CloudFront as the single public entry point.
- **Serverless backend**: Node.js (Express) API on AWS Lambda, exposed via API Gateway.
- **Static frontend**: Dashboard hosted on S3 and served through CloudFront.
- **Progressive delivery**:
  - **Canary** traffic shifting for the API using **Lambda versions + weighted alias routing**.
  - **Blue/Green** cutover for the dashboard using **dual S3 origins** behind CloudFront.
- **Infrastructure as Code**: Terraform (remote state + locking).
- **Platform governance**:
  - CI-based Terraform plan and policy checks (OPA/Conftest).
  - Drift detection with automated GitHub issue creation.
- **Operational safety**:
  - CloudWatch logs, metrics, and alarms.
  - Rollback workflows.

## Live endpoints (Dev)

- **Dashboard (CloudFront)**: https://d30tfelv6kj27h.cloudfront.net
- **API through CloudFront**: https://d30tfelv6kj27h.cloudfront.net/api/version
- **API Gateway (direct)**: https://9ejp8g49lk.execute-api.us-east-1.amazonaws.com/api/version
- **Dashboard S3 bucket (dev)**: `edgeops-dev-dashboard-559938827680`

> These URLs are from the lab/dev environment used during the build. Replace with your own outputs if you fork and deploy.

## Repository layout

```text
edgeops-platform/
├── apps/
│   ├── api/                 # Express API (serverless-http for Lambda)
│   └── dashboard/           # Next.js dashboard (static export)
├── infra/
│   ├── bootstrap/           # Remote state + lock table (or existing backend)
│   └── envs/
│       └── dev/             # Dev environment Terraform stack
├── policies/                # OPA/Conftest policies
├── .github/workflows/       # GitHub Actions control plane
└── docs/medium/             # Medium posts Day 01..Day 07
```

## Prerequisites

- Terraform >= 1.5
- Node.js >= 20
- AWS CLI configured
- GitHub repository with Actions enabled
- AWS permissions to manage: S3, CloudFront, API Gateway, Lambda, IAM, CloudWatch, DynamoDB (state lock), Budgets (optional)

## Quickstart (Dev)

### 1) Package the API for Lambda (Windows)

From repo root:

```powershell
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null

Set-Location ".\apps\api"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api.zip" -Force
Set-Location "..\.."
```

### 2) Deploy / update infrastructure (Dev)

```powershell
cd infra\envs\dev
terraform init
terraform apply
```

### 3) Build and deploy dashboard (static export)

```powershell
cd apps\dashboard
npm install
npm run build
npm run export

aws s3 sync .\out s3://edgeops-dev-dashboard-559938827680 --delete
```

### 4) Validate

```powershell
curl https://9ejp8g49lk.execute-api.us-east-1.amazonaws.com/api/version
curl https://d3ofelcvk2jzh1.cloudfront.net/api/version
```

Open in browser:

- https://d3ofelcvk2jzh1.cloudfront.net

## Progressive delivery operations

### Canary (API)

- **Shift traffic** by changing `canary_weight` (0.0–1.0) and applying Terraform.
- **Validate distribution** by sampling `/api/version` and counting `deployment=stable` vs `deployment=canary`.
- **Rollback** by setting `canary_weight = 0.0` and applying Terraform (or triggering the GitHub rollback workflow).

### Blue/Green (Dashboard)

- Deploy new build to the **inactive** S3 bucket.
- Flip CloudFront default origin selection by changing `active_dashboard_color` and applying Terraform.
- Rollback by switching the value back and applying Terraform.

## Troubleshooting notes (real issues encountered)

- **Terraform provider download failures** (Windows + network instability): resolved by clearing `.terraform` and enabling plugin cache, then re-running `terraform init -upgrade`.
- **IAM AccessDenied during apply**: fixed by incrementally granting missing read/list permissions (DynamoDB tags, CloudFront OAC list/get, S3 list/read, Lambda code signing config read).
- **Partial applies & “already exists” conflicts**: resolved by importing pre-created resources back into Terraform state (`terraform import ...`) instead of retrying apply.
- **Backend state upload failures (DNS/no such host)**: resolved by stabilizing DNS/network and pushing local `errored.tfstate` with `terraform state push`.

## Documentation

- Medium posts are in `docs/medium/` (Day 02 → Day 07 included here).
- Demo script and deliverables are included in Day 07.

## License

MIT (or replace with your preferred license)
