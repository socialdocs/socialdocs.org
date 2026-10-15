#!/usr/bin/env bash
# Federate the example server with a real GoToSocial in Docker.
# Needs: docker (with compose), openssl. Run from anywhere.
set -euo pipefail
cd "$(dirname "$0")"

export ADMIN_TOKEN="$(openssl rand -hex 16)"
export GTS_EMAIL="federation-test@gts.test"
export GTS_PASSWORD="$(openssl rand -base64 24)"
compose() { docker compose -f compose.yaml "$@"; }

# Throwaway CA and one certificate for both test hostnames.
rm -rf certs && mkdir certs
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=Federation Test CA" \
  -keyout certs/ca.key -out certs/ca.pem 2>/dev/null
openssl req -newkey rsa:2048 -nodes -subj "/CN=ap.test" \
  -keyout certs/server.key -out certs/server.csr 2>/dev/null
printf 'subjectAltName=DNS:ap.test,DNS:gts.test\nextendedKeyUsage=serverAuth\n' > certs/ext.cnf
openssl x509 -req -in certs/server.csr -CA certs/ca.pem -CAkey certs/ca.key -CAcreateserial \
  -days 1 -extfile certs/ext.cnf -out certs/server.pem 2>/dev/null
chmod 644 certs/*  # read by GoToSocial's uid 1000; test keys only

cleanup() {
  status=$?
  if [ $status -ne 0 ]; then
    echo "--- gts logs"; compose logs --no-color --tail=200 gts || true
    echo "--- ap logs"; compose logs --no-color --tail=200 ap || true
  fi
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf certs
  exit $status
}
trap cleanup EXIT

compose up -d gts ap
compose run --rm tester wait

# Create and confirm a GoToSocial user (docs/admin/cli.md).
compose exec -T gts /gotosocial/gotosocial admin account create \
  --username follower --email "$GTS_EMAIL" --password "$GTS_PASSWORD"
compose exec -T gts /gotosocial/gotosocial admin account confirm --username follower

compose run --rm tester federate
echo "Federation test passed"
