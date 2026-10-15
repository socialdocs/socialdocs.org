---
sidebar_position: 0
title: Testing & Debugging Tools
description: Interactive tools on SocialDocs for linting objects, inspecting actors and checking HTTP signatures, plus the external tools ActivityPub developers use to test and debug federation
---

# Testing & Debugging Tools

## Tools on this site

These run in your browser; nothing you paste is sent to SocialDocs.

| Tool | What it does |
|------|--------------|
| [Activity Linter](/docs/tools/activity-validator) | Checks an actor, activity or object against Activity Streams 2.0, ActivityPub and Mastodon's acceptance rules, with a source link for every finding |
| [Actor Inspector](/docs/tools/actor-inspector) | Resolves a handle with WebFinger, fetches the actor from your browser and lints it (servers that block CORS or require signed fetch: paste the JSON instead) |
| [Signature Inspector](/docs/tools/signature-inspector) | Shows the exact draft-cavage signing string or RFC 9421 signature base for a pasted request, checks the digest and Mastodon's required components, and verifies with a public key |

The external tools below are the ones that exist today, with their status as checked in October 2026.

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

- [Activity Linter](/docs/tools/activity-validator) — the linter, plus checking activities and objects in code
- [Actor Inspector](/docs/tools/actor-inspector) — the inspector, plus fetching and reading actor documents in code
- [Signature Inspector](/docs/tools/signature-inspector) — signing strings and signature bases
- [Testing WebFinger](/docs/guides/webfinger-implementation#lookup-tools) — checking discovery
- [Working with JSON-LD](/docs/tools/json-ld-playground) — contexts and expansion
- [Debugging tips](/docs/tools/debugging-tips) — common federation failures
- [Compliance checklist](/docs/tools/compliance-checklist) — what to verify before you federate

:::note Help wanted
Know a tool that belongs here? [Open an issue or PR](https://github.com/socialdocs/socialdocs.org) with a link and its current status.
:::
