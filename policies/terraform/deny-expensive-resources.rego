package terraform.cost

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_instance"
  resource.change.after.instance_type == "m5.4xlarge"
  msg := "Instance type m5.4xlarge is not allowed"
}
