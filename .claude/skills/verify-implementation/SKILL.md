---
name: verify-implementation
description: Sequentially runs all verify skills to generate an integrated verification report. Use after feature implementation, before PRs, or during code reviews.
---

# Implementation Verification

## Purpose

Sequentially executes all `verify-*` skills registered in the project to perform integrated verification:

- Execute checks defined in each skill's Workflow
- Reference each skill's Exceptions to prevent false positives
- Suggest fixes for discovered issues
- Apply fixes and re-verify after user approval

## When to Run

- After implementing a new feature
- Before creating a Pull Request
- During code review
- When auditing codebase rule compliance

## Target Skills

List of verification skills that this skill sequentially executes. `/manage-skills` automatically updates this list when creating/deleting skills.

| # | Skill | Description |
|---|-------|-------------|
| 1 | `uitest` | Pencil 디자인 vs 실제 UI 비교 & 자동 수정 (Main.pen + Puppeteer) |
| 2 | `verify-backend` | 백엔드 보안 패턴, 인증 플로우, Supabase 에러 처리 검증 |

## Workflow

### Step 1: Introduction

Check the skills listed in the **Target Skills** section above.

If an optional argument is provided, filter to that skill only.

**If 0 skills are registered:**

```markdown
## Implementation Verification

No verification skills found. Run `/manage-skills` to create verification skills for your project.
```

Terminate the workflow in this case.

**If 1 or more skills are registered:**

Display the contents of the target skills table:

```markdown
## Implementation Verification

Running the following verification skills sequentially:

| # | Skill | Description |
|---|-------|-------------|
| 1 | verify-<name1> | <description1> |
| 2 | verify-<name2> | <description2> |

Starting verification...
```

### Step 2: Sequential Execution

For each skill listed in the **Target Skills** table, perform the following:

#### 2a. Read Skill SKILL.md

Read the skill's `.claude/skills/verify-<name>/SKILL.md` and parse these sections:

- **Workflow** — Check steps and detection commands to execute
- **Exceptions** — Patterns considered not violations
- **Related Files** — List of files to check

#### 2b. Execute Checks

Execute each check defined in the Workflow section in order:

1. Use the tools specified in the check (Grep, Glob, Read, Bash) for pattern detection
2. Compare detected results against the skill's PASS/FAIL criteria
3. Exempt patterns matching the Exceptions section
4. For FAIL cases, record the issue:
   - File path and line number
   - Problem description
   - Fix recommendation (with code examples)

#### 2c. Record Per-Skill Results

Display progress after each skill execution completes:

```markdown
### verify-<name> Verification Complete

- Check items: N
- Passed: X
- Issues: Y
- Exempted: Z

[Moving to next skill...]
```

### Step 3: Integrated Report

After all skills complete execution, consolidate results into a single report:

```markdown
## Implementation Verification Report

### Summary

| Verification Skill | Status | Issue Count | Details |
|-------------------|--------|-------------|---------|
| verify-<name1> | PASS / X issues | N | Details... |
| verify-<name2> | PASS / X issues | N | Details... |

**Total issues found: X**
```

**When all verifications pass:**

```markdown
All verifications passed!

The implementation complies with all project rules:

- verify-<name1>: <pass summary>
- verify-<name2>: <pass summary>

Ready for code review.
```

**When issues are found:**

List each issue with file path, problem description, and fix recommendation:

```markdown
### Issues Found

| # | Skill | File | Problem | Fix |
|---|-------|------|---------|-----|
| 1 | verify-<name1> | `path/to/file.ts:42` | Problem description | Fix code example |
| 2 | verify-<name2> | `path/to/file.tsx:15` | Problem description | Fix code example |
```

### Step 4: User Action Confirmation

If issues are found, use `AskUserQuestion` to confirm with the user:

```markdown
---

### Fix Options

**X issues were found. How would you like to proceed?**

1. **Fix all** - Automatically apply all recommended fixes
2. **Fix individually** - Review and apply each fix one by one
3. **Skip** - Exit without changes
```

### Step 5: Apply Fixes

Apply fixes based on user selection.

**When "Fix all" is selected:**

Apply all fixes in order and display progress:

```markdown
## Applying fixes...

- [1/X] verify-<name1>: `path/to/file.ts` fix complete
- [2/X] verify-<name2>: `path/to/file.tsx` fix complete

X fixes complete.
```

**When "Fix individually" is selected:**

Show fix details for each issue and use `AskUserQuestion` to confirm approval.

### Step 6: Post-Fix Re-verification

If fixes were applied, re-run only the skills that had issues and compare Before/After:

```markdown
## Post-Fix Re-verification

Re-running skills that had issues...

| Verification Skill | Before Fix | After Fix |
|-------------------|------------|-----------|
| verify-<name1> | X issues | PASS |
| verify-<name2> | Y issues | PASS |

All verifications passed!
```

**If issues remain:**

```markdown
### Remaining Issues

| # | Skill | File | Problem |
|---|-------|------|---------|
| 1 | verify-<name> | `path/to/file.ts:42` | Cannot auto-fix — manual review required |

Resolve manually and run `/verify-implementation` again.
```

---

## Exceptions

The following are **not problems**:

1. **Projects with no registered skills** — Display an informational message and terminate, not an error
2. **Skill-specific exceptions** — Patterns defined in each verify skill's Exceptions section are not reported as issues
3. **verify-implementation itself** — Does not include itself in the target skills list
4. **manage-skills** — Not included in targets since it doesn't start with `verify-`

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/manage-skills/SKILL.md` | Skill maintenance (manages the target skills list for this file) |
| `CLAUDE.md` | Project guidelines |
