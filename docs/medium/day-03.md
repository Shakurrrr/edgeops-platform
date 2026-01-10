# Day 3 — GitHub Actions Control Plane, Policy Enforcement, and Drift Baseline

Day 3 transitioned the platform from manual Terraform execution to an automated control plane using GitHub Actions, with policy-as-code guardrails and a drift detection baseline.

## Goals

- Terraform plan runs automatically on pull requests.
- Terraform apply runs automatically on merge to main (dev).
- Policy-as-code checks block unsafe changes.
- Drift detection workflow exists (scheduled + manual trigger).

## GitHub Actions: Terraform Plan (PR)

Create `.github/workflows/terraform-plan.yml`:

```yaml
name: Terraform Plan (Dev)

on:
  pull_request:
    paths:
      - "infra/**"

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        working-directory: infra/envs/dev
        run: terraform init

      - name: Terraform Format
        working-directory: infra/envs/dev
        run: terraform fmt -check

      - name: Terraform Validate
        working-directory: infra/envs/dev
        run: terraform validate

      - name: Terraform Plan
        working-directory: infra/envs/dev
        run: terraform plan -out=tfplan.binary

      - name: Convert Plan to JSON
        working-directory: infra/envs/dev
        run: terraform show -json tfplan.binary > tfplan.json

      - name: Upload Plan Artifact
        uses: actions/upload-artifact@v4
        with:
          name: terraform-plan
          path: infra/envs/dev/tfplan.json
```

## Policy-as-Code (OPA/Conftest)

### Install Conftest in CI

Add after plan JSON generation:

```yaml
- name: Install Conftest
  run: |
    curl -L https://github.com/open-policy-agent/conftest/releases/download/v0.52.0/conftest_0.52.0_Linux_x86_64.tar.gz | tar xz
    sudo mv conftest /usr/local/bin
```

### Policies

Create `policies/terraform/deny-public-s3.rego`:

```rego
package terraform.security

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket"
  rc.change.after.acl == "public-read"
  msg := "Public S3 buckets are not allowed"
}
```

Create `policies/terraform/require-tags.rego`:

```rego
package terraform.tags

deny[msg] {
  rc := input.resource_changes[_]
  not rc.change.after.tags
  msg := sprintf("Resource %s is missing required tags", [rc.name])
}
```

Create `policies/terraform/deny-expensive-resources.rego`:

```rego
package terraform.cost

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_instance"
  rc.change.after.instance_type == "m5.4xlarge"
  msg := "Instance type m5.4xlarge is not allowed"
}
```

### Run policy checks

Add:

```yaml
- name: Run Policy Checks
  working-directory: infra/envs/dev
  run: conftest test tfplan.json -p ../../../policies/terraform
```

## GitHub Actions: Terraform Apply (Dev)

Create `.github/workflows/terraform-apply-dev.yml`:

```yaml
name: Terraform Apply (Dev)

on:
  push:
    branches: [ "main" ]
    paths:
      - "infra/**"

jobs:
  terraform-apply:
    runs-on: ubuntu-latest
    environment:
      name: dev

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: infra/envs/dev
        run: terraform init

      - name: Terraform Apply
        working-directory: infra/envs/dev
        run: terraform apply -auto-approve
```

## Drift detection baseline

Create `.github/workflows/drift-detection.yml` (baseline; Day 7 enhances it):

```yaml
name: Terraform Drift Detection

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

jobs:
  drift-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: infra/envs/dev
        run: terraform init

      - name: Terraform Plan (Drift Check)
        working-directory: infra/envs/dev
        run: terraform plan -detailed-exitcode
        continue-on-error: true
```

## Day 3 Completion Criteria

- PRs generate plans and enforce policies.
- Merges apply to dev via GitHub Actions.
- Drift workflow can be run on-demand.
