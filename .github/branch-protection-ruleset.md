# Dashboard `main` Branch-Protection Ruleset — ACTIVE, ENFORCING

**Work order:** WO-P2-PRE-2-CI-001
**Status:** Ruleset `main-branch-protection` is **Active** and enforcing. The required status
check is correctly bound to the context **`required`** (source: GitHub Actions), and deny/allow
has been verified (see "Resolved defect" and "Control evidence" below).
Workflow code and ruleset configuration are **separate controls** and are approved separately.

> **Binding name vs display name:** The required status check must be bound to the **job name**
> **`required`** — the check-run context GitHub Actions actually reports — NOT the PR-UI display
> string `Dashboard CI / required` and NOT the bare workflow name `Dashboard CI`. Binding either of
> the latter leaves a phantom "Expected — waiting for status to be reported" entry that blocks every
> merge. Throughout this document, "the `required` check" means this job-name context.

## Resolved defect — required-check binding (2026-07-22)

**Symptom:** The ruleset showed a phantom required entry — **"Dashboard CI / required — Expected —
Waiting for status to be reported (Required)"** — separate from the real reported check. It blocked
every merge while failing to gate on the real result.

**Root cause:** The required check was bound to the **display string** `Dashboard CI / required`
(the workflow-name-prefixed label shown in the PR checks UI) instead of the actual reported status
context. GitHub Actions reports each job's check-run under its **job name** — here, **`required`**.
No context literally named `Dashboard CI / required` is ever reported, so the entry sat permanently
as "Expected — waiting for status to be reported".

**Fix (applied):** In **Require status checks to pass**, the required entry was re-bound to
**`required`** with **source = GitHub Actions**. The phantom cleared and the gate now resolves on
the real result.

**Evidence correction:** The merge-block observed during the initial probe came from **Require
conversation resolution**, not the status check. The valid status-check deny/allow proof is the one
recorded under "Control evidence" below (post-rebind).

## Control evidence (2026-07-22, post-rebind)

- **Allow:** PR #14 (touches only `.github/**`, so `npm ci` passes) shows the `required` check
  **passing** and is mergeable once conversations are resolved.
- **Deny:** PRs #9–#13 (Dependabot bumps with an inconsistent generated lockfile) fail the
  `required` check (`npm ci` sync error) and are **blocked** from merge by the required status check.

## Target

- Repository: dashboard repository only (P2-PRE-2 scope).
- Branch: `main` (ruleset target `Include default branch`).

## Recommended ruleset settings

| Setting                                          | Value   | Notes                                          |
| ------------------------------------------------ | ------- | ---------------------------------------------- |
| Require a pull request before merging            | **On**  | No direct pushes to `main`.                    |
| Require status checks to pass                    | **On**  | Add exactly the job-name check **`required`**. |
| Require branches to be up to date before merging | **On**  | Branch must be current with `main`.            |
| Require conversation resolution before merging   | **On**  | Unresolved review threads block merge.         |
| Block force pushes                               | **On**  |                                                |
| Restrict deletions (block branch deletion)       | **On**  |                                                |
| Allow bypass of failed required checks           | **Off** | No routine bypass.                             |

**Merge method:** Not governed by this ruleset. Preserve the repository's existing
merge-commit workflow; do not change it under this WO.

### Required status checks — include ONLY

The single required context is the **job name** below (source: GitHub Actions). It is displayed in
the PR checks UI as "Dashboard CI / required", but the ruleset binding string is the job name:

```text
required
```

### Explicitly NOT required (advisory) at activation time

- `windows-advisory` (job name; displayed in the PR UI as "Dashboard CI / windows-advisory") — promote to required only after it has demonstrated stable operation and received separate approval; do not add it to the required set at initial activation.
- `Dependency Review / dependency-review` — advisory; depends on the repository Dependency Graph feature being enabled.
- `Dependency Audit / npm-audit` — scheduled/manual only; it is network-dependent (reaches the advisory database), so it must never be a required merge gate.

## Remediation procedure (ruleset is already Active — edit in place)

The `main-branch-protection` ruleset is already **Active**. Do **not** create a second ruleset and
do **not** toggle enforcement off/on — that risks a duplicate or a coverage gap. Edit the existing
ruleset in place and correct **only** the status-check binding.

1. Open the existing ruleset for editing: **Settings → Rules → Rulesets → `main-branch-protection`**. Confirm you are editing this ruleset in place; do not choose "New branch ruleset".
2. Under **Require status checks to pass**, **remove** any wrongly-bound entry (e.g. a prefixed `Dashboard CI / required` or bare `Dashboard CI` label sitting as a phantom "Expected — waiting for status to be reported") and add the job-name context **`required`** by **selecting it from the search dropdown of already-observed checks** (do not free-type the string, and do not select the workflow-prefixed label). Then set the check's **source to GitHub Actions** (not "Any source") so only the `Dashboard CI` workflow's result can satisfy the gate — this prevents another integration reporting a same-named status from bypassing enforcement.
3. Leave **Enforcement status** as **Active** and **Save changes**. Do not disable/re-enable or duplicate the ruleset.
4. Re-run a control-effectiveness test that isolates the **status check** from other blockers. Before testing, put the probe PR in a state where the status check is the ONLY thing that can block merge: **resolve all review conversations** and bring the branch **up to date with `main`** (satisfy `Require conversation resolution` and `Require branches to be up to date`). Then:
   - **Deny case:** push a commit with a deliberate `format:check` violation. Confirm the `required` check reports **failing**, and confirm the merge is blocked **by the status check specifically** — read the branch-protection message and verify it names the required `required` check (or the red required-check row), not "unresolved conversations" or "out-of-date branch". Record that explicit reason.
   - **Allow case:** correct the violation, keep conversations resolved and the branch current, confirm the `required` check reports **passing**, and confirm the Merge button unblocks.
   - Do not rely on Merge-button state alone: the button can be blocked by conversation-resolution or an out-of-date branch, which is separate evidence and must not be conflated with status-check enforcement.
   - Do not merge the probe — close the PR and delete its branch afterward.
5. Record remediation and test evidence in the coordinator handoff, stating the explicit status-check blocking reason from the deny case and keeping it distinct from any conversation-resolution evidence.

## First-time setup (historical reference — already completed)

These steps created and activated `main-branch-protection` originally and are **already
completed**. They are retained only for rebuilding the ruleset from scratch (e.g. in a new
repository). **Do not run them against this repository** — an Active ruleset already exists and
re-running them would create a duplicate. To correct the live ruleset, use the **Remediation
procedure** above instead.

1. Confirm the `required` check (job name; source GitHub Actions) has produced at least one green run on `main` and on a PR.
2. Create the ruleset via **Settings → Rules → Rulesets → New branch ruleset** (or the equivalent API), using the **Recommended ruleset settings** above.
3. Under **Require status checks to pass**, add **only** the job-name context **`required`** by **selecting it from the search dropdown of already-observed checks** (do not free-type the string, and do not select the workflow-prefixed label), then set its **source to GitHub Actions** (not "Any source").
4. Set the ruleset **Enforcement status** to **Active** (not `Disabled` or `Evaluate`).

## Rationale

- A required, executable status is enforcement; a PR description or an LLM review (e.g. CodeRabbit) is not.
- Keeping the required set to a single deterministic aggregate (the `required` job) makes the gate stable and unambiguous.
- Advisory checks provide signal without introducing flaky or network-dependent merge blockers.
