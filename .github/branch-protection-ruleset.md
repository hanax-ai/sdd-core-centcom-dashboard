# Dashboard `main` Branch-Protection Ruleset — ACTIVE, REQUIRED-CHECK BINDING PENDING

**Work order:** WO-P2-PRE-2-CI-001
**Status:** Ruleset `main-branch-protection` is **Active** (activation authorized). One control
remains **incomplete**: the required status check is **not correctly bound**. The Merge button
is currently jammed by a phantom required entry (see "Known defect" below), and the gate does
not yet gate on the real `Dashboard CI / required` result. The CI completion handoff stays
blocked until the binding is corrected and deny/allow is re-proven.
Workflow code and ruleset configuration are **separate controls** and are approved separately.

This document specifies the exact GitHub ruleset for `main` and the procedure to correct the
required-check binding.

## Known defect — required-check binding (2026-07-22)

The ruleset currently shows a phantom required entry: **"Dashboard CI / required — Expected —
Waiting for status to be reported (Required)"**, separate from the real reported check. This is
the free-typed-binding failure described in the remediation procedure below: the required context
string does not match what GitHub Actions reports, so it never resolves — it blocks every merge
while failing to gate on the real result.

**Correction:** In **Require status checks to pass**, remove the current entry and re-add
`Dashboard CI / required` by **selecting it from the search dropdown of observed checks** (do not
free-type). `main` and open PRs have already reported this check, so it appears in the dropdown.

**Evidence correction:** The merge-block observed during the initial probe came from
**Require conversation resolution**, not the status check. The status-check deny/allow proof is
therefore **not yet valid** and must be re-run after the binding is corrected.

## Target

- Repository: dashboard repository only (P2-PRE-2 scope).
- Branch: `main` (ruleset target `Include default branch`).

## Recommended ruleset settings

| Setting                                          | Value   | Notes                                      |
| ------------------------------------------------ | ------- | ------------------------------------------ |
| Require a pull request before merging            | **On**  | No direct pushes to `main`.                |
| Require status checks to pass                    | **On**  | Add exactly **`Dashboard CI / required`**. |
| Require branches to be up to date before merging | **On**  | Branch must be current with `main`.        |
| Require conversation resolution before merging   | **On**  | Unresolved review threads block merge.     |
| Block force pushes                               | **On**  |                                            |
| Restrict deletions (block branch deletion)       | **On**  |                                            |
| Allow bypass of failed required checks           | **Off** | No routine bypass.                         |

**Merge method:** Not governed by this ruleset. Preserve the repository's existing
merge-commit workflow; do not change it under this WO.

### Required status checks — include ONLY

```text
Dashboard CI / required
```

### Explicitly NOT required (advisory) at activation time

- `Dashboard CI / windows-advisory` — promote to required only after it has demonstrated stable operation and received separate approval; do not add it to the required set at initial activation.
- `Dependency Review / dependency-review` — advisory; depends on the repository Dependency Graph feature being enabled.
- `Dependency Audit / npm-audit` — scheduled/manual only; it is network-dependent (reaches the advisory database), so it must never be a required merge gate.

## Remediation procedure (ruleset is already Active — edit in place)

The `main-branch-protection` ruleset is already **Active**. Do **not** create a second ruleset and
do **not** toggle enforcement off/on — that risks a duplicate or a coverage gap. Edit the existing
ruleset in place and correct **only** the status-check binding.

1. Open the existing ruleset for editing: **Settings → Rules → Rulesets → `main-branch-protection`**. Confirm you are editing this ruleset in place; do not choose "New branch ruleset".
2. Under **Require status checks to pass**, **remove** the current `Dashboard CI / required` entry (the phantom "Expected — waiting for status to be reported" binding) and re-add it by **selecting `Dashboard CI / required` from the search dropdown of already-observed checks** (do not free-type the string) so it binds to the correct GitHub Actions source. A free-typed entry sits permanently as "Expected — waiting for status to be reported" and blocks every merge even when the real check passes. Then set the check's **source to GitHub Actions** (not "Any source") so only the `Dashboard CI` workflow's result can satisfy the gate — this prevents another integration reporting a same-named status from bypassing enforcement.
3. Leave **Enforcement status** as **Active** and **Save changes**. Do not disable/re-enable or duplicate the ruleset.
4. Re-run a control-effectiveness test that isolates the **status check** from other blockers. Before testing, put the probe PR in a state where the status check is the ONLY thing that can block merge: **resolve all review conversations** and bring the branch **up to date with `main`** (satisfy `Require conversation resolution` and `Require branches to be up to date`). Then:
   - **Deny case:** push a commit with a deliberate `format:check` violation. Confirm `Dashboard CI / required` reports **failing**, and confirm the merge is blocked **by the status check specifically** — read the branch-protection message and verify it names `Required check "Dashboard CI / required" is expected/failing` (or the red required-check row), not "unresolved conversations" or "out-of-date branch". Record that explicit reason.
   - **Allow case:** correct the violation, keep conversations resolved and the branch current, confirm `Dashboard CI / required` reports **passing**, and confirm the Merge button unblocks.
   - Do not rely on Merge-button state alone: the button can be blocked by conversation-resolution or an out-of-date branch, which is separate evidence and must not be conflated with status-check enforcement.
   - Do not merge the probe — close the PR and delete its branch afterward.
5. Record remediation and test evidence in the coordinator handoff, stating the explicit status-check blocking reason from the deny case and keeping it distinct from any conversation-resolution evidence.

## First-time setup (historical reference — already completed)

These steps created and activated `main-branch-protection` originally and are **already
completed**. They are retained only for rebuilding the ruleset from scratch (e.g. in a new
repository). **Do not run them against this repository** — an Active ruleset already exists and
re-running them would create a duplicate. To correct the live ruleset, use the **Remediation
procedure** above instead.

1. Confirm `Dashboard CI / required` has produced at least one green run on `main` and on a PR.
2. Create the ruleset via **Settings → Rules → Rulesets → New branch ruleset** (or the equivalent API), using the **Recommended ruleset settings** above.
3. Under **Require status checks to pass**, add **only** `Dashboard CI / required` by **selecting it from the search dropdown of already-observed checks** (do not free-type the string), then set its **source to GitHub Actions** (not "Any source").
4. Set the ruleset **Enforcement status** to **Active** (not `Disabled` or `Evaluate`).

## Rationale

- A required, executable status is enforcement; a PR description or an LLM review (e.g. CodeRabbit) is not.
- Keeping the required set to a single deterministic aggregate (`Dashboard CI / required`) makes the gate stable and unambiguous.
- Advisory checks provide signal without introducing flaky or network-dependent merge blockers.
