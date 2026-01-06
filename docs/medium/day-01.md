# EdgeOps Platform: Day 1 — Building the Reference Workload and Repository Foundation

## Introduction

Most DevOps portfolio projects focus on provisioning infrastructure and stopping there. Platform engineering goes further: it requires safe production deployments, progressive delivery strategies (blue/green and canary), governance guardrails, and measurable rollback behavior under real HTTP traffic.

EdgeOps Platform is a deployment platform designed to demonstrate those platform engineering outcomes through a complete end-to-end build:

- multi-environment infrastructure (dev, staging, prod)
- GitHub Actions workflows as the deployment control plane
- progressive delivery (canary and blue/green traffic shifting)
- automated rollback using telemetry signals
- drift detection and automated issue creation
- policy-as-code enforcement for security and cost guardrails
- observability (metrics, logs, and traces)

Day 1 establishes the foundation: the reference workload and the repository structure that allows the platform to evolve quickly over seven days.

## Goals for Day 1

The goals for Day 1 are:

- build a lightweight reference workload (Next.js frontend + Node.js API)
- ensure the workload exposes deterministic version identity for rollout validation
- create a production-style repository structure for application, infrastructure, and policy layers
- establish baseline CI that verifies builds and prevents broken merges

## Repository Structure

A monorepo structure is used during implementation because it reduces integration overhead and allows infrastructure outputs and application deployments to remain tightly coordinated.

```bash
edgeops-platform/
├── apps/
│   ├── dashboard/                # Next.js frontend
│   └── api/                      # Node.js Express backend
├── infra/
│   ├── modules/                  # reusable Terraform modules (later)
│   ├── envs/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── README.md
├── policies/                     # OPA policies (Day 3)
├── scripts/                      # helper scripts (traffic generator, etc.)
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── terraform-plan.yml
├── docs/
│   ├── architecture.md
│   └── medium/
│       └── day-01.md
├── README.md
└── .gitignore
