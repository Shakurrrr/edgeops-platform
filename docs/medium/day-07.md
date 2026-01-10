# Day 7 — Drift Detection, Cost Guardrails, and Final Demo

Day 7 completed the “platform engineering” loop: detect unmanaged changes, control cost, and package the system into a clean demo story.

## Goals

- Drift detection runs on schedule and opens a GitHub issue when drift is found.
- Basic cost guardrails exist (budgets/alerts, lab-safe defaults).
- A final demo script exists to show progressive delivery and rollback end-to-end.

## Step 1 — Drift detection with issue creation

Update `.github/workflows/drift-detection.yml`:

```yaml
name: Drift Detection (Dev)

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

jobs:
  drift:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write

    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: infra/envs/dev
        run: terraform init

      - name: Terraform Plan (Drift Check)
        id: drift_plan
        working-directory: infra/envs/dev
        run: |
          set +e
          terraform plan -detailed-exitcode -out=tfplan.binary
          code=$?
          echo "exitcode=$code" >> $GITHUB_OUTPUT
          exit 0

      - name: Convert Plan to JSON
        if: always()
        working-directory: infra/envs/dev
        run: terraform show -json tfplan.binary > tfplan.json

      - name: Upload Drift Plan Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: drift-plan
          path: infra/envs/dev/tfplan.json

      - name: Create GitHub Issue if Drift Detected
        if: ${{ steps.drift_plan.outputs.exitcode == '2' }}
        uses: actions/github-script@v7
        with:
          script: |
            const title = "Drift detected in dev environment";
            const body = [
              "Terraform has detected infrastructure drift in `infra/envs/dev`.",
              "",
              "Actions:",
              "- Review the workflow run artifacts (drift-plan) for the plan JSON.",
              "- Reconcile drift by updating Terraform code or reverting manual changes in AWS.",
              "",
              "This issue was created automatically by the drift detection workflow."
            ].join("\n");

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title,
              body,
              labels: ["drift"]
            });
```

## Step 2 — Cost guardrails (budget visibility)

Create `infra/envs/dev/budget.tf` (optional if permissions allow):

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "edgeops-dev-monthly-budget"
  budget_type  = "COST"
  limit_amount = "25"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
}
```

Apply:

```powershell
cd infra\envs\dev
terraform apply
```

## Step 3 — Final demo script

Create `docs/demo-script.md`:

```md
# EdgeOps Platform Demo Script

1) Dashboard baseline (CloudFront)
2) API baseline: curl /api/version (stable)
3) Canary rollout: set canary_weight=0.1, apply, run distribution test
4) Canary rollback: set canary_weight=0.0 (or GitHub Actions rollback), confirm distribution
5) Blue/Green dashboard cutover: deploy to green, flip active_dashboard_color=green
6) Dashboard rollback: active_dashboard_color=blue
7) Drift detection: trigger workflow, show issue creation or clean run
```

## Day 7 Completion Criteria

- Drift workflow runs and reports drift via GitHub issues.
- Budget exists (or cost guardrails documented if budgets are restricted).
- A reviewer can follow the demo script end-to-end.
