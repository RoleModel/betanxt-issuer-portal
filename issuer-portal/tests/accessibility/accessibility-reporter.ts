import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import { extractWcagCriteria } from '@/utils/wcagMapping'

interface AccessibilityViolation {
  impact: string
  description: string
  wcag: string
  help: string
  nodes: number
  id: string
  helpUrl: string
  tags: string[]
  elements: {
    target: string
    html: string
    failureSummary: string
  }[]
}

interface AccessibilityTestResult {
  title: string
  url: string
  path: string
  violations: AccessibilityViolation[]
  elementsTested: number
  testDuration: number
  error?: string
  passedElements?: {
    rule: string
    description: string
    wcag: string
    helpUrl: string
    html?: string
    target?: string | string[]
  }[]
}

interface AccessibilityResults {
  totalTests: number
  passedTests: number
  totalViolations: number
  pages: AccessibilityTestResult[]
  generatedAt: string
  summary: {
    totalPassedRules: number
    wcagCriteriaTested: string[]
    wcagCriteriaFailed: string[]
    wcagCriteriaPassed: string[]
  }
}

class AccessibilityReporter implements Reporter {
  private accessibilityResults: AccessibilityTestResult[] = []

  onTestEnd(test: TestCase, result: TestResult) {
    // Only capture results from accessibility tests
    if (!test.title.includes('should be accessible:')) return

    // Extract accessibility data from test attachments
    const accessibilityAttachment = result.attachments.find(
      (attachment) => attachment.name === 'accessibility-data'
    )

    if (accessibilityAttachment && accessibilityAttachment.body) {
      try {
        const accessibilityData = JSON.parse(accessibilityAttachment.body.toString())

        // Get passed elements from the test data
        const passedElements = accessibilityData.passedElements || []

        const testResult: AccessibilityTestResult = {
          ...accessibilityData,
          passedElements,
          // Only set error if test failed for reasons other than accessibility violations
          error:
            result.status === 'failed' && accessibilityData.violations.length === 0
              ? result.error?.message
              : undefined,
        }

        this.accessibilityResults.push(testResult)
        console.log(
          `📊 Captured accessibility data for ${accessibilityData.path} (${accessibilityData.violations.length} violations)`
        )
      } catch (error) {
        console.warn(`Failed to parse accessibility data for ${test.title}:`, error)
      }
    } else {
      console.warn(`No accessibility data attachment found for ${test.title}`)
    }
  }

  onEnd(result: FullResult) {
    // Only generate report if we have accessibility results
    if (this.accessibilityResults.length === 0) {
      console.log('📊 No accessibility test results to report')
      return
    }

    const dataDir = join(process.cwd(), 'public', 'data')
    mkdirSync(dataDir, { recursive: true })

    // Calculate enhanced statistics
    const totalPassedRules = this.accessibilityResults.reduce(
      (sum, t) => sum + (t.passedElements?.length || 0),
      0
    )

    const wcagCriteriaTested = new Set<string>()
    const wcagCriteriaFailed = new Set<string>()

    this.accessibilityResults.forEach((result) => {
      // Collect failed criteria
      result.violations.forEach((violation) => {
        const wcag = extractWcagCriteria(violation.tags)
        if (wcag !== 'No WCAG criteria mapped') {
          wcag.split(', ').forEach((criterion) => {
            wcagCriteriaTested.add(criterion)
            wcagCriteriaFailed.add(criterion)
          })
        }
      })

      // Collect passed criteria
      result.passedElements?.forEach((passed) => {
        if (passed.wcag !== 'No WCAG criteria mapped') {
          passed.wcag.split(', ').forEach((criterion) => {
            wcagCriteriaTested.add(criterion)
          })
        }
      })
    })

    const aggregatedResults: AccessibilityResults = {
      totalTests: this.accessibilityResults.length,
      passedTests: this.accessibilityResults.filter(
        (t) => !t.error && t.violations.length === 0
      ).length,
      totalViolations: this.accessibilityResults.reduce(
        (sum, t) => sum + t.violations.length,
        0
      ),
      pages: this.accessibilityResults,
      generatedAt: new Date().toISOString(),
      // Enhanced summary data
      summary: {
        totalPassedRules,
        wcagCriteriaTested: Array.from(wcagCriteriaTested).sort(),
        wcagCriteriaFailed: Array.from(wcagCriteriaFailed).sort(),
        wcagCriteriaPassed: Array.from(wcagCriteriaTested)
          .filter((c) => !wcagCriteriaFailed.has(c))
          .sort(),
      },
    }

    const resultsFilePath = join(dataDir, 'accessibility-report.json')
    writeFileSync(resultsFilePath, JSON.stringify(aggregatedResults, null, 2))

    // Enhanced console output
    console.log('\n' + '='.repeat(60))
    console.log('📊 ACCESSIBILITY REPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`📄 Total Pages Tested: ${aggregatedResults.totalTests}`)
    console.log(`✅ Pages Passed: ${aggregatedResults.passedTests}`)
    console.log(
      `❌ Pages Failed: ${aggregatedResults.totalTests - aggregatedResults.passedTests}`
    )
    console.log(`🚨 Total Violations: ${aggregatedResults.totalViolations}`)
    console.log(`✅ Total Passed Rules: ${totalPassedRules}`)
    console.log(`\n📋 WCAG Criteria:`)
    console.log(`   Tested: ${aggregatedResults.summary.wcagCriteriaTested.length}`)
    console.log(`   Passed: ${aggregatedResults.summary.wcagCriteriaPassed.length}`)
    console.log(`   Failed: ${aggregatedResults.summary.wcagCriteriaFailed.length}`)
    console.log(`\n💾 Report saved to: ${resultsFilePath}`)
    console.log('='.repeat(60) + '\n')
  }
}

export default AccessibilityReporter
