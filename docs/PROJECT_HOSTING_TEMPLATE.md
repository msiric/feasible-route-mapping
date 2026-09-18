# <Project> hosting record

Copy this into the new repository as `DEPLOYMENT.md`, replace placeholders and remove inapplicable rows. Do not place credential values here. Follow the [hosting playbook](https://github.com/msiric/feasible-route-mapping/blob/master/docs/FREE_DEMO_HOSTING.md).

## Purpose and status

- Owner / repository: <name / URL>
- Public demo: <URL>
- Intended audience and live features: <description>
- Sample behavior / external dependencies: <description>
- Synthetic data / visibility / retention / cleanup: <description>
- Accepted limitations and open work: <description>
- Last verified date / by: <date / person>
- Monthly paid budget: $0; <actual Free-plan checks and date>

## Ownership and resource inventory

| Provider | Parent name and exact ID | App project/service/DB ID | Region and plan | Dashboard |
| --- | --- | --- | --- | --- |
| Cloudflare | <account> | <Pages project> | <plan> | <URL> |
| Render, if needed | <workspace> | <project / environment / service> | <region / Free> | <URL> |
| Neon, if needed | <organization> | <project / endpoint / database> | <region / PG version / Free> | <URL> |

Excluded accounts/resources: <names or IDs relevant to this operator; do not copy another app's credentials>.

## Deployment

| Setting | Value |
| --- | --- |
| GitHub default branch | <branch> |
| Backend source branch / auto-deploy | <branch / Off> |
| Pages production branch label | <exact branch> |
| Node/runtime / image digest | <version or digest> |
| Clean install / build | <exact commands and working directory> |
| Backend start / health path | <commands / path> |
| Frontend build output | <directory> |
| CLI authentication scope/profile | <non-secret instructions, not token> |
| Production deploy command | <explicit account/project/branch> |
| Migrations / seed / host guard | <procedure> |

## Secrets and configuration

| Variable name | Provider/environment | Purpose and rotation dependencies |
| --- | --- | --- |
| <NAME> | <location> | <meaning, never value> |

Private recovery credential location: <password-manager item label or private procedure; do not claim a backup exists until verified>.

## Cost and capacity

- Payment method and paid-overage behavior: <verified facts>
- Build spending cap: <value and date>
- Shared provider quotas / existing consumption: <values and scope>
- App-specific compute/storage/traffic caps: <values>
- Sleep/wake and quota-exhaustion user experience: <behavior>
- Health/polling/cleanup policy: <how idle resources remain idle>

## Verification and release record

| Date | Source commit | API deployment/commit | Pages production ID | Migrations | Checks / result |
| --- | --- | --- | --- | --- | --- |
| <date> | <sha> | <version> | <ID> | <versions> | <result> |

Measured cold/warm latency and memory: <dated observations; hardware/limits; not guarantees>.
CI / local test commands: <exact commands with disposable data requirements>.
Public smoke test: <sample, live, reload, isolation, logout/cancel, security and error checks>.

## Recovery and maintenance

- Previous known-good versions: <IDs/commits>
- Frontend rollback and verification: <steps>
- Backend rollback and schema compatibility: <steps>
- Data recovery/recreation and acceptable loss: <steps>
- Quota exhaustion: <sample fallback, targeted cleanup or reset; no automatic upgrade>
- Maintenance owner/cadence: <person / monthly and before releases>
- Old hosting and charges: <audited? exact remaining follow-up>
- Retirement: <exact children, dependencies, export/revocation/deletion procedure>

References and plan-check date: <official documentation links>.
