# Content migration

## 1. Medium post inventory

Source: `https://nnajiabraham.medium.com/` (RSS `https://medium.com/feed/@nnajiabraham`, fetched 2026-09-18). Nine posts, all 2019–2021, all short how-to notes. Every one maps to the `note` template except the Go LinkedList post, which is an `article`.

| # | Published (UTC) | Title | Medium URL | Proposed slug | Template | Tags |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2021-02-13 | Writing A LinkedList In Golang [Data Structures In Go] | https://nnajiabraham.medium.com/writing-a-linkedlist-in-golang-data-structures-in-go-ae1b06be2cb5 | `writing-a-linkedlist-in-golang` | article | go, data-structures |
| 2 | 2019-02-20 | Ubuntu/Linux Ultrawide Monitor Fix | https://nnajiabraham.medium.com/ubuntu-linux-ultrawide-monitor-fix-387d9448a566 | `ubuntu-ultrawide-monitor-fix` | note | linux, ubuntu |
| 3 | 2019-02-14 | Installing docker on ubuntu | https://nnajiabraham.medium.com/installing-docker-on-ubuntu-6d6e7846d4ad | `installing-docker-on-ubuntu` | note | linux, ubuntu, docker |
| 4 | 2019-02-14 | npm install missing write access to usr/lib/node_modules ubuntu (How to install node/npm linux) | https://nnajiabraham.medium.com/npm-install-missing-write-access-to-usr-lib-node-modules-ubuntu-how-to-install-node-npm-linux-71b260bd9fa5 | `install-node-npm-ubuntu-without-sudo` | note | linux, ubuntu, node |
| 5 | 2019-02-14 | Ubuntu kvm is required to run this avd /dev/kvm device permission denied | https://nnajiabraham.medium.com/ubuntu-kvm-is-required-to-run-this-avd-dev-kvm-device-permission-denied-a570f457ef42 | `ubuntu-kvm-permission-denied-android-emulator` | note | linux, ubuntu, android |
| 6 | 2019-02-14 | How To Install Android Studio IDE For Linux On Ubuntu 16.04 / 18.04 / 18.10 | https://nnajiabraham.medium.com/how-to-install-android-studio-ide-for-linux-on-ubuntu-16-04-18-04-18-10-42d830977f3a | `install-android-studio-ubuntu` | note | linux, ubuntu, android |
| 7 | 2019-02-14 | Gradle/ JAVA_HOME Is Set To The Wrong Directory (Ubuntu Fix) | https://nnajiabraham.medium.com/gradle-java-home-is-set-to-the-wrong-directory-ubuntu-fix-dcfd3615ecbb | `gradle-java-home-wrong-directory-ubuntu` | note | linux, ubuntu, java |
| 8 | 2019-02-14 | How To Install Gradle Build Tool On Ubuntu 16.04 / 18.04 / 18.10 | https://nnajiabraham.medium.com/how-to-install-gradle-build-tool-on-ubuntu-16-04-18-04-18-10-d03a3a5cff38 | `install-gradle-ubuntu` | note | linux, ubuntu, java |
| 9 | 2019-01-28 | Permission denied or retry as administrator in VS Code | https://nnajiabraham.medium.com/permission-denied-or-retry-as-administrator-in-vs-code-caf5b510bc70 | `vscode-permission-denied-retry-as-administrator` | note | linux, vscode |

Migration rules

- `publishedAt` = Medium date (date part, UTC). `createdAt` = same. `updatedAt` = migration date. `status: published`.
- Titles may be trimmed (drop version numbers from titles, keep them in the body); descriptions written fresh (Medium subtitles are fragments).
- Keep the original "these are my notes for my own reference" framing — it matches the `note` template and the owner's voice. Add a one-line 2026 preface where the advice is stale (Ubuntu 16.04/18.04 is EOL; Docker install steps changed).
- Body content taken from RSS `content:encoded` (full HTML) and converted to Markdown by hand; code blocks re-fenced with language hints.
- Canonical: per `plan.md` Q3; default is self-canonical. If Medium is to stay canonical, set `canonical` to the URL above.
- After migration, add a "Now on nnajiabraham.com" note on Medium pointing to each new URL (manual, owner's Medium account).

Posts 3–8 were published within five hours of each other on 2019-02-14; consider a `series: { name: "Ubuntu dev setup, 2019", part: n }` on those six so they render as a set.

## 2. NDA-safe project entries ("Cleared for Release")

Rules applied: describe by problem shape and outcome; no employer-internal product names, partner or customer names, ticket IDs, or confidential figures. Sensitivity from the source extract is noted for the implementer only — **do not render it**. Entries marked *hold* are kept out of the first release pending owner review.

### Agents platform (current)

**Shared infrastructure for an org-wide agents platform.** Designed and built the platform layer teams deploy agents onto: versioned infrastructure-as-code module families (runtimes, gateways, invokers, memory, networking, managed Postgres), on-demand environments with a TTL, and a one-repo-per-agent model. Wrote the multi-milestone plan from proof-of-concept to multi-team production. *Tags: aws, opentofu, platform, agents. Sensitivity: medium — phrase as above, no further detail.*

**A shipping stack for agents: CI/CD, prompt promotion, evals, tracing.** CI orchestrates, cloud build executes, deploy roles are scoped. Prompts are released, not deployed: pinned versions, an eval runner, and gates a reviewer can approve without production access. A multi-category eval taxonomy with a golden harness, and tracing wired into the agent template — including root-causing broken token and cost attribution on a streaming path. *Tags: ci-cd, evals, observability, agents. Sensitivity: medium.*

**Retrieval-augmented classifier for a regulated coding task.** Primary author of an agent that maps free-text disclosures to a constrained code set: embeddings + HNSW retrieval, candidate-only generation (the model may pick, not invent), deterministic post-checks. Hardened ingest performance, eval harnesses, and prompt auditability for production. *Tags: rag, pgvector, python, evals. Sensitivity: medium — keep "regulated" generic; don't name the code system.*

### Developer platform and infrastructure

**Security scanner that turned "no" into self-serve.** A scanner, sanitizer, and secret detector with a CI-gated publish path so non-engineering teams could use AI design tools for customer-facing email modules safely. The control was the thing that let the org say yes; later extended across tenants. *Tags: security, ci-cd, enablement. Sensitivity: low.*

**Shared skills library for AI-assisted engineering.** Started from a personal toolkit, became the org's shared repo with dozens of skills and multiple contributors — being out-contributed was the success metric. Drove the move from all-or-nothing clone to selective install with lint and security scanning in CI. *Tags: devx, ai-tooling, open-source-style. Sensitivity: low.*

**Internal "build apps with AI" platform (founded).** *Hold for owner review* — sensitivity medium and the description overlaps with current employer strategy. If included: "Ideated, named, and proved out an org-controlled platform for building internal apps with AI (remote tools, capability/RBAC model, draft → publish lifecycle); handed day-to-day build to another engineer and stayed technical owner through architecture decisions and review."

### Payments and multi-tenancy

**Live payment-processor migration to Stripe.** Architected and mostly built the payments service (subscriptions, webhooks, customer portal), then migrated thousands of live recurring subscribers from the previous processor with dry-run and reconcile tooling and CRM sync for support. Final reconciliation: zero failed migrations. *Tags: stripe, payments, migrations, typescript. Sensitivity: medium — keep the count vague ("thousands").*

**Pricing integrity: one funnel, locked down.** Led the redesign so every pricing mutation flows through a single service: product-partitioned change handlers, database permission lockdown, checksum manifests for rate tables, elevated CI approval on pricing-critical modules, discrepancy alerting, and runbooks. Release-managed the rollout across many repositories. *Tags: postgres, ci-cd, reliability, leadership. Sensitivity: medium.*

**Multi-tenant document storage as a PaaS foundation.** Owned the storage-isolation slice of a company-wide multi-tenancy push — per-tenant clients and folder-scoped credentials so partner brands could run on the shared platform. The structural unlock for later partner launches. *Tags: aws, s3, multi-tenancy. Sensitivity: medium.*

**Partner launches and a claims-partner integration.** Led end-to-end onboarding of B2B2C partners across many repos (billing products, docs, theming, feature flags) and led a small team building an external API integration (member sync, bilingual support, health checks) that gated a product launch. *Tags: integrations, leadership, multi-tenancy. Sensitivity: medium — no partner names.*

### Frontend and design systems

**Multi-tenant design system through a rebrand.** Core contributor to a typed component library and theme provider serving white-label tenants through a company rebrand: foundational components, Storybook, visual snapshots, automated axe-based accessibility tests across library and apps. *Tags: react, design-systems, a11y, storybook. Sensitivity: low.*

### Automation

**Redaction-first follow-up drafting pipeline.** Sole implementer of an automation from call artifacts to advisor-reviewed CRM email tasks: redaction first, LLM summarisation, typed routing. Wrote the security-review response and the decision memo that chose a reversible interim architecture with a stated migration path. *Tags: llm, automation, security. Sensitivity: medium.*

### Side projects (Home "featured" candidates)

- **Lo-fi album** — embed album `https://open.spotify.com/album/4uDZESDQhmIwc47G8Qesko` and link artist `https://open.spotify.com/artist/4nea0DllTPwOWq3lWNZE8Q`. Copy: "I also make lo-fi. This is the album."
- **Arduino and electronics** — one paragraph, no photo unless the owner supplies one of a build.
- **This site** — link to the repo; one line on the stack.

Recommended Home featured trio: Agents platform infrastructure, Stripe migration, Security scanner — plus the Spotify card.

## 3. Blog post ideas (5–8, grounded in real work; NDA-safe framing)

1. **Safety rails by default in agent scaffolds** — why guardrail hooks belong in the starter template, not in a checklist authors are supposed to remember. `article`.
2. **Prompt promotion is a release, not a deploy** — pins, eval gates, and letting approvers review diffs without production access. `article`.
3. **Constrained generation for regulated RAG** — candidate-only answers and deterministic post-checks when "hallucinate a little" is not an option. `article`.
4. **Security as the yes button** — how a template scanner turned "no AI email tools" into self-serve publishing for non-engineers. `article`.
5. **Defence in depth for money paths** — application funnel + database revoke + checksum manifests + elevated merge gates. `article`.
6. **Live billing migrations with no safe failure mode** — dry-run, match, reconcile, hand off to support; every subscriber has to keep charging correctly exactly once. `article`.
7. **"The agent never saw request X"** — usually means X crashed before the log line ran. A short debugging aphorism with two examples. `note`.
8. **Founding a repo you hope to be out-contributed on** — selective install, declining premature tiers, adoption as the metric. `note` or `article`.

Non-work ideas to keep the blog from being all shop talk (one per quarter): a student-pilot cross-country debrief; a lo-fi production-chain note; an Arduino garden-sensor write-up (also a natural `youtube` embed test).
