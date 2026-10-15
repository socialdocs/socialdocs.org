---
sidebar_position: 0
title: Testing & Debugging Tools
description: The external tools ActivityPub developers actually use to inspect, test and debug federation — and what the guides in this section cover
---

# Testing & Debugging Tools

The pages in this section are **guides**, not interactive tools: SocialDocs does not host a validator or signature tester. This page points you at the external tools that exist today, with their status as checked in October 2026.

## Inspect remote objects

| Tool | What it does | Status |
|------|--------------|--------|
| [BrowserPub](https://browser.pub/) | "A browser for exploring ActivityPub and the fediverse": fetch and view actors, objects and collections | Live |
| [Fedify CLI](https://fedify.dev/cli) | `fedify lookup` fetches an object by URL or an actor by handle; `fedify webfinger` and `fedify nodeinfo` query discovery endpoints | Active (Fedify 2.4.x) |
| [webfinger.net](https://webfinger.net/) | WebFinger lookup in the browser | Live |
| [JSON-LD Playground](https://json-ld.org/playground/) | Expand, compact and inspect JSON-LD documents | Live |

Install the Fedify CLI with `npm install -g @fedify/cli` (other install methods are listed on [fedify.dev/cli](https://fedify.dev/cli)).

## Test your server against others

| Tool | What it does | Status |
|------|--------------|--------|
| `fedify inbox` | Spins up an ephemeral inbox server with a one-time actor on a short-lived public HTTPS address, so you can follow your server and watch what it sends | Active |
| `fedify tunnel` | Exposes a local HTTP server to the public internet over a secure tunnel, so remote servers can reach your dev machine | Active |
| [ActivityPub Academy](https://activitypub.academy/) | A public Mastodon instance you can federate with | Runs **Mastodon 4.1.18** (October 2026) — several major versions behind current Mastodon, so its behaviour is not current |
| A local Mastodon, GoToSocial or other server | The most reliable way to test interop against current releases | — |

## Test suites

There is no maintained, official conformance suite. See [Test Suites](/docs/tools/test-suites) for what exists ([activitypub-testsuite](https://github.com/steve-bate/activitypub-testsuite) is active; FediTest and the go-fed suite are stale).

## Guides in this section

- [Validating activities](/docs/tools/activity-validator) — checking activities and objects by hand and in code
- [Inspecting actors](/docs/tools/actor-inspector) — fetching and reading actor documents
- [Testing WebFinger](/docs/guides/webfinger-implementation#lookup-tools) — checking discovery
- [Working with JSON-LD](/docs/tools/json-ld-playground) — contexts and expansion
- [Troubleshooting by symptom](/docs/guides/troubleshooting) — common federation failures
- [Compliance checklist](/docs/tools/compliance-checklist) — what to verify before you federate

:::note Help wanted
Know a tool that belongs here? [Open an issue or PR](https://github.com/socialdocs/socialdocs.org) with a link and its current status.
:::
