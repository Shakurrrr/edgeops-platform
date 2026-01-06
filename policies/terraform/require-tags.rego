package terraform.tags

deny[msg] {
  resource := input.resource_changes[_]
  not resource.change.after.tags
  msg := sprintf("Resource %s is missing required tags", [resource.name])
}
