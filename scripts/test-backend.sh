#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${POSTGRES_PASSWORD:-}" && -f "$repository_root/.env" ]]; then
  password_line="$(grep -m1 '^POSTGRES_PASSWORD=' "$repository_root/.env" || true)"
  if [[ -n "$password_line" ]]; then
    POSTGRES_PASSWORD="${password_line#*=}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD%\"}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD#\"}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD%\'}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD#\'}"
    export POSTGRES_PASSWORD
  fi
fi

dotnet test "$repository_root/src/backend/TutorHub.sln" --configuration Release "$@"
