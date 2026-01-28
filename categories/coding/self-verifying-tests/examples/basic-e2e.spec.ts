/**
 * Basic Example: Pages Collection E2E Test
 * Demonstrates self-verifying test principles
 */

import { test, expect } from '@playwright/test'

test.describe('@manifest:collections/pages: Pages Collection', () => {
  // ============================================
  // Public API Tests (from manifest.publicAPI)
  // ============================================

  test('public API: Pages collection is accessible', async ({ page }) => {
    const response = await page.request.get('/api/pages?depth=1')
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('docs')
    expect(Array.isArray(data.docs)).toBe(true)
  })

  // ============================================
  // Purpose Tests (from manifest.purpose)
  // Purpose: "Manage static pages and landing pages"
  // ============================================

  test('purpose: static pages can be created', async ({ page, request }) => {
    // Create a page via API
    const createResponse = await request.post('/api/pages', {
      data: {
        title: 'Test Page',
        slug: 'test-page-' + Date.now(),
        status: 'published'
      }
    })

    expect(createResponse.ok()).toBe(true)
    const created = await createResponse.json()
    expect(created.doc).toHaveProperty('id')

    // Verify it's accessible
    const pageResponse = await page.goto(`/test-page-${created.doc.slug}`)
    expect(pageResponse?.status()).toBe(200)
  })

  // ============================================
  // Dependency Tests (from manifest.dependencies.blocks)
  // ============================================

  test('dependencies: ArchiveBlock loads on page', async ({ page }) => {
    // Navigate to a page known to have ArchiveBlock
    await page.goto('/archive')

    const block = page.locator('[data-block="ArchiveBlock"]')
    await expect(block).toBeVisible()
  })

  // ============================================
  // Shadow Inspector: Cross-layer validation
  // ============================================

  test('shadow: page create verifies database', async ({ page }) => {
    // This test demonstrates the Shadow Inspector pattern
    // In a real implementation, you would:
    //
    // 1. Create page via UI
    // 2. Get page ID from response
    // 3. Query database directly: SELECT * FROM pages WHERE id = $1
    // 4. Verify UI state == DB state
    // 5. Verify audit log has entry

    await page.goto('/admin/pages/create')
    await page.fill('[name="title"]', 'Shadow Test Page')
    await page.click('[data-action="publish"]')

    // Wait for success toast
    await expect(page.locator('.toast-success')).toBeVisible()

    // Get created page ID (in real app, this would be from window object or API)
    const pageId = await page.evaluate(() => {
      return (window as any).lastCreatedPageId
    })

    // TODO: Add database verification here
    // const dbRecord = await db.query('SELECT * FROM pages WHERE id = $1', [pageId])
    // expect(dbRecord.status).toBe('published')
  })

  // ============================================
  // State Machine Tests
  // Pages have states: draft -> published -> archived
  // ============================================

  test('fsm: draft -> published transition is valid', async ({ page }) => {
    // Start with a draft page
    await page.goto('/admin/pages/edit/test-draft-page')

    // Verify initial state
    const initialStatus = await page.locator('[data-status]').getAttribute('data-status')
    expect(initialStatus).toBe('draft')

    // Trigger publish
    await page.click('[data-action="publish"]')

    // Verify state transition
    const newStatus = await page.locator('[data-status]').getAttribute('data-status')
    expect(newStatus).toBe('published')
  })

  test('fsm: gremlin random operations', async ({ page }) => {
    const validStates = ['draft', 'published', 'archived']
    const actions = ['save', 'publish', 'archive', 'unpublish']

    await page.goto('/admin/pages/edit/test-page')

    // Perform 20 random actions
    for (let i = 0; i < 20; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      await page.click(`[data-action="${action}"]`)

      // Always verify state is valid
      const status = await page.locator('[data-status]').getAttribute('data-status')
      expect(validStates).toContain(status)
    }
  })

  // ============================================
  // Error Boundary Tests
  // ============================================

  test('error-boundary: block failure handled gracefully', async ({ page }) => {
    // Navigate to page with blocks
    await page.goto('/test-page')

    // Simulate block failure
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mock-block-failure', {
        detail: { block: 'ArchiveBlock' }
      }))
    })

    // Error boundary should be visible
    const errorBoundary = page.locator('[data-error-boundary]')
    await expect(errorBoundary).toBeVisible()

    // Page should not crash
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/)
  })
})
