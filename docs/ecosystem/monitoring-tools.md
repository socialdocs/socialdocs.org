---
sidebar_position: 22
title: Monitoring Tools
description: Tools for monitoring Fediverse instances
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (config/initializers/prometheus_exporter.rb, sidekiq.rb, domain_blocks_controller.rb), prometheus_exporter gem source/README, provider websites"
---

# Monitoring Tools

Tools for monitoring and analyzing Fediverse instances.

## Instance Directories

### FediDB

Fediverse statistics and analytics.

| Property | Value |
|----------|-------|
| Website | [fedidb.org](https://fedidb.org/) |
| Features | Stats, software tracking |
| Data | User counts, posts, growth |

### instances.social

Mastodon instance directory.

| Property | Value |
|----------|-------|
| Website | [instances.social](https://instances.social/) |
| Features | Discovery, filtering |
| Focus | Mastodon instances |

## Server Monitoring

### UptimeRobot

Basic uptime monitoring.

| Property | Value |
|----------|-------|
| Website | [uptimerobot.com](https://uptimerobot.com/) |
| Free tier | 50 monitors (pricing page, October 2026) |
| Checks | HTTP, keyword |

**Setup for Fediverse:**
```
Monitor: HTTP(s)
URL: https://your-instance.example/api/v1/instance
Keyword: "uri"
```

### Prometheus + Grafana

Advanced metrics collection.

**Mastodon metrics:** Mastodon has a built-in Prometheus exporter, enabled with `MASTODON_PROMETHEUS_EXPORTER_ENABLED=true` (default port 9394). See the [Mastodon configuration docs](https://docs.joinmastodon.org/admin/config/) for the full set of `MASTODON_PROMETHEUS_EXPORTER_*` variables.

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'mastodon'
    static_configs:
      - targets: ['localhost:9394']
```

### Health Checks

**Endpoint monitoring:**
```bash
# Check instance health and public stats
curl -s https://instance.example/api/v1/instance | jq '.stats'
```

## Federation Monitoring

### Federation Status

Check federation health:

```bash
# Test outgoing federation
curl -X POST https://your-instance.example/api/v1/statuses \
  -H "Authorization: Bearer $TOKEN" \
  -d "status=Federation test $(date)"
```

For Mastodon's delivery queues, use the Sidekiq web UI at `/sidekiq` (admin only) or the Sidekiq API below.

### Blocked Instances

Track moderation actions:

```bash
# Get domain blocks — public only if the admin chose to show them
# (Mastodon's show_domain_blocks setting); otherwise returns 404 or needs a login
curl https://instance.example/api/v1/instance/domain_blocks
```

## Queue Monitoring

### Sidekiq (Ruby platforms)

```ruby
# Check queue status
require 'sidekiq/api'

stats = Sidekiq::Stats.new
puts "Processed: #{stats.processed}"
puts "Failed: #{stats.failed}"
puts "Queued: #{stats.enqueued}"
```

## Log Analysis

### Common Patterns

Mastodon logs to stdout. On a standard install the [systemd units](https://github.com/mastodon/mastodon/tree/main/dist) send this to the journal; with Docker use `docker compose logs`.

**Signature failures:**
```bash
journalctl -u mastodon-web --since "1 hour ago" | grep -i "signature"
```

**Federation errors:**
```bash
journalctl -u mastodon-sidekiq --since "1 hour ago" | grep -iE "delivery|error"
```

### Log Aggregation

**Using Loki + Grafana:**
```yaml
# promtail config
scrape_configs:
  - job_name: mastodon
    static_configs:
      - targets:
          - localhost
        labels:
          job: mastodon
          # Mastodon logs to the systemd journal; for journald use
          # promtail's `journal` scrape config instead of __path__
```

## Performance Tools

### Database Monitoring

**PostgreSQL queries:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Redis Monitoring

```bash
# Memory usage
redis-cli INFO memory

# Key count
redis-cli DBSIZE

# Slow log
redis-cli SLOWLOG GET 10
```

## Alerting

### PagerDuty / Opsgenie

Set up alerts for:
- Instance down
- High error rate
- Queue backup
- Database issues

### Example Alert Rules

```yaml
# Prometheus alert rules
groups:
  - name: fediverse
    rules:
      - alert: InstanceDown
        expr: up{job="mastodon"} == 0
        for: 5m
        annotations:
          summary: "Instance is down"

      - alert: QueueBacklog
        expr: max by (queue) (ruby_sidekiq_queue_backlog) > 10000   # needs SIDEKIQ_DETAILED_METRICS
        for: 10m
        annotations:
          summary: "Sidekiq queue is backing up"
```

## Dashboard Example

**Grafana dashboard panels:**

| Panel | Query | Purpose |
|-------|-------|---------|
| Response Time | `ruby_http_request_duration_seconds` | Performance (needs `MASTODON_PROMETHEUS_EXPORTER_WEB_DETAILED_METRICS=true`) |
| Error Rate | `rate(ruby_http_requests_total{status=~"5.."}[5m])` | Reliability (same) |
| Queue Depth | `max by (queue) (ruby_sidekiq_queue_backlog)` | Processing (needs `MASTODON_PROMETHEUS_EXPORTER_SIDEKIQ_DETAILED_METRICS=true`) |
| Queue Latency | `max by (queue) (ruby_sidekiq_queue_latency_seconds)` | Delivery delay (same) |
| Failed Jobs | `rate(ruby_sidekiq_failed_jobs_total[5m])` | Delivery failures (same) |

Per-queue metrics are reported by every Sidekiq process that handles the queue, so take the `max`, don't `sum` ([Mastodon's `sidekiq.rb` initializer](https://github.com/mastodon/mastodon/blob/v4.7.3/config/initializers/sidekiq.rb)). Without the detailed-metrics flags, Mastodon still exports Ruby process, Sidekiq process (busy/concurrency) and ActiveRecord connection-pool metrics.

Mastodon exports no product metrics (users, posts) — these come from the [prometheus_exporter](https://github.com/discourse/prometheus_exporter) gem; check your own `/metrics` output for exact names.

## See Also

- **[Testing Tools](/docs/ecosystem/testing-tools)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Hosting Providers](/docs/ecosystem/hosting-providers)**

