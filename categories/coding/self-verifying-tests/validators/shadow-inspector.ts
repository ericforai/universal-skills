/**
 * Shadow Inspector - Cross-layer validation (UI ↔ Database ↔ Audit Log)
 * This is a reference implementation for the self-verifying-tests skill
 */

import type { Page } from '@playwright/test'

interface InvariantCheck {
  uiState: unknown
  dbState: unknown
  auditLog: unknown
  consistent: boolean
  violations: string[]
}

interface ConsistencyReport {
  entityId: string
  uiHash: string
  dbHash: string
  auditMatches: boolean
  consistent: boolean
  violations: string[]
}

/**
 * Shadow Inspector - Verifies UI, Database, and Audit Log consistency
 *
 * Core principle: Hash(UI_Shown(id)) === Hash(DB_Stored(id))
 * If they differ, the system narrative is broken.
 */
export class ShadowInspector {
  constructor(private db: DatabaseConnection) { }

  /**
   * Main verification function - call this in Playwright tests
   *
   * Usage:
   *   await inspector.verifyInvariant(page, 'archive', archiveId)
   */
  async verifyInvariant(
    page: Page,
    entityType: string,
    entityId: string
  ): Promise<InvariantCheck> {
    const violations: string[] = []

    // 1. Get UI state
    const uiState = await this.getUIState(page, entityId)

    // 2. Get DB state
    const dbState = await this.getDBState(entityType, entityId)

    // 3. Get audit log
    const auditLog = await this.getAuditLog(entityId)

    // 4. Compare UI vs DB
    if (!this.deepEquals(uiState, dbState)) {
      violations.push('UI state != DB state')
    }

    // 5. Verify audit log exists
    if (!auditLog || (Array.isArray(auditLog) && auditLog.length === 0)) {
      violations.push('No audit log entry found')
    }

    return {
      uiState,
      dbState,
      auditLog,
      consistent: violations.length === 0,
      violations
    }
  }

  /**
   * Check consistency across all layers
   * Returns detailed report for debugging
   */
  async checkConsistency(entityType: string, entityId: string): Promise<ConsistencyReport> {
    const uiHash = await this.hashUIState(entityType, entityId)
    const dbHash = await this.hashDBState(entityType, entityId)
    const auditMatches = await this.verifyAuditEntry(entityId)

    const violations: string[] = []
    if (uiHash !== dbHash) violations.push('UI-DB hash mismatch')
    if (!auditMatches) violations.push('Audit log missing or inconsistent')

    return {
      entityId,
      uiHash,
      dbHash,
      auditMatches,
      consistent: violations.length === 0,
      violations
    }
  }

  /**
   * Extract state from UI using data attributes
   */
  private async getUIState(page: Page, id: string): Promise<unknown> {
    return await page.evaluate((entityId) => {
      const el = document.querySelector(`[data-entity-id="${entityId}"]`)
      if (!el) return null

      return {
        id: el.getAttribute('data-entity-id'),
        status: el.getAttribute('data-status'),
        type: el.getAttribute('data-type')
      }
    }, id)
  }

  /**
   * Query database for actual state
   */
  private async getDBState(entityType: string, id: string): Promise<unknown> {
    const query = this.getQueryForType(entityType)
    const result = await this.db.query(query, [id])
    return result.rows[0]
  }

  /**
   * Get audit log entries for an entity
   */
  private async getAuditLog(id: string): Promise<unknown> {
    const result = await this.db.query(
      'SELECT * FROM audit_logs WHERE entity_id = $1 ORDER BY created_at DESC',
      [id]
    )
    return result.rows
  }

  /**
   * Hash UI state for comparison
   */
  private async hashUIState(entityType: string, id: string): Promise<string> {
    // Implementation would compute hash of UI-visible state
    throw new Error('Not implemented - reference only')
  }

  /**
   * Hash DB state for comparison
   */
  private async hashDBState(entityType: string, id: string): Promise<string> {
    // Implementation would compute hash of DB state
    throw new Error('Not implemented - reference only')
  }

  /**
   * Verify audit log entry exists and matches operation
   */
  private async verifyAuditEntry(id: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE entity_id = $1',
      [id]
    )
    return ((result.rows[0] as any).count as number) > 0
  }

  /**
   * Get SQL query for entity type
   */
  private getQueryForType(entityType: string): string {
    const queries: Record<string, string> = {
      page: 'SELECT * FROM pages WHERE id = $1',
      post: 'SELECT * FROM posts WHERE id = $1',
      archive: 'SELECT * FROM archives WHERE id = $1'
    }
    return queries[entityType] ?? `SELECT * FROM ${entityType}s WHERE id = $1`
  }

  /**
   * Deep equality check for objects
   */
  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (typeof a !== 'object' || a === null || b === null) return false

    const keysA = Object.keys(a as Record<string, unknown>)
    const keysB = Object.keys(b as Record<string, unknown>)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!this.deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false
      }
    }

    return true
  }
}

/**
 * Database connection interface - adapt to your setup
 */
interface DatabaseConnection {
  query(sql: string, params: unknown[]): Promise<{ rows: unknown[] }>
}
