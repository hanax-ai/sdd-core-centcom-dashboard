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

- `Dashboard CI / windows-advisory` — promote to required only after stable operation and separate approval (§3.4).
- `Dependency Review / dependency-review` — advisory; depends on the Dependency Graph feature.
- `Dependency Audit / npm-audit` — scheduled/manual only; network-dependent, never a required gate (§3.5).

## Activation procedure (when separately authorized)

1. Confirm `Dashboard CI / required` has produced at least one green run on `main` and on a PR.
2. Create the ruleset above via **Settings → Rules → Rulesets → New branch ruleset** (or the equivalent API).
3. Add **only** `Dashboard CI / required` to the required checks list.
4. Set the ruleset **Enforcement status** to **Active** (not `Disabled` or `Evaluate`) so the controls take effect.
5. Run the control-effectiveness test in the launch packet §5 (deliberate-failure PR) to prove deny/allow behavior.
6. Record activation and test evidence in the coordinator handoff.

## Rationale

- A required, executable status is enforcement; a PR description or an LLM review (e.g. CodeRabbit) is not.
- Keeping the required set to a single deterministic aggregate (`Dashboard CI / required`) makes the gate stable and unambiguous.
- Advisory checks provide signal without introducing flaky or network-dependent merge blockers.
