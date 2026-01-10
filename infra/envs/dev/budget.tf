resource "aws_budgets_budget" "monthly" {
  name         = "edgeops-dev-monthly-budget"
  budget_type  = "COST"
  limit_amount = "25"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
cost_filter {
    name   = "Service"
    values = ["Amazon CloudFront", "Amazon API Gateway", "AWS Lambda", "Amazon Simple Storage Service"]
  }
}