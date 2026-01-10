# Day 6 — Observability, Confidence Checks, and Rollback Controls (Aligned)

Day 6 hardened the platform so progressive delivery can be operated safely. The implementation aligned with the actual EdgeOps architecture:

- API is **Express on Lambda** behind API Gateway and CloudFront.
- Canary is **Lambda alias weighted routing**.
- Blue/green is **CloudFront origin switching** for the dashboard.

## Goals

- Structured logs for the API in CloudWatch Logs.
- CloudWatch alarms for API and Lambda health.
- A repeatable confidence-check procedure for canary releases.
- Rollback workflows for:
  - API canary (set canary weight to 0)
  - dashboard blue/green (switch origin back)

## Step 1 — Structured logging (API)

Update `apps/api/src/server.js` to emit JSON logs that include the same identity fields returned by the API.

Add a helper:

```js
function logEvent(eventType, data) {
  console.log(JSON.stringify({
    event_type: eventType,
    ...data
  }));
}
```

Log calls in endpoints:

```js
app.get("/api/health", (req, res) => {
  const p = { status: "ok", ...payload() };

  logEvent("api_health", {
    path: req.path,
    method: req.method,
    user_agent: req.headers["user-agent"],
    ...p
  });

  res.status(200).json(p);
});

app.get("/api/version", (req, res) => {
  const p = payload();

  logEvent("api_version", {
    path: req.path,
    method: req.method,
    user_agent: req.headers["user-agent"],
    ...p
  });

  res.status(200).json(p);
});
```

### Deploy the updated API (Windows packaging)

```powershell
cd C:\Users\USER\Desktop\edgeops-platform
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
New-Item -ItemType Directory -Path ".\dist" | Out-Null

Set-Location ".\apps\api"
npm install --omit=dev
Compress-Archive -Path * -DestinationPath "..\..\dist\api.zip" -Force
Set-Location "..\.."

cd infra\envs\dev
terraform apply
```

## Step 2 — CloudWatch alarms (Terraform)

Create `infra/envs/dev/alarms.tf`.

### API Gateway 5XX errors

```hcl
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "edgeops-dev-apigw-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "API Gateway 5XX errors above threshold."

  dimensions = {
    ApiName = aws_apigatewayv2_api.api.name
  }
}
```

### API Gateway latency

```hcl
resource "aws_cloudwatch_metric_alarm" "apigw_latency" {
  alarm_name          = "edgeops-dev-apigw-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Average API latency above 1000ms."

  dimensions = {
    ApiName = aws_apigatewayv2_api.api.name
  }
}
```

### Lambda errors

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "edgeops-dev-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Lambda errors > 0."

  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}
```

Apply:

```powershell
cd infra\envs\dev
terraform apply
```

## Step 3 — Confidence checks for canary releases

A canary release is only considered healthy if:

- `/api/health` returns 200
- `/api/version` returns 200 and shows the expected identity fields
- traffic split distribution matches `canary_weight`
- CloudWatch alarms remain in OK state
- CloudWatch logs contain events for stable and canary requests

### Endpoint checks

```powershell
curl https://d30tfelv6kj27h.cloudfront.net/api/health
curl https://d30tfelv6kj27h.cloudfront.net/api/version
```

### Distribution check

```powershell
$stable = 0
$canary = 0

for ($i=0; $i -lt 100; $i++) {
  $resp = Invoke-RestMethod -Uri "https://d3ofelcvk2jzh1.cloudfront.net/api/version"
  if ($resp.deployment -eq "stable") { $stable++ }
  if ($resp.deployment -eq "canary") { $canary++ }
}

"stable=$stable canary=$canary"
```

### Log verification

In CloudWatch Logs, verify the Lambda log group:

- `/aws/lambda/edgeops-dev-api`

Confirm JSON log entries contain `event_type`, `deployment`, `version`, and `request_id`.

## Step 4 — Rollback controls

### Canary rollback

Set in `terraform.tfvars`:

```hcl
canary_weight = 0.0
```

Apply:

```powershell
cd infra\envs\dev
terraform apply
```

### Blue/green rollback (dashboard)

Set:

```hcl
active_dashboard_color = "blue"
```

Apply:

```powershell
terraform apply
```

### GitHub Actions rollback workflow (canary)

Create `.github/workflows/rollback-canary.yml`:

```yaml
name: Rollback Canary (Dev)

on:
  workflow_dispatch:

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment:
      name: dev

    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: infra/envs/dev
        run: terraform init

      - name: Apply rollback (canary_weight=0.0)
        working-directory: infra/envs/dev
        run: |
          sed -i 's/canary_weight *= *.*/canary_weight = 0.0/' terraform.tfvars || true
          terraform apply -auto-approve
```

## Day 6 Completion Criteria

- CloudWatch logs contain structured JSON events for requests.
- CloudWatch alarms exist and are in OK state during normal operation.
- Canary confidence checks can be executed end-to-end.
- Rollback procedures are documented and tested.
