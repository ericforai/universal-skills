/**
 * Doc-Code Integrity Checker - Verifies documentation matches code
 * This is a reference implementation for the self-verifying-tests skill
 */

interface LinkCheckReport {
  totalLinks: number
  brokenLinks: Array<{ link: string; file: string; line: number }>
  healthy: boolean
}

interface CoverageReport {
  apiRoutes: Array<{ path: string; hasDoc: boolean }>
  undocumentedCount: number
  healthy: boolean
}

interface ChangelogReport {
  changedModules: string[]
  changelogEntries: string[]
  missingEntries: string[]
  healthy: boolean
}

interface IntegrityReport {
  linkCheck: LinkCheckReport
  coverage: CoverageReport
  changelog: ChangelogReport
  healthy: boolean
  errors: string[]
}

/**
 * Doc Integrity Checker - Ensures documentation stays in sync with code
 *
 * Run this in playwright.config.ts globalSetup to block tests if docs are out of sync.
 */
export class DocIntegrityChecker {
  constructor(private projectRoot: string) {}

  /**
   * Run all integrity checks
   * Call this in globalSetup before tests run
   */
  async runAllChecks(): Promise<IntegrityReport> {
    const errors: string[] = []

    const linkCheck = await this.checkDocCodeLinks()
    if (!linkCheck.healthy) {
      errors.push(`Broken links: ${linkCheck.brokenLinks.length}`)
    }

    const coverage = await this.checkAPIDocCoverage()
    if (!coverage.healthy) {
      errors.push(`Undocumented APIs: ${coverage.undocumentedCount}`)
    }

    const changelog = await this.checkChangelogConsistency()
    if (!changelog.healthy) {
      errors.push(`Changelog missing entries for: ${changelog.missingEntries.join(', ')}`)
    }

    return {
      linkCheck,
      coverage,
      changelog,
      healthy: errors.length === 0,
      errors
    }
  }

  /**
   * Check 1: Readme Link Check
   * Verifies all links in docs/ point to existing files
   */
  async checkDocCodeLinks(): Promise<LinkCheckReport> {
    const brokenLinks: Array<{ link: string; file: string; line: number }> = []

    // Implementation would:
    // 1. Scan all files in docs/
    // 2. Extract markdown links: [text](path)
    // 3. Check if each path exists in the codebase
    // 4. Report broken links

    throw new Error('Not implemented - reference only')
  }

  /**
   * Check 2: API Documentation Coverage
   * Verifies every API route has corresponding documentation
   */
  async checkAPIDocCoverage(): Promise<CoverageReport> {
    // Implementation would:
    // 1. Scan src/app/api/ for all route files
    // 2. Check docs/api/ for matching documentation
    // 3. Report undocumented routes

    throw new Error('Not implemented - reference only')
  }

  /**
   * Check 3: Changelog Consistency
   * Verifies code changes have corresponding CHANGELOG entries
   */
  async checkChangelogConsistency(): Promise<ChangelogReport> {
    const changedModules = await this.getChangedModulesSinceLastRelease()
    const changelogEntries = await this.getChangelogEntries()

    const missingEntries = changedModules.filter(m => !changelogEntries.includes(m))

    return {
      changedModules,
      changelogEntries,
      missingEntries,
      healthy: missingEntries.length === 0
    }
  }

  /**
   * Get modules changed since last release tag
   */
  private async getChangedModulesSinceLastRelease(): Promise<string[]> {
    // Implementation would:
    // 1. Get last git tag
    // 2. git diff --name-only LAST_TAG
    // 3. Extract module names from changed paths

    throw new Error('Not implemented - reference only')
  }

  /**
   * Parse CHANGELOG.md for module entries
   */
  private async getChangelogEntries(): Promise<string[]> {
    // Implementation would:
    // 1. Read CHANGELOG.md
    // 2. Parse for module mentions (e.g., "### Pages Collection")
    // 3. Return list of mentioned modules

    throw new Error('Not implemented - reference only')
  }
}

/**
 * Playwright globalSetup integration
 *
 * Add to playwright.config.ts:
 *   globalSetup: require.resolve('./tests/global-setup.ts')
 *
 * In tests/global-setup.ts:
 *   import { DocIntegrityChecker } from '../validators/doc-integrity'
 *   const checker = new DocIntegrityChecker(process.cwd())
 *   const report = await checker.runAllChecks()
 *   if (!report.healthy && process.env.CI === 'true') {
 *     process.exit(1)
 *   }
 */
export async function setupDocIntegrity(projectRoot: string): Promise<void> {
  const checker = new DocIntegrityChecker(projectRoot)
  const report = await checker.runAllChecks()

  if (!report.healthy) {
    console.error('❌ Doc-Code Integrity Check Failed:')
    for (const error of report.errors) {
      console.error(`  - ${error}`)
    }

    // In CI, fail the build
    if (process.env.CI === 'true') {
      console.error('\n🚫 Blocking CI: Fix documentation before merging')
      process.exit(1)
    }

    console.warn('\n⚠️  Warning: Documentation out of sync (allowed in dev mode)')
    return
  }

  console.log('✅ Doc-Code Integrity Check Passed')
}
