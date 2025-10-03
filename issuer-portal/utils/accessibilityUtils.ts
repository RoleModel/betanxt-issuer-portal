import type {
  ImpactValue,
  AxeResults as AxeCoreResults,
  NodeResult,
} from 'axe-core';

interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    target: string[];
    failureSummary: string;
    html: string;
  }[];
}

interface AxeResults {
  violations: AxeViolation[];
  incomplete: AxeViolation[];
}

interface GroupedViolation {
  impact: ImpactValue | undefined;
  description: string;
  help: string;
  helpUrl: string;
  type: 'violation' | 'incomplete';
  occurrences: Array<{
    target: string;
    failureSummary: string;
  }>;
}

interface ViolationSummary {
  totalViolations: number;
  totalCriticalIncomplete: number;
  totalSeriousIncomplete: number;
  impactBreakdown: Record<string, number>;
  ruleBreakdown: Record<string, number>;
}

/**
 * Determines if an incomplete issue should be treated as a violation
 * @param impact The impact level of the issue
 * @returns Whether the incomplete issue should be treated as a violation
 */
function isBlockingIncomplete(impact: ImpactValue | undefined): boolean {
  return impact === 'critical' || impact === 'serious';
}

/**
 * Converts a node's target selector to a string representation
 * @param target The target selector from axe-core
 * @returns A string representation of the target
 */
function targetToString(target: NodeResult['target']): string {
  return Array.isArray(target) ? target.join(' ') : String(target);
}

/**
 * Groups violations by their rule ID to provide a more organized view of issues
 *
 * @param accessibilityScanResults The results from an axe-core scan
 * @returns A stringified JSON representation of violations grouped by rule
 */
export function groupViolationsByRule(
  accessibilityScanResults: AxeCoreResults
): string {
  const groupedViolations = [
    ...accessibilityScanResults.violations,
    ...accessibilityScanResults.incomplete.filter((issue) =>
      isBlockingIncomplete(issue.impact)
    ),
  ].reduce<Record<string, GroupedViolation>>((acc, violation) => {
    if (!acc[violation.id]) {
      acc[violation.id] = {
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        type: accessibilityScanResults.violations.includes(violation)
          ? 'violation'
          : 'incomplete',
        occurrences: [],
      };
    }

    acc[violation.id].occurrences.push(
      ...violation.nodes.map((node) => ({
        target: targetToString(node.target),
        failureSummary: node.failureSummary || 'No failure summary available',
      }))
    );

    return acc;
  }, {});

  return JSON.stringify(groupedViolations, null, 2);
}

/**
 * Creates a summary of accessibility violations that's suitable for reporting
 *
 * @param accessibilityScanResults The results from an axe-core scan
 * @returns A stringified JSON representation of the violation summary
 */
export function createViolationSummary(
  accessibilityScanResults: AxeCoreResults
): string {
  const criticalIncomplete = accessibilityScanResults.incomplete.filter(
    (i) => i.impact === 'critical'
  );
  const seriousIncomplete = accessibilityScanResults.incomplete.filter(
    (i) => i.impact === 'serious'
  );

  const allIssues = [
    ...accessibilityScanResults.violations,
    ...criticalIncomplete,
    ...seriousIncomplete,
  ];

  const summary: ViolationSummary = {
    totalViolations: accessibilityScanResults.violations.length,
    totalCriticalIncomplete: criticalIncomplete.length,
    totalSeriousIncomplete: seriousIncomplete.length,
    impactBreakdown: allIssues.reduce<Record<string, number>>((acc, issue) => {
      if (issue.impact) {
        acc[issue.impact] = (acc[issue.impact] || 0) + 1;
      }
      return acc;
    }, {}),
    ruleBreakdown: allIssues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.id] = issue.nodes.length;
      return acc;
    }, {}),
  };

  return JSON.stringify(summary, null, 2);
}
