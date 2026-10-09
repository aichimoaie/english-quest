#!/usr/bin/env bash
# Spin the English Quest Azure MVP up, down, or plan it, for one environment.
#
#   scripts/infra.sh plan  <dev|prod>   init both Terraform roots and print the plan. Changes nothing.
#   scripts/infra.sh up    <dev|prod>   print the plan, then apply it after you type the environment name.
#   scripts/infra.sh down  <dev|prod>   print the destroy plan, then destroy after you type the environment name.
#   scripts/infra.sh check              format, validate, lint and test every root. Needs no Azure access.
#
# Needs terraform, the Azure CLI logged in, and the approved subscription selected.
# Reads deployment/terraform/backend.hcl (git-ignored; it holds the state storage
# account name, no secrets). Plan files are written to a temporary directory and
# deleted on exit, because they can contain secrets.
set -euo pipefail

readonly APPROVED_SUBSCRIPTION_ID="389d9a64-7cca-46b1-9de0-8214eae2597a"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tf_root="$repo_root/deployment/terraform"
single_dir="$tf_root/single-project"
cicd_dir="$tf_root/cicd"
backend_file="$tf_root/backend.hcl"

die() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  echo "usage: scripts/infra.sh <plan|up|down> <dev|prod>" >&2
  echo "       scripts/infra.sh check" >&2
  exit 2
}

require_tools() {
  command -v terraform >/dev/null || die "terraform is not on PATH."
}

require_azure() {
  command -v az >/dev/null || die "the Azure CLI (az) is not on PATH."
  az account show >/dev/null 2>&1 || die "not logged in to Azure. Run: az login"
  local current
  current="$(az account show --query id -o tsv)"
  [ "$current" = "$APPROVED_SUBSCRIPTION_ID" ] ||
    die "the selected subscription is $current, not the approved $APPROVED_SUBSCRIPTION_ID. Run: az account set --subscription $APPROVED_SUBSCRIPTION_ID"
}

require_env_files() {
  local env="$1"
  [ -f "$backend_file" ] || die "missing $backend_file. Copy backend.hcl.example and fill in the state storage account."
  local vars
  for vars in "$single_dir/vars/$env.tfvars" "$cicd_dir/vars/$env.tfvars"; do
    [ -f "$vars" ] || die "missing $vars."
    if grep -q 'REPLACE-' "$vars"; then
      die "$vars still has REPLACE- placeholders. Fill them in before running."
    fi
  done
}

# init_root <dir> <state key>. Safe to repeat: it reconfigures the backend to the same settings.
init_root() {
  terraform -chdir="$1" init -input=false -reconfigure \
    -backend-config="$backend_file" -backend-config="key=$2" >/dev/null
}

# plan_root <dir> <env> <plan file|-> [extra plan args...]
# Exit 0 means no changes, 2 means changes. Any other code is a real error.
plan_root() {
  local dir="$1" env="$2" out="$3"
  shift 3
  local out_args=()
  [ "$out" = "-" ] || out_args=(-out="$out")
  local code=0
  terraform -chdir="$dir" plan -input=false -detailed-exitcode \
    -var-file="vars/$env.tfvars" "${out_args[@]}" "$@" || code=$?
  if [ "$code" -gt 2 ]; then
    die "terraform plan failed in $dir (exit $code)."
  fi
  return "$code"
}

confirm() {
  local env="$1" action="$2"
  echo
  printf 'Type "%s" to %s the %s environment: ' "$env" "$action" "$env"
  local answer=""
  read -r answer || true
  [ "$answer" = "$env" ] || die "confirmation did not match. Nothing was changed."
}

run_plan() {
  local env="$1"
  init_root "$single_dir" "english-quest-$env.tfstate"
  init_root "$cicd_dir" "english-quest-cicd-$env.tfstate"
  echo "== single-project ($env)"
  plan_root "$single_dir" "$env" - || true
  echo "== cicd ($env)"
  plan_root "$cicd_dir" "$env" - || true
  echo
  echo "Plan only. Nothing was changed."
}

# run_apply <up|down> <env>
run_apply() {
  local mode="$1" env="$2"
  local work
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT

  init_root "$single_dir" "english-quest-$env.tfstate"
  init_root "$cicd_dir" "english-quest-cicd-$env.tfstate"

  local destroy_args=()
  [ "$mode" = "down" ] && destroy_args=(-destroy)

  local single_code=0 cicd_code=0
  plan_root "$single_dir" "$env" "$work/single.tfplan" "${destroy_args[@]}" || single_code=$?
  plan_root "$cicd_dir" "$env" "$work/cicd.tfplan" "${destroy_args[@]}" || cicd_code=$?

  if [ "$single_code" -eq 0 ] && [ "$cicd_code" -eq 0 ]; then
    echo "No changes for the $env environment. Nothing to do."
    return 0
  fi

  echo "== single-project plan ($env)"
  if [ "$single_code" -eq 2 ]; then
    terraform -chdir="$single_dir" show -no-color "$work/single.tfplan"
  else
    echo "No changes."
  fi
  echo "== cicd plan ($env)"
  if [ "$cicd_code" -eq 2 ]; then
    terraform -chdir="$cicd_dir" show -no-color "$work/cicd.tfplan"
  else
    echo "No changes."
  fi

  local action="apply"
  [ "$mode" = "down" ] && action="DESTROY"
  confirm "$env" "$action"

  if [ "$mode" = "up" ]; then
    # Application infrastructure first. The deploy identity's role assignments
    # are scoped to resources that single-project creates.
    if [ "$single_code" -eq 2 ]; then
      terraform -chdir="$single_dir" apply -input=false "$work/single.tfplan"
    fi
    if [ "$cicd_code" -eq 2 ]; then
      terraform -chdir="$cicd_dir" apply -input=false "$work/cicd.tfplan"
    fi
  else
    # Reverse order: remove the deploy identity first, then the application.
    if [ "$cicd_code" -eq 2 ]; then
      terraform -chdir="$cicd_dir" apply -input=false "$work/cicd.tfplan"
    fi
    if [ "$single_code" -eq 2 ]; then
      terraform -chdir="$single_dir" apply -input=false "$work/single.tfplan"
    fi
  fi
  echo "Done: $mode $env."
}

# Layer 1 of the test plan: format, validate, lint and native tests on every root.
run_check() {
  require_tools
  terraform -chdir="$tf_root" fmt -check -recursive
  local dir
  for dir in "$single_dir" "$cicd_dir"; do
    terraform -chdir="$dir" init -backend=false -input=false >/dev/null
    terraform -chdir="$dir" validate
  done
  if command -v tflint >/dev/null; then
    tflint --chdir="$single_dir" --init >/dev/null
    tflint --chdir="$single_dir"
    tflint --chdir="$cicd_dir"
  else
    echo "tflint not found; skipping lint. Install it to run this check." >&2
  fi
  terraform -chdir="$single_dir" test
  echo "Checks passed."
}

main() {
  [ $# -ge 1 ] || usage
  local command="$1"

  if [ "$command" = "check" ]; then
    [ $# -eq 1 ] || usage
    run_check
    return
  fi

  [ $# -eq 2 ] || usage
  local env="$2"
  case "$env" in
    dev | prod) ;;
    *) die "the environment must be dev or prod." ;;
  esac
  case "$command" in
    plan | up | down) ;;
    *) usage ;;
  esac

  require_tools
  require_azure
  require_env_files "$env"

  case "$command" in
    plan) run_plan "$env" ;;
    up | down) run_apply "$command" "$env" ;;
  esac
}

main "$@"
