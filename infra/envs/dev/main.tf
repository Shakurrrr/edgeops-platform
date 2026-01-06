terraform {
  backend "s3" {
    bucket         = "tf-state-559938827680-devops"
    key            = "edgeops/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "edgeops-tf-lock"
    encrypt        = true
  }

  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.20"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
