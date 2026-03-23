---
name: manage-skills
description: Analyzes session changes to detect and fix verification skill drift. Use after implementing features, before PRs, or periodically.
---

# Session-Based Skill Maintenance

## Purpose

Analyzes all changes made during the current session to detect and fix verification skill drift:

1. **Coverage gaps** — Changed files not referenced by any verify skill
2. **Invalid references** — Skills referencing deleted or moved files
3. **Missing checks** — New patterns/rules not covered by existing checks
4. **Stale values** — Config values or detection commands that no longer match

## When to Run

- After implementing features that introduce new patterns or rules
- When you want to check consistency after modifying existing verify skills
- Before a PR to confirm verify skills cover the changed areas
- When a verification run missed issues you expected it to catch
- Periodically to align skills with codebase changes

## Registered Verification Skills

List of verification skills currently registered in the project. Update this list when creating/deleting skills.

| Skill | Description | Covered File Patterns |
|-------|-------------|----------------------|
| `uitest` | Pencil 디자인 vs 실제 UI 비교 & 자동 수정 (Main.pen + Puppeteer로 전체 UI 검증) | `app/globals.css`, `components/*.tsx`, `app/**/*.tsx`, `app/memos/*.tsx` |
| `verify-backend` | 백엔드 보안 패턴, 인증 플로우, Supabase 에러 처리 검증 | `app/api/**/route.ts`, `lib/*.ts`, `middleware.ts` |

## Workflow

### Step 1: Analyze Session Changes

Collect all files changed during the current session:

```bash
# Uncommitted changes
git diff HEAD --name-only

# Commits on current branch (if branched from main)
git log --oneline main..HEAD 2>/dev/null

# All changes since branching from main
git diff main...HEAD --name-only 2>/dev/null
```

Merge into a deduplicated list. If an optional argument specifying a skill name or area is provided, filter to related files only.

**Display:** Group files by top-level directory (first 1-2 path segments):

```markdown
## Session Changes Detected

**N files changed in this session:**

| Directory | Files |
|-----------|-------|
| src/components | `Button.tsx`, `Modal.tsx` |
| src/server | `router.ts`, `handler.ts` |
| tests | `api.test.ts` |
| (root) | `package.json`, `.eslintrc.js` |
```

### Step 2: Map Changed Files to Registered Skills

Reference the skills listed in the **Registered Verification Skills** section above to build a file-to-skill mapping.

#### Sub-step 2a: Check Registered Skills

Read each skill's name and covered file patterns from the **Registered Verification Skills** table.

If 0 skills are registered, jump directly to Step 4 (CREATE vs UPDATE decision). All changed files are treated as "UNCOVERED".

If 1 or more skills are registered, read each skill's `.claude/skills/verify-<name>/SKILL.md` and extract additional file path patterns from:

1. **Related Files** section — Parse tables for file paths and glob patterns
2. **Workflow** section — Extract file paths from grep/glob/read commands

#### Sub-step 2b: Match Changed Files to Skills

For each changed file collected in Step 1, compare against registered skill patterns. A file matches a skill if:

- It matches the skill's covered file patterns
- It resides within a directory referenced by the skill
- It matches regex/string patterns used in the skill's detection commands

#### Sub-step 2c: Display Mapping

```markdown
### File → Skill Mapping

| Skill | Trigger Files (Changed) | Action |
|-------|------------------------|--------|
| verify-api | `router.ts`, `handler.ts` | CHECK |
| verify-ui | `Button.tsx` | CHECK |
| (no skill) | `package.json`, `.eslintrc.js` | UNCOVERED |
```

### Step 3: Coverage Gap Analysis for Affected Skills

For each AFFECTED skill (skills with matched changed files), read the full SKILL.md and check:

1. **Missing file references** — Are changed files related to this skill's domain not listed in its Related Files section?
2. **Stale detection commands** — Do the skill's grep/glob patterns still match the current file structure? Run sample commands to test.
3. **Uncovered new patterns** — Read changed files and identify new rules, configs, or patterns not checked by the skill. Look for:
   - New type definitions, enum variants, or exported symbols
   - New registrations or configurations
   - New file naming or directory conventions
4. **Residual references to deleted files** — Are files listed in the skill's Related Files no longer present in the codebase?
5. **Changed values** — Have specific values checked by the skill (identifiers, config keys, type names) been modified in the changed files?

Record each gap found:

```markdown
| Skill | Gap Type | Details |
|-------|----------|---------|
| verify-api | Missing file | `src/server/newHandler.ts` not in Related Files |
| verify-ui | New pattern | New component uses unchecked rules |
| verify-test | Stale value | Test runner pattern in config changed |
```

### Step 4: CREATE vs UPDATE Decision

Apply the following decision tree:

```
For each group of uncovered files:
    IF files are related to an existing skill's domain:
        → Decision: UPDATE existing skill (extend coverage)
    ELSE IF 3+ related files share common rules/patterns:
        → Decision: CREATE new verify skill
    ELSE:
        → Mark as "exempt" (no skill needed)
```

Present results to the user:

```markdown
### Suggested Actions

**Decision: UPDATE existing skills** (N)
- `verify-api` — Add 2 missing file references, update detection patterns
- `verify-test` — Update detection commands for new config patterns

**Decision: CREATE new skills** (M)
- New skill needed — Cover <pattern description> (X uncovered files)

**No action needed:**
- `package.json` — Config file, exempt
- `README.md` — Documentation, exempt
```

Use `AskUserQuestion` to confirm:
- Which existing skills to update
- Whether to create the suggested new skills
- Option to skip entirely

### Step 5: Update Existing Skills

For each skill approved for update, read the current SKILL.md and apply targeted edits:

**Rules:**
- **Add/modify only** — Never remove existing checks that still work
- Add new file paths to the **Related Files** table
- Add new detection commands for patterns found in changed files
- Add new workflow steps or sub-steps for uncovered rules
- Remove references to files confirmed deleted from the codebase
- Update specific changed values (identifiers, config keys, type names)

**Example — Adding a file to Related Files:**

```markdown
## Related Files

| File | Purpose |
|------|---------|
| ... existing entries ... |
| `src/server/newHandler.ts` | New request handler with validation |
```

**Example — Adding a detection command:**

````markdown
### Step N: Verify New Pattern

**File:** `path/to/file.ts`

**Check:** Description of what to verify.

```bash
grep -n "pattern" path/to/file.ts
```

**Violation:** What it looks like when incorrect.
````

### Step 6: Create New Skills

**Important:** When creating a new skill, you must confirm the skill name with the user.

For each new skill to create:

1. **Explore** — Read related changed files to deeply understand the patterns

2. **Confirm skill name with user** — Use `AskUserQuestion`:

   Present the patterns/domain the skill will cover and ask the user to provide or confirm the name.

   **Naming rules:**
   - Names must start with `verify-` (e.g., `verify-auth`, `verify-api`, `verify-caching`)
   - If the user provides a name without the `verify-` prefix, automatically prepend it and notify the user
   - Use kebab-case (e.g., `verify-error-handling`, not `verify_error_handling`)

3. **Create** — Create `.claude/skills/verify-<name>/SKILL.md` following this template:

```yaml
---
name: verify-<name>
description: <one-line description>. Use after <trigger condition>.
---
```

Required sections:
- **Purpose** — 2-5 numbered verification categories
- **When to Run** — 3-5 trigger conditions
- **Related Files** — Table of actual file paths in the codebase (verified with `ls`, no placeholders)
- **Workflow** — Check steps, each specifying:
  - Tool to use (Grep, Glob, Read, Bash)
  - Exact file paths or patterns
  - PASS/FAIL criteria
  - How to fix on failure
- **Output Format** — Markdown table for results
- **Exceptions** — At least 2-3 realistic "not a violation" cases

4. **Update related skill files** — After creating a new skill, you must update the following 3 files:

   **4a. Update this file itself (`manage-skills/SKILL.md`):**
   - Add a new skill row to the **Registered Verification Skills** section table
   - On first skill addition, remove the "(No verification skills registered yet)" text and HTML comment and replace with the table
   - Format: `| verify-<name> | <description> | <covered file patterns> |`

   **4b. Update `verify-implementation/SKILL.md`:**
   - Add a new skill row to the **Target Skills** section table
   - On first skill addition, remove the "(No verification skills registered yet)" text and HTML comment and replace with the table
   - Format: `| <number> | verify-<name> | <description> |`

   **4c. Update `CLAUDE.md`:**
   - Add a new skill row to the `## Skills` table
   - Format: `| verify-<name> | <one-line description> |`

### Step 7: Verification

After all edits:

1. Re-read all modified SKILL.md files
2. Confirm markdown formatting is correct (no unclosed code blocks, consistent table columns)
3. Confirm no broken file references — for each path in Related Files, verify file existence:

```bash
ls <file-path> 2>/dev/null || echo "MISSING: <file-path>"
```

4. Dry-run one detection command from each updated skill to validate syntax
5. Confirm the **Registered Verification Skills** table and **Target Skills** table are in sync

### Step 8: Summary Report

Display the final report:

```markdown
## Session Skill Maintenance Report

### Files analyzed: N

### Skills updated: X
- `verify-<name>`: N new checks added, Related Files updated
- `verify-<name>`: Detection commands updated for new patterns

### Skills created: Y
- `verify-<name>`: Covers <pattern>

### Related files updated:
- `manage-skills/SKILL.md`: Registered verification skills table updated
- `verify-implementation/SKILL.md`: Target skills table updated
- `CLAUDE.md`: Skills table updated

### Unaffected skills: Z
- (No related changes)

### Uncovered changes (no applicable skill):
- `path/to/file` — Exempt (reason)
```

---

## Quality Criteria for Created/Updated Skills

All created or updated skills must have:

- **Actual file paths from the codebase** (verified with `ls`), not placeholders
- **Working detection commands** — Real grep/glob patterns that match current files
- **PASS/FAIL criteria** — Clear conditions for pass and fail for each check
- **At least 2-3 realistic exceptions** — Descriptions of what is not a violation
- **Consistent formatting** — Same as existing skills (frontmatter, section headers, table structure)

---

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-implementation/SKILL.md` | Integrated verification skill (manages the target skills list) |
| `.claude/skills/manage-skills/SKILL.md` | This file itself (manages the registered verification skills list) |
| `CLAUDE.md` | Project guidelines (this skill manages the Skills section) |

## Exceptions

The following are **not problems**:

1. **Lock files and generated files** — `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, auto-generated migration files, and build artifacts do not need skill coverage
2. **One-off config changes** — Version bumps in `package.json`/`Cargo.toml`, minor linter/formatter config changes do not need a new skill
3. **Documentation files** — `README.md`, `CHANGELOG.md`, `LICENSE`, etc. are not code patterns that need verification
4. **Test fixture files** — Files in directories used as test fixtures (e.g., `fixtures/`, `__fixtures__/`, `test-data/`) are not production code
5. **Unaffected skills** — Skills marked UNAFFECTED do not need review; most skills in most sessions fall into this category
6. **CLAUDE.md itself** — Changes to CLAUDE.md are documentation updates, not code patterns requiring verification
7. **Vendor/third-party code** — Files in `vendor/`, `node_modules/`, or copied library directories follow external rules
8. **CI/CD config** — `.github/`, `.gitlab-ci.yml`, `Dockerfile`, etc. are infrastructure, not application patterns requiring verification skills
