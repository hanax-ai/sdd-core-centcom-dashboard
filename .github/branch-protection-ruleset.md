# Dashboard `main` Branch-Protection Ruleset — PREPARED, NOT ACTIVATED

**Work order:** WO-P2-PRE-2-CI-001
**Status:** Prepared recommendation. **Do not activate or alter without explicit Agent Zero authorization.**
Workflow code (this branch) and ruleset configuration are **separate controls** and are approved separately.

This document specifies the exact GitHub ruleset to apply to `main` **after** the
`Dashboard CI / required` status has demonstrated stable operation and activation is
separately authorized.

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

## Activation procedure (when separately authorized)

1. Confirm `Dashboard CI / required` has produced at least one green run on `main` and on a PR.
2. Create the ruleset above via **Settings → Rules → Rulesets → New branch ruleset** (or the equivalent API).
3. Under **Require status checks to pass**, add **only** the `Dashboard CI / required` check by **selecting it from the search dropdown of already-observed checks** (do not free-type the string) so it binds to the correct GitHub Actions source. A free-typed entry sits permanently as "Expected — waiting for status to be reported" and blocks every merge even when the real check passes.
4. Set the ruleset **Enforcement status** to **Active** (not `Disabled` or `Evaluate`) so the controls take effect.
5. Run a control-effectiveness test to prove deny/allow behavior: open a PR containing a deliberate `format:check` violation, confirm `Dashboard CI / required` fails and the ruleset blocks the Merge button; then correct the violation, confirm the check passes and the Merge button unblocks. Do not merge the probe — close the PR and delete its branch afterward.
6. Record activation and test evidence in the coordinator handoff.

## Rationale

- A required, executable status is enforcement; a PR description or an LLM review (e.g. CodeRabbit) is not.
- Keeping the required set to a single deterministic aggregate (`Dashboard CI / required`) makes the gate stable and unambiguous.
- Advisory checks provide signal without introducing flaky or network-dependent merge blockers.
