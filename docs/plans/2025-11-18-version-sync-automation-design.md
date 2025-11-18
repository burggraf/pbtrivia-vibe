# Version Sync Automation Design

**Date**: 2025-11-18
**Status**: Approved
**Implementation**: Pending

## Overview

Automate version synchronization across the trivia-party project so that updating the root `package.json` version automatically propagates to the Tauri display app's `package.json` and `tauri.conf.json`.

## Problem Statement

Currently, the project has three files with version numbers:
1. Root `/package.json` (web app)
2. Display app `/trivia-party-display/package.json` (npm package)
3. Display app `/trivia-party-display/src-tauri/tauri.conf.json` (Tauri bundle)

When the version is updated in the root, the display app versions must be manually updated, leading to:
- Version drift between projects
- Manual synchronization burden
- Potential for incorrect version display in the UI

## Requirements

### Functional Requirements
1. Root `package.json` version is the single source of truth
2. Display app versions sync automatically before any build/dev command
3. Version syncing runs transparently without developer intervention
4. Script fails build if version sync encounters errors

### Non-Functional Requirements
1. Zero external dependencies (pure Node.js)
2. Fast execution (<100ms)
3. Idempotent (safe to run multiple times)
4. Clear error messages on failure

## Design

### Architecture

**Source of truth**: `/package.json` (root web app)

**Target files**:
- `/trivia-party-display/package.json` (field: `version`)
- `/trivia-party-display/src-tauri/tauri.conf.json` (field: `version`)

**Trigger point**: npm lifecycle hooks (`pre*` scripts) in display app

### Component Design

#### Sync Script: `scripts/sync-version.js`

**Location**: `/scripts/sync-version.js` (alongside existing import scripts)

**Algorithm**:
```
1. Read root package.json
2. Extract version field
3. Validate version exists and is non-empty
4. Read display package.json
5. Read tauri.conf.json
6. Update version fields in both objects
7. Write display package.json (atomic)
8. Write tauri.conf.json (atomic)
9. Output success message
```

**Implementation characteristics**:
- Synchronous file operations (simpler, fast enough)
- JSON.stringify with 2-space indentation (maintains formatting)
- Preserves all other fields in target files
- Exit code 0 on success, 1 on error

#### Package.json Integration

**Display app package.json modifications**:
```json
{
  "scripts": {
    "presync": "node ../scripts/sync-version.js",
    "prebuild": "pnpm presync",
    "predev": "pnpm presync",
    "pretauri:dev": "pnpm presync",
    "pretauri:build": "pnpm presync",
    "pretauri:android:dev": "pnpm presync",
    "pretauri:android:build": "pnpm presync"
  }
}
```

**Execution flow**:
```
Developer runs: pnpm tauri:dev
  ↓
npm runs: pretauri:dev hook
  ↓
npm runs: presync hook
  ↓
Executes: node ../scripts/sync-version.js
  ↓
Syncs versions
  ↓
Returns to: tauri:dev command
```

### Error Handling

**Error scenarios**:

| Scenario | Behavior | Exit Code |
|----------|----------|-----------|
| Root package.json missing | Error: "Cannot read root package.json" | 1 |
| Invalid JSON in any file | Error: "Invalid JSON in [filename]" | 1 |
| No version in root | Error: "No version found in root package.json" | 1 |
| Write permission denied | Error: "Cannot write [filename]" | 1 |
| File system error | Error: [system error message] | 1 |

**Success output**:
```
✓ Version synced to 1.5.3
```

**Idempotency**:
- If versions already match, succeeds immediately (no-op)
- Running multiple times produces identical result
- Safe for CI/CD pipelines

### Safety Measures

1. **Atomic operations**: Read all files before writing any
2. **JSON validation**: Validate structure before writing
3. **Preserve formatting**: Use 2-space indentation
4. **Preserve fields**: Only update `version` field, leave all others intact
5. **Error propagation**: Exit code 1 stops build process

## User Experience

### Developer Workflow

**Current (manual)**:
```bash
# 1. Update root version
vim package.json  # change version to 1.6.0

# 2. Update display app version
vim trivia-party-display/package.json  # change version to 1.6.0

# 3. Update Tauri config version
vim trivia-party-display/src-tauri/tauri.conf.json  # change version to 1.6.0

# 4. Build
cd trivia-party-display
pnpm tauri:build
```

**Automated (proposed)**:
```bash
# 1. Update root version
vim package.json  # change version to 1.6.0

# 2. Build (versions sync automatically)
cd trivia-party-display
pnpm tauri:build
```

**Key improvements**:
- 3 manual steps → 1 manual step
- Zero chance of version drift
- Versions always correct before build
- No mental overhead for developers

### Terminal Output

**Success case**:
```bash
$ pnpm tauri:dev

> presync
> node ../scripts/sync-version.js

✓ Version synced to 1.5.3

> tauri:dev
...
```

**Error case**:
```bash
$ pnpm tauri:dev

> presync
> node ../scripts/sync-version.js

✗ Error: Cannot read root package.json
ENOENT: no such file or directory

 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  presync failed
```

## Implementation Checklist

- [ ] Create `/scripts/sync-version.js`
  - [ ] Read root package.json
  - [ ] Extract version
  - [ ] Read display package.json
  - [ ] Read tauri.conf.json
  - [ ] Update version fields
  - [ ] Write files with formatting preservation
  - [ ] Add error handling for all scenarios
  - [ ] Add success/error output messages
- [ ] Update display app package.json
  - [ ] Add `presync` script
  - [ ] Add pre-hooks for all build/dev commands
- [ ] Test scenarios
  - [ ] Happy path: version syncs correctly
  - [ ] Idempotency: running twice produces same result
  - [ ] Error: missing root package.json
  - [ ] Error: invalid JSON in target file
  - [ ] Verify formatting preserved
  - [ ] Verify other fields preserved
- [ ] Verify UI displays correct version after sync

## Alternatives Considered

### Option 1: npm package (syncpack)
**Pros**: Robust, battle-tested, handles complex monorepo scenarios
**Cons**: External dependency, configuration overhead, overkill for simple use case
**Decision**: Rejected - adds complexity without significant benefit

### Option 2: Shell script with jq
**Pros**: Very fast, minimal code, standard Unix tool
**Cons**: Requires jq installation, less portable across developer machines
**Decision**: Rejected - Node.js already available, better cross-platform support

### Option 3: Custom Node.js script (chosen)
**Pros**: Zero dependencies, simple, easy to understand and modify, pure JavaScript
**Cons**: Need to write from scratch (but minimal code ~20 lines)
**Decision**: **Selected** - best balance of simplicity and maintainability

## Future Enhancements

Potential improvements (not in scope for initial implementation):

1. **Silent mode**: Add `--silent` flag to suppress output
2. **Dry-run mode**: Add `--dry-run` to show what would change without writing
3. **Git integration**: Optional auto-commit of version changes
4. **CI/CD validation**: Add check to verify versions are synced in CI
5. **Monorepo support**: Extend to sync other potential apps in the future

## Testing Strategy

### Manual Testing
1. Update root version
2. Run `pnpm tauri:dev` in display app
3. Verify console shows sync message
4. Verify app shows correct version in UI
5. Verify target files contain correct version
6. Run again without changing version (test idempotency)

### Edge Case Testing
1. Remove root package.json → verify error
2. Corrupt display package.json JSON → verify error
3. Remove version from root → verify error
4. Test with various version formats (1.0.0, 2.0.0-beta, etc.)

## Success Criteria

1. ✅ Developer updates root package.json version only
2. ✅ Display app versions sync automatically before build
3. ✅ App UI displays correct version
4. ✅ No manual intervention required
5. ✅ Build fails if sync fails (safety)
6. ✅ Script runs in <100ms
7. ✅ Zero external dependencies

## References

- npm lifecycle hooks: https://docs.npmjs.com/cli/v9/using-npm/scripts#pre--post-scripts
- Tauri versioning: https://v2.tauri.app/reference/config/#version
- Node.js fs module: https://nodejs.org/api/fs.html
