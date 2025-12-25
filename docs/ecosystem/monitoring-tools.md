---
sidebar_position: 22
title: Monitoring Tools
description: Tools for monitoring Fediverse instances
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

### Fediverse Observer

Network statistics.

| Property | Value |
|----------|-------|
| Website | [fediverse.observer](https://fediverse.observer/) |
| Features | Uptime, user counts |
| Coverage | Major platforms |

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
| Free tier | 50 monitors |
| Checks | HTTP, keyword |

**Setup for Fediverse:**
```
Monitor: HTTP(s)
URL: https://your-instance.example/api/v1/instance
Keyword: "uri"
```

### Prometheus + Grafana

Advanced metrics collection.

**Mastodon metrics:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'mastodon'
    static_configs:
      - targets: ['localhost:9090']
```

**Key metrics:**
- Active users
- Queue depth
- Response times
- Error rates

### Health Checks

**Endpoint monitoring:**
```bash
# Check instance health
curl -s https://instance.example/api/v1/instance | jq '.stats'

# Check Sidekiq (Mastodon)
curl -s https://instance.example/api/v1/instance | jq '.stats.status'
```

## Federation Monitoring

### Federation Status

Check federation health:

```bash
# Test outgoing federation
curl -X POST https://your-instance.example/api/v1/statuses \
  -H "Authorization: Bearer $TOKEN" \
  -d "status=Federation test $(date)"

# Monitor delivery queue (Mastodon)
RAILS_ENV=production bundle exec rails mastodon:stats
```

### Blocked Instances

Track moderation actions:

```bash
# Get domain blocks
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

### Oban (Elixir platforms)

```elixir
# Pleroma/Akkoma queue status
Oban.stats()
```

## Log Analysis

### Common Patterns

**Signature failures:**
```bash
grep "signature" /var/log/mastodon/web.log | grep -i "fail\|error"
```

**Federation errors:**
```bash
grep "delivery" /var/log/mastodon/sidekiq.log | grep "error"
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
          __path__: /var/log/mastodon/*.log
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
        expr: sidekiq_queue_size > 10000
        for: 10m
        annotations:
          summary: "Sidekiq queue is backing up"
```

## Dashboard Example

**Grafana dashboard panels:**

| Panel | Query | Purpose |
|-------|-------|---------|
| Active Users | `mastodon_active_users` | User engagement |
| Posts/hour | `rate(mastodon_statuses_total[1h])` | Activity |
| Response Time | `http_request_duration_seconds` | Performance |
| Queue Depth | `sidekiq_queue_size` | Processing |
| Error Rate | `rate(http_requests_total{status=~"5.."}[5m])` | Reliability |

## See Also

- **[Testing Tools](/docs/ecosystem/testing-tools)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Hosting Providers](/docs/ecosystem/hosting-providers)**

