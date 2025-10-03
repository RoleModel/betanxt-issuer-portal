import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { NodeResult, RelatedNode } from 'axe-core'

import {
  createViolationSummary,
  groupViolationsByRule,
} from '../../utils/accessibilityUtils'
import { extractWcagCriteria } from '../../utils/wcagMapping'

const BASE_URL = 'http://localhost:3000'

// Define test URLs directly (we know these from sitemap)
const knownUrls = [
  'http://localhost:3000/WEN/meeting/wen-special-meeting-2026/dashboard/1',
]

// Only run on chromium to avoid browser multiplication issues
test.describe('Pages Accessibility Tests', () => {
  // Skip if not chromium to avoid running same tests 3x
  test.skip(({ browserName }) => browserName !== 'chromium')

  // Create individual test for each page
  for (const url of knownUrls) {
    const path = new URL(url).pathname

    test(`should be accessible: ${path}`, async ({ page }, testInfo) => {
      const startTime = Date.now()

      await page.goto(url)

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags([
          'wcag2a-obsolete',
          'wcag2a',
          'wcag2aa',
          'wcag21a',
          'wcag21aa',
          'wcag22aa',
          'wcag2aaa',
          'best-practice',
          'ACT',
          'EN-301-549',
          'TTv5',
          'section508',
        ])
        .disableRules(['color-contrast-enhanced'])
        .exclude(['.MuiCard-root.dark *'])
        .exclude(['#election-banner *'])
        .exclude('next-route-announcer') // Known MUI Select color contrast issue
        .exclude('#vote-by-notice *')
        .exclude('.MuiInputBase-input') //contrast cannot be determined because the input is not visible
        .exclude('#search-text-input') //contrast cannot be determined because the input is not visible
        .exclude('nextjs-portal') // NextJS development button
        .exclude('[data-field="document"]') // DataGrid tap target size
        .exclude('[data-field="action"]') // DataGrid tap target size
        .analyze()

      // Convert violations to a readable format for the error message
      const allIssues = [
        ...accessibilityScanResults.violations.map(
          (v) => `VIOLATION: ${v.description} (${v.impact})`
        ),
        ...accessibilityScanResults.incomplete
          .filter((i) => i.impact === 'critical' || i.impact === 'serious')
          .map((i) => `INCOMPLETE: ${i.description} (${i.impact || 'unknown'})`),
      ]

      // Generate detailed violation data using utility functions
      const violationData = {
        groupedByRule: JSON.parse(groupViolationsByRule(accessibilityScanResults)),
        summary: JSON.parse(createViolationSummary(accessibilityScanResults)),
      }

      // Prepare detailed violations for reporting
      const detailedViolations = [
        ...accessibilityScanResults.violations,
        ...accessibilityScanResults.incomplete.filter(
          (i) => i.impact === 'critical' || i.impact === 'serious'
        ),
      ].map((violation) => ({
        impact: violation.impact?.toUpperCase() || 'UNKNOWN',
        description: violation.description,
        help: violation.help,
        nodes: violation.nodes.length,
        id: violation.id,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        wcag: extractWcagCriteria(violation.tags),
        elements: violation.nodes.map((node: NodeResult) => ({
          target: Array.isArray(node.target)
            ? node.target.join(' ')
            : String(node.target),
          html: node.html || 'HTML not available',
          failureSummary: node.failureSummary || 'No specific failure details available',
          relatedNodes: [...node.any, ...node.all, ...node.none].flatMap(
            (checkResult) =>
              checkResult.relatedNodes?.map((relatedNode: RelatedNode) => ({
                target: Array.isArray(relatedNode.target)
                  ? relatedNode.target.join(' ')
                  : String(relatedNode.target),
                html: relatedNode.html || 'HTML not available',
                failureSummary: 'Related node - no failure summary available',
              })) || []
          ),
        })),
      }))

      // Log results
      if (allIssues.length === 0) {
      } else {
        // Show WCAG criteria summary
        const wcagCriteriaSummary = new Map<string, string[]>()
        ;[
          ...accessibilityScanResults.violations,
          ...accessibilityScanResults.incomplete,
        ].forEach((issue) => {
          const wcagCriteria = extractWcagCriteria(issue.tags)
          if (wcagCriteria !== 'No WCAG criteria mapped') {
            const criteria = wcagCriteria.split(', ')
            criteria.forEach((criterion) => {
              if (!wcagCriteriaSummary.has(criterion)) {
                wcagCriteriaSummary.set(criterion, [])
              }
              wcagCriteriaSummary.get(criterion)!.push(issue.id)
            })
          }
        })
      }

      // Process passed elements for the reporter
      const passedElements = accessibilityScanResults.passes.map((pass) => ({
        rule: pass.id,
        description: pass.description,
        wcag: extractWcagCriteria(pass.tags),
        helpUrl: pass.helpUrl,
        html: pass.nodes?.[0]?.html,
        target: pass.nodes?.[0]?.target,
      }))

      // Attach accessibility data for the custom reporter
      await testInfo.attach('accessibility-data', {
        body: JSON.stringify({
          title: path,
          url: `${BASE_URL}${path}`,
          path,
          violations: detailedViolations,
          passedElements, // Add this line
          violationData,
          elementsTested: accessibilityScanResults.passes.reduce(
            (sum, rule) => sum + rule.nodes.length,
            0
          ),
          testDuration: Date.now() - startTime,
        }),
        contentType: 'application/json',
      })

      // Fail test if any accessibility issues found - but data is already saved above
      expect(
        allIssues,
        `Found ${allIssues.length} accessibility issues on ${path}:\n${allIssues.join('\n')}`
      ).toHaveLength(0)
    })
  }
})
