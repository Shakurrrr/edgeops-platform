# Day 4 — Canary Deployments for the API (Lambda Versions + Weighted Alias Routing)

Day 4 implemented progressive delivery for the API using AWS-native canary routing.

## Goals

- Publish multiple Lambda versions.
- Invoke API Gateway → Lambda **alias** (not $LATEST).
- Route a percentage of traffic to canary using weighted routing.
- Validate the split with real HTTP requests.
- Roll back instantly by setting canary weight to 0.

## Reference workload (API identity)

The API already returns deterministic identity fields and is ideal for canary validation.

`apps/api/src/server.js` (excerpt):

```js
const SERVICE_NAME = process.env.SERVICE_NAME || "edgeops-api";
const VERSION = process.env.VERSION || "v0.1.0";
const DEPLOYMENT = process.env.DEPLOYMENT || "stable";
const ENVIRONMENT = process.env.ENVIRONMENT || "dev";

function payload() {
  return {
    service: SERVICE_NAME,
    version: VERSION,
    deployment: DEPLOYMENT,
    environment: ENVIRONMENT,
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}

app.get("/api/version", (req, res) => {
  res.status(200).json(payload());
});
```

## Terraform changes

### Variables

In `infra/envs/dev/variables.tf`:

```hcl
variable "stable_version" {
  description = "Pinned stable Lambda version number"
  type        = string
}

variable "canary_weight" {
  description = "Traffic routed to canary (0.0 - 1.0)"
  type        = number
  default     = 0.0
}
```

### Publish versions

In `infra/envs/dev/lambda.tf` ensure:

```hcl
publish = true
```

### Alias with weighted routing

```hcl
resource "aws_lambda_alias" "stable" {
  name             = "stable"
  function_name    = aws_lambda_function.api.function_name
  function_version = var.stable_version

  routing_config {
    additional_version_weights = {
      aws_lambda_function.api.version = var.canary_weight
    }
  }
}
```

### API Gateway integration targets alias ARN

```hcl
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.stable.arn
  payload_format_version = "2.0"
}
```

## Deploy procedure

### Package API (Windows)

```powershell
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null

Set-Location ".\apps\api"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api.zip" -Force
Set-Location "..\.."
```

### Apply canary config

Set `infra/envs/dev/terraform.tfvars` (example):

```hcl
stable_version = "1"
canary_weight  = 0.1
```

Apply:

```powershell
cd infra\envs\dev
terraform apply
```

## Validate traffic split

```powershell
$stable = 0
$canary = 0

for ($i=0; $i -lt 50; $i++) {
  $resp = Invoke-RestMethod -Uri "https://d30tfelv6kj27h.cloudfront.net//api/version"
  if ($resp.deployment -eq "stable") { $stable++ }
  if ($resp.deployment -eq "canary") { $canary++ }
}

"stable=$stable canary=$canary"
```

## Rollback

Set:

```hcl
canary_weight = 0.0
```

Then:

```powershell
terraform apply
```

## Day 4 Completion Criteria

- `/api/version` through CloudFront shows stable and canary responses consistent with weight.
- Rollback returns distribution to 100% stable.
