#!/usr/bin/env bash
# Federate the example server with a real Mastodon 4.7 in Docker.
# Needs: docker (with compose), openssl. Run from anywhere.
set -euo pipefail
cd "$(dirname "$0")"

export ADMIN_TOKEN="$(openssl rand -hex 16)"
compose() { docker compose -f compose-mastodon.yaml "$@"; }

# Throwaway CA and one certificate for both test hostnames.
rm -rf certs && mkdir certs
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=Federation Test CA" \
  -keyout certs/ca.key -out certs/ca.pem 2>/dev/null
openssl req -newkey rsa:2048 -nodes -subj "/CN=ap.test" \
  -keyout certs/server.key -out certs/server.csr 2>/dev/null
printf 'subjectAltName=DNS:ap.test,DNS:mastodon.test\nextendedKeyUsage=serverAuth\n' > certs/ext.cnf
openssl x509 -req -in certs/server.csr -CA certs/ca.pem -CAkey certs/ca.key -CAcreateserial \
  -days 1 -extfile certs/ext.cnf -out certs/server.pem 2>/dev/null
chmod 644 certs/*  # test keys only

# Mastodon configuration (see .env.production.sample and
# https://docs.joinmastodon.org/admin/config/). Secrets are throwaway.
cat > mastodon.env <<EOF
LOCAL_DOMAIN=mastodon.test
RAILS_ENV=production
NODE_ENV=production
REDIS_HOST=redis
REDIS_PORT=6379
DB_HOST=db
DB_USER=postgres
DB_NAME=mastodon_production
DB_PASS=
DB_PORT=5432
ES_ENABLED=false
SECRET_KEY_BASE=$(openssl rand -hex 64)
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=$(openssl rand -hex 16)
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=$(openssl rand -hex 16)
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=$(openssl rand -hex 16)
# Let Mastodon reach ap.test on the private test network
ALLOWED_PRIVATE_ADDRESSES=172.31.0.0/24
# Trust the throwaway CA for outgoing HTTPS (OpenSSL default store)
SSL_CERT_FILE=/certs/ca.pem
EOF

cleanup() {
  status=$?
  if [ $status -ne 0 ]; then
    for s in web sidekiq proxy ap; do
      echo "--- $s logs"; compose logs --no-color --tail=150 "$s" || true
    done
  fi
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf certs mastodon.env
  exit $status
}
trap cleanup EXIT

compose up -d db redis
compose run --rm web bundle exec rails db:setup
compose up -d web sidekiq proxy ap
compose run --rm tester wait

# Create a confirmed, approved user (tootctl, docs/admin/tootctl.md).
compose exec -T web bin/tootctl accounts create follower \
  --email follower@mastodon.test --confirmed --approve

# Home feeds only receive posts for users who signed in recently
# (User::Activity::ACTIVE_DURATION), so mark the user as signed in, and
# mint an API token for the test.
export MASTODON_TOKEN="$(compose exec -T web bin/rails runner '
  user = Account.find_local("follower").user
  user.update!(current_sign_in_at: Time.now.utc, last_sign_in_at: Time.now.utc)
  app = Doorkeeper::Application.create!(name: "federation-test",
    redirect_uri: "urn:ietf:wg:oauth:2.0:oob", scopes: "read write follow")
  token = Doorkeeper::AccessToken.create!(application: app,
    resource_owner_id: user.id, scopes: "read write follow")
  puts token.token
' | tail -n 1 | tr -d '\r')"
[ -n "$MASTODON_TOKEN" ] || { echo "Could not create a Mastodon token"; exit 1; }

compose run --rm tester federate
echo "Mastodon federation test passed"
