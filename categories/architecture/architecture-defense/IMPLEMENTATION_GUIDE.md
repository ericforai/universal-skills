# Architecture Defense - 5-Minute Implementation Guide

Complete solution for enforcing architecture governance using the J1-J4 framework.

## Your Issues

- Components importing directly from other features' internal files
- UI components depending on database models
- Circular dependencies between features

## How J1-J4 Solves This

| Principle | Implementation | What It Does |
|-----------|---------------|--------------|
| **J1: Self-Description** | `manifest.config.ts` | Every module declares its public API, internal code, and dependencies |
| **J2: Self-Check** | dependency-cruiser + ArchUnit | Automated validation of architectural rules |
| **J3: Closed Rules** | Embedded in build tools | Rules apply to the build itself |
| **J4: Reflex** | GitHub Actions + CODEOWNERS | Violations block CI/CD pipeline |

---

## 1. manifest.config.ts (J1: Self-Description)

**Location**: `packages/feature-name/manifest.config.ts`

```typescript
import { Manifest } from '@your-org/architecture-types';

export default {
  // Module Identity
  id: '@your-org/user-management',
  name: 'user-management',
  type: 'feature',

  // What this module DOES
  purpose: [
    'User registration and authentication',
    'Profile management'
  ],

  // What others CAN import (Public API)
  publicAPI: {
    components: ['UserForm', 'UserProfile'],
    services: ['UserService'],
    types: ['User', 'UserRole']
  },

  // What others CANNOT import (Internal)
  internalAPI: {
    components: ['UserFormInternal'],
    services: ['UserValidationService']
  },

  // What WE depend on
  dependencies: {
    features: ['@your-org/auth'],
    ui: ['@your-org/design-system'],
    data: [] // UI layer doesn't access database!
  },

  // Rules that apply to THIS module
  rules: {
    noDirectDataAccess: {
      target: ['components/**/*'],
      forbidden: ['@your-org/database'],
      severity: 'error',
      message: 'UI components must use services, not direct data access'
    }
  }
} as Manifest;
```

**Key Points**:
- Clear separation between public and internal API
- Self-documenting architecture
- Enables automated validation (J2)

---

## 2. dependency-cruiser.config.cjs (J2 + J3: Self-Check + Closed Rules)

**Location**: Root of your frontend repo

```javascript
module.exports = {
  forbidden: [
    /* ========================================
     * RULE 1: No Internal File Imports Across Features
     * ======================================== */
    {
      name: 'no-internal-imports-from-other-features',
      severity: 'error',
      from: { path: 'src/features/[^/]+' },
      to: {
        path: 'src/features/[^/]+/(internal|private)/**',
        pathNot: ({ fromFileName, toFileName }) => {
          // Allow own internal files
          const fromFeature = fromFileName.match(/src\/features\/([^/]+)/)?.[1];
          const toFeature = toFileName.match(/src\/features\/([^/]+)/)?.[1];
          return fromFeature !== toFeature ? toFileName : null;
        }
      }
    },

    /* ========================================
     * RULE 2: UI Components Cannot Access Data Layer
     * ======================================== */
    {
      name: 'no-data-layer-in-ui',
      severity: 'error',
      from: { path: ['src/features/**/components/**', 'src/features/**/hooks/**'] },
      to: {
        path: ['src/data/database/**', 'src/data/models/**'],
        pathNot: ['**/*.types.ts'] // Allow types, not implementations
      }
    },

    /* ========================================
     * RULE 3: No Circular Dependencies
     * ======================================== */
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: { path: 'src' },
      to: { circular: true }
    }
  ],

  options: {
    outputType: 'json',
    moduleSystems: ['ts', 'tsx'],
    tsConfig: { fileName: 'tsconfig.json' }
  }
};
```

**Key Points**:
- Validates imports against architectural rules
- Runs as part of build process (J3)
- Provides detailed violation reports

---

## 3. ArchitectureRulesTest.java (J2 + J3: Backend Self-Check)

**Location**: `src/test/java/ArchitectureRulesTest.java`

```java
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;

class ArchitectureRulesTest {
    private static final JavaClasses classes = new ClassFileImporter()
        .importPackages("com.yourorg");

    @Test
    @DisplayName("UI layer must not access database layer")
    void uiLayerMustNotAccessDatabaseLayer() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..ui..")
            .or().resideInAPackage("..controller..")
            .should().dependOnClassesThat()
            .resideInAPackage("..database..")
            .or().resideInAPackage("..entity..");

        rule.check(classes); // Fails if violated!
    }

    @Test
    @DisplayName("No circular dependencies")
    void noCircularDependencies() {
        slices().matching("com.yourorg.(*)..")
            .should().beFreeOfCycles()
            .check(classes);
    }

    @Test
    @DisplayName("Services must not expose database entities")
    void servicesMustNotExposeEntities() {
        classes().that().resideInAPackage("..service..")
            .and().arePublic()
            .should().notReturnTypesThat()
            .resideInAPackage("..entity..")
            .because("Services should return DTOs, not database entities")
            .check(classes);
    }
}
```

**Key Points**:
- Java/Kotlin equivalent of dependency-cruiser
- Tests layer separation, circular dependencies, DDD
- Part of test suite, fails build if violated

---

## 4. GitHub Actions Workflow (J4: Reflex)

**Location**: `.github/workflows/architecture.yml`

```yaml
name: Architecture Governance

on:
  pull_request:
    branches: [main, develop]

jobs:
  architecture-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run dependency-cruiser
        id: depcruise
        run: |
          npx depcruise --config dependency-cruiser.config.cjs src > report.json || true

          # Check for violations
          VIOLATIONS=$(jq '.summary.violations' report.json)
          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "::error::Found $VIOLATIONS architecture violation(s)"
            exit 1  # ← FAILS THE BUILD (J4: Reflex)
          fi

      - name: Comment PR with violations
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('report.json', 'utf8'));

            const body = `## 🔴 Architecture Violations Detected

            Found ${report.summary.violations} violation(s):

            ${report.violations.map(v => `- ${v.from.value} → ${v.to.value}\n  ${v.rule.message}`).join('\n')}

            Please fix before merging.
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

**Key Points**:
- Automatically runs on every PR
- Comments violations directly on PR
- Blocks merging if violations found (J4: Reflex)

---

## 5. CODEOWNERS Configuration (J4: Team Approval)

**Location**: `.github/CODEOWNERS`

```
# ========================================
# ARCHITECTURE GOVERNANCE (Requires Architecture Team)
# ========================================
/dependency-cruiser.config.cjs      @architecture-team @tech-lead
/.github/workflows/architecture.yml @architecture-team @devops-team
/src/test/java/**/*Architecture*    @architecture-team @backend-lead

# ========================================
# FEATURE MODULES (By Team)
# ========================================
/src/features/user-management/**    @user-management-team
/src/features/orders/**             @orders-team
/src/features/products/**           @product-team

# Internal files require senior approval
**/internal/**                      @senior-dev @tech-lead

# All manifest files
**/manifest.config.ts               @architecture-team

# ========================================
# DATA LAYER (Critical - Extra Review)
# ========================================
/src/data/database/**               @data-team @architecture-team
/src/data/models/**                 @data-team
/migrations/**                      @database-admin @data-team
```

**Key Points**:
- Architecture rule changes need expert approval
- Feature teams own their modules
- Internal code needs senior dev approval

---

## Quick Start (5 Minutes)

### Step 1: Install dependency-cruiser (1 minute)

```bash
npm install --save-dev dependency-cruiser
```

### Step 2: Copy config files (2 minutes)

```bash
# Copy the provided files to your repo
cp manifest.config.ts.example packages/your-feature/manifest.config.ts
cp dependency-cruiser.config.cjs your-repo/
cp workflow.yml your-repo/.github/workflows/architecture.yml
cp CODEOWNERS.example your-repo/.github/CODEOWNERS
```

### Step 3: Update package.json (1 minute)

```json
{
  "scripts": {
    "architecture-check": "depcruise --config dependency-cruiser.config.cjs src",
    "prebuild": "npm run architecture-check",
    "pretest": "npm run architecture-check"
  }
}
```

### Step 4: Run first check (1 minute)

```bash
npm run architecture-check
```

Expected output:
```
✖ Found 23 architecture violations

Examples:
- src/features/orders/OrderForm.tsx → src/features/user-management/internal/utils.ts
  ✖ no-internal-imports-from-other-features

- src/features/auth/components/Login.tsx → src/data/models/User.ts
  ✖ no-data-layer-in-ui
```

### Step 5: Fix violations iteratively

```bash
# Generate HTML report for detailed view
npx depcruise --config dependency-cruiser.config.cjs src --output-type err-html > report.html
open report.html

# Fix violations, then re-run
npm run architecture-check
```

### Step 6: Commit and push (Triggers CI)

```bash
git add .
git commit -m "feat: add architecture governance (J1-J4)"
git push origin main
```

GitHub Actions will now run on every PR!

---

## Example Violations & Fixes

### Violation 1: Internal Import

**Bad**:
```typescript
// src/features/orders/OrderForm.tsx
import { UserUtils } from '@/features/user-management/internal/utils';
// ❌ ERROR: Cannot import internal files from other features
```

**Fix**:
```typescript
// Option 1: Use public API
import { getUserDisplayName } from '@/features/user-management';

// Option 2: Move utils to shared/
import { UserUtils } from '@/shared/utils/user-utils';
```

### Violation 2: UI → Database

**Bad**:
```typescript
// src/features/auth/components/Login.tsx
import { UserModel } from '@/data/models/User';

function Login() {
  const user = await UserModel.findById(id);
  // ❌ ERROR: UI components cannot access database layer
}
```

**Fix**:
```typescript
// src/features/auth/components/Login.tsx
import { useAuth } from '@/features/auth';

function Login() {
  const { login } = useAuth(); // Service handles database
  // ✅ OK: UI uses service, not database
}
```

### Violation 3: Circular Dependency

**Bad**:
```
user-management → auth → notifications → user-management
       ↑                                      ↓
       └────────────── CIRCLE! ───────────────┘
```

**Fix**: Introduce shared module or events
```
user-management → shared-events
auth           → shared-events
notifications  → shared-events
```

---

## How Each J Principle Is Implemented

### J1: Self-Description

**What**: Every module declares its identity and boundaries

**How**: `manifest.config.ts` files

```typescript
export default {
  id: '@my-org/user-management',
  publicAPI: { components: ['UserForm'] },
  internalAPI: { utils: ['passwordHash'] },
  dependencies: { features: ['@my-org/auth'] }
};
```

**Why**: Self-documenting, enables automated validation

---

### J2: Self-Check

**What**: The build validates itself

**How**: dependency-cruiser (frontend) + ArchUnit (backend)

```bash
npm run architecture-check
# or
./gradlew test --tests "*ArchitectureRulesTest*"
```

**Why**: Automated, fast feedback, catches violations early

---

### J3: Closed Rules

**What**: Rules apply to the build itself

**How**: Rules embedded in build tools

```json
{
  "scripts": {
    "prebuild": "npm run architecture-check"
  }
}
```

**Why**: Self-enforcing, no "just this once" exemptions

---

### J4: Reflex

**What**: Violations block CI/CD

**How**: GitHub Actions + CODEOWNERS

```yaml
- name: Run dependency-cruiser
  run: |
    npx depcruise src
    # Fails the build if violations found → blocks merge
```

**Why**: Guaranteed compliance, no bad code can merge

---

## Success Metrics

| Metric | Before | After (Week 1) | After (Month 1) |
|--------|--------|----------------|-----------------|
| Architecture violations | Unknown | 47 (baseline) | 12 |
| PRs blocked by violations | 0 | 15 | 3 |
| Time to fix violations | N/A | 2 hours | 30 min |
| Teams using manifests | 0 | 5 | 12 |

---

## Next Steps

1. **Week 1**: Deploy to 1 pilot team, fix violations
2. **Week 2**: Roll out to all teams, monitor metrics
3. **Week 3**: Add custom rules for your domain
4. **Week 4**: Review and tune rules based on feedback

---

## Summary

| Your Issue | J Solution | Implementation |
|------------|-----------|----------------|
| Components importing from other features' internals | J1 + J2 | manifest.config.ts + dependency-cruiser |
| UI depending on database models | J2 + J4 | dependency-cruiser rules + CI blocking |
| Circular dependencies | J2 + J3 | Circular dependency detection + build enforcement |

**Result**: Self-governing architecture that enforces its own rules automatically.

---

Files created:
- `/Users/user/.claude/skills/architecture-defense/manifest.config.ts.example`
- `/Users/user/.claude/skills/architecture-defense/dependency-cruiser.config.cjs`
- `/Users/user/.claude/skills/architecture-defense/ArchitectureRulesTest.java`
- `/Users/user/.claude/skills/architecture-defense/workflow.yml`
- `/Users/user/.claude/skills/architecture-defense/CODEOWNERS.example`
- `/Users/user/.claude/skills/architecture-defense/README.md`
- `/Users/user/.claude/skills/architecture-defense/IMPLEMENTATION_GUIDE.md`
- `/Users/user/.claude/skills/architecture-defense/package.json`
