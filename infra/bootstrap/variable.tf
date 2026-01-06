variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "lock_table_name" {
  type    = string
  default = "edgeops-tf-lock"
}
