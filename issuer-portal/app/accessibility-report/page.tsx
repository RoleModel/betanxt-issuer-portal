"use client";

import {
  Box,
  Button,
  Card,
  CardActions,
  Chip,
  Collapse,
  Container,
  Divider,
  Link,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { extractWcagCriteria } from "@/utils/wcagMapping";

export interface RelatedNode {
  target: string[] | string;
  html: string;
  failureSummary: string;
}

export interface Element {
  target: string[] | string;
  html: string;
  failureSummary: string;
  relatedNodes?: RelatedNode[];
}

export interface Violation {
  impact: string;
  description: string;
  wcag: string;
  help: string;
  nodes: number;
  id?: string;
  helpUrl?: string;
  tags?: string[];
  elements?: Element[];
}

export interface PassedElement {
  rule: string;
  description: string;
  wcag: string;
  helpUrl: string;
  html?: string;
  target?: string | string[];
}

interface TestResult {
  title: string;
  url: string;
  path: string;
  violations: Violation[];
  elementsTested: number;
  testDuration: number;
  passedElements?: PassedElement[];
}

interface CriteriaSummary {
  id: string;
  name: string;
  level: string;
  totalPages: number;
  passedPages: number;
  failedPages: number;
  page: string;
  violations: {
    page: string;
    impact: string;
    description: string;
    wcag: string;
    help: string;
    helpUrl?: string;
    tags?: string[];
    id?: string;
    elements?: {
      target: string | string[];
      html: string;
      failureSummary: string;
      relatedNodes?: {
        target: string | string[];
        html: string;
        failureSummary: string;
      }[];
    }[];
  }[];
  passedRules: {
    rule: string;
    description: string;
    helpUrl: string;
    html?: string;
    target?: string | string[];
  }[];
}

interface TestResults {
  timestamp: string;
  pages?: TestResult[];
  tests?: TestResult[];
  generatedAt?: string;
}

interface AxeRule {
  ruleId: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
}

export default function AccessibilityReportPage() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [viewMode, setViewMode] = useState<"criteria" | "pages">("criteria");
  const [axeRules, setAxeRules] = useState<AxeRule[]>([]);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  // Dynamic mapping from axe-core rule IDs to WCAG criteria using axe API
  const [axeToWcagMapping, setAxeToWcagMapping] = useState<Record<string, string>>({});
  const [axeRulesData, setAxeRulesData] = useState<
    Record<string, { description: string; help: string; helpUrl: string }>
  >({});

  // Function to get axe-to-WCAG mapping based on loaded axe rules
  const getAxeToWcagMapping = (
    axeRules: AxeRule[],
  ): {
    mapping: Record<string, string>;
    rulesData: Record<string, { description: string; help: string; helpUrl: string }>;
  } => {
    const mapping: Record<string, string> = {};
    const rulesData: Record<string, { description: string; help: string; helpUrl: string }> = {};

    axeRules.forEach((rule) => {
      // Store rule data
      rulesData[rule.ruleId] = {
        description: rule.description,
        help: rule.help,
        helpUrl: rule.helpUrl,
      };

      // Find WCAG tags and convert to WCAG ID format
      const wcagCriteria = extractWcagCriteria(rule.tags);
      if (wcagCriteria !== "No WCAG criteria mapped") {
        mapping[rule.ruleId] = wcagCriteria.split(", ")[0]; // Take first criterion if multiple exist
      }
    });

    return { mapping, rulesData };
  };

  // WCAG criteria definitions
  const WCAG_CRITERIA = useMemo(
    (): Record<string, string> =>
      ({
        "1.1.1": "Non-text Content (Level A)",
        "1.3.1": "Info and Relationships (Level A)",
        "1.3.2": "Meaningful Sequence (Level A)",
        "1.3.3": "Sensory Characteristics (Level A)",
        "1.3.4": "Orientation (Level AA 2.1 and 2.2)",
        "1.3.5": "Identify Input Purpose (Level AA 2.1 and 2.2)",
        "1.4.1": "Use of Color (Level A)",
        "1.4.3": "Contrast (Minimum) (Level AA)",
        "1.4.4": "Resize text (Level AA)",
        "1.4.5": "Images of Text (Level AA)",
        "1.4.10": "Reflow (Level AA 2.1 and 2.2)",
        "1.4.11": "Non-text Contrast (Level AA 2.1 and 2.2)",
        "1.4.12": "Text Spacing (Level AA 2.1 and 2.2)",
        "1.4.13": "Content on Hover or Focus (Level AA 2.1 and 2.2)",
        "2.1.1": "Keyboard (Level A)",
        "2.1.2": "No Keyboard Trap (Level A)",
        "2.1.4": "Character Key Shortcuts (Level A 2.1 and 2.2)",
        "2.2.1": "Timing Adjustable (Level A)",
        "2.2.2": "Pause, Stop, Hide (Level A)",
        "2.3.1": "Three Flashes or Below Threshold (Level A)",
        "2.4.1": "Bypass Blocks (Level A)",
        "2.4.11": "Focus Not Obscured (Minimum) (Level AA 2.2 only)",
        "2.4.2": "Page Titled (Level A)",
        "2.4.3": "Focus Order (Level A)",
        "2.4.4": "Link Purpose (In Context) (Level A)",
        "2.4.5": "Multiple Ways (Level AA)",
        "2.4.6": "Headings and Labels (Level AA)",
        "2.4.7": "Focus Visible (Level AA)",
        "2.5.1": "Pointer Gestures (Level A 2.1 and 2.2)",
        "2.5.2": "Pointer Cancellation (Level A 2.1 and 2.2)",
        "2.5.3": "Label in Name (Level A 2.1 and 2.2)",
        "2.5.4": "Motion Actuation (Level A 2.1 and 2.2)",
        "2.5.7": "Dragging Movements (Level AA 2.2 only)",
        "2.5.8": "Target Size (Minimum) (Level AA 2.2 only)",
        "3.1.1": "Language of Page (Level A)",
        "3.1.2": "Language of Parts (Level AA)",
        "3.2.1": "On Focus (Level A)",
        "3.2.2": "On Input (Level A)",
        "3.2.3": "Consistent Navigation (Level AA)",
        "3.2.4": "Consistent Identification (Level AA)",
        "3.2.6": "Consistent Help (Level A 2.2 only)",
        "3.3.1": "Error Identification (Level A)",
        "3.3.2": "Labels or Instructions (Level A)",
        "3.3.3": "Error Suggestion (Level AA)",
        "3.3.4": "Error Prevention (Legal, Financial, Data) (Level AA)",
        "3.3.7": "Redundant Entry (Level A 2.2 only)",
        "3.3.8": "Accessible Authentication (Minimum) (Level AA 2.2 only)",
        "4.1.1": "Parsing (Level A)",
        "4.1.2": "Name, Role, Value (Level A)",
        "4.1.3": "Status Messages (Level AA 2.1 and 2.2)",
      }) as const,
    [],
  );

  // WCAG 2.1 specification URL mappings
  const WCAG_SPEC_URLS = useMemo(
    (): Record<string, string> =>
      ({
        "1.1.1": "non-text-content",
        "1.3.1": "info-and-relationships",
        "1.3.2": "meaningful-sequence",
        "1.3.3": "sensory-characteristics",
        "1.3.4": "orientation",
        "1.3.5": "identify-input-purpose",
        "1.4.1": "use-of-color",
        "1.4.3": "contrast-minimum",
        "1.4.4": "resize-text",
        "1.4.5": "images-of-text",
        "1.4.10": "reflow",
        "1.4.11": "non-text-contrast",
        "1.4.12": "text-spacing",
        "1.4.13": "content-on-hover-or-focus",
        "2.1.1": "keyboard",
        "2.1.2": "no-keyboard-trap",
        "2.1.4": "character-key-shortcuts",
        "2.2.1": "timing-adjustable",
        "2.2.2": "pause-stop-hide",
        "2.3.1": "three-flashes-or-below-threshold",
        "2.4.1": "bypass-blocks",
        "2.4.2": "page-titled",
        "2.4.3": "focus-order",
        "2.4.4": "link-purpose-in-context",
        "2.4.5": "multiple-ways",
        "2.4.6": "headings-and-labels",
        "2.4.7": "focus-visible",
        "2.4.11": "focus-not-obscured-minimum",
        "2.5.1": "pointer-gestures",
        "2.5.2": "pointer-cancellation",
        "2.5.3": "label-in-name",
        "2.5.4": "motion-actuation",
        "2.5.7": "dragging-movements",
        "2.5.8": "target-size-minimum",
        "3.1.1": "language-of-page",
        "3.1.2": "language-of-parts",
        "3.2.1": "on-focus",
        "3.2.2": "on-input",
        "3.2.3": "consistent-navigation",
        "3.2.4": "consistent-identification",
        "3.2.6": "consistent-help",
        "3.3.1": "error-identification",
        "3.3.2": "labels-or-instructions",
        "3.3.3": "error-suggestion",
        "3.3.4": "error-prevention-legal-financial-data",
        "3.3.7": "redundant-entry",
        "3.3.8": "accessible-authentication-minimum",
        "4.1.1": "parsing",
        "4.1.2": "name-role-value",
        "4.1.3": "status-messages",
      }) as const,
    [],
  );

  // Load accessibility report data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportResponse, rulesResponse] = await Promise.all([
          fetch("/data/accessibility-report.json"),
          fetch("/data/axe-rules.json"),
        ]);

        if (!reportResponse.ok || !rulesResponse.ok) {
          throw new Error("Failed to load required data");
        }

        const reportData = await reportResponse.json();

        const rulesData = await rulesResponse.json();
        // Handle both 'tests' and 'pages' keys
        const normalizedData = {
          ...reportData,
          pages: reportData.pages || reportData.tests || [],
        };

        setResults(normalizedData);
        setAxeRules(rulesData);
      } catch {
        setResults({
          timestamp: new Date().toISOString(),
          pages: [],
        });
      }
    };

    void loadData();
  }, []);

  // Build WCAG mapping and rule data from axe rules
  const buildAxeToWcagMapping = useCallback(() => {
    if (axeRules.length > 0) {
      const { mapping, rulesData } = getAxeToWcagMapping(axeRules);
      setAxeToWcagMapping(mapping);
      setAxeRulesData(rulesData);
    }
  }, [axeRules]);

  // Update mapping when axe rules are loaded
  useEffect(() => {
    buildAxeToWcagMapping();
  }, [axeRules, buildAxeToWcagMapping]);

  const getCriteriaLevel = (id: string): string => {
    // Level A criteria
    const levelA = [
      "1.1.1",
      "1.3.1",
      "1.3.2",
      "1.3.3",
      "1.4.1",
      "2.1.1",
      "2.1.2",
      "2.1.4",
      "2.2.1",
      "2.2.2",
      "2.3.1",
      "2.4.1",
      "2.4.2",
      "2.4.3",
      "2.4.4",
      "2.5.1",
      "2.5.2",
      "2.5.3",
      "2.5.4",
      "3.1.1",
      "3.2.1",
      "3.2.2",
      "3.2.6",
      "3.3.1",
      "3.3.2",
      "3.3.7",
      "4.1.1",
      "4.1.2",
    ];

    // Level AA criteria
    const levelAA = [
      "1.3.4",
      "1.3.5",
      "1.4.3",
      "1.4.4",
      "1.4.5",
      "1.4.10",
      "1.4.11",
      "1.4.12",
      "1.4.13",
      "2.4.5",
      "2.4.6",
      "2.4.7",
      "2.4.11",
      "2.5.7",
      "2.5.8",
      "3.1.2",
      "3.2.3",
      "3.2.4",
      "3.3.3",
      "3.3.4",
      "3.3.8",
      "4.1.3",
    ];

    if (levelA.includes(id)) {
      return "A";
    } else if (levelAA.includes(id)) {
      return "AA";
    }

    return "AA"; // Default to AA for unknown criteria
  };

  const getCriteriaDescription = (
    wcagId: string,
    violations: CriteriaSummary["violations"],
  ): string => {
    // For violations, show the specific axe rule description
    if (violations && violations.length > 0) {
      const axeRuleId = Object.keys(axeToWcagMapping).find(
        (ruleId) => axeToWcagMapping[ruleId] === wcagId,
      );
      if (axeRuleId && axeRulesData[axeRuleId]) {
        return axeRulesData[axeRuleId].help;
      }
    }

    // Don't show descriptions for passing criteria - move to collapsible section
    return ``;
  };

  // Helper function to check if a WCAG criterion has been tested
  const isCriterionTested = (wcagId: string): boolean => {
    const relevantAxeRules = Object.keys(axeToWcagMapping).filter(
      (ruleId) => axeToWcagMapping[ruleId] === wcagId,
    );
    return relevantAxeRules.length > 0;
  };

  // Function to toggle expanded rules view
  const toggleRulesExpanded = (criteriaId: string) => {
    setExpandedRules((prev) => ({
      ...prev,
      [criteriaId]: !prev[criteriaId],
    }));
  };

  const generateCriteriaSummary = useCallback(
    (testResults: TestResults): CriteriaSummary[] => {
      const pages = testResults.pages || [];
      const criteriaMap = new Map<string, CriteriaSummary>();

      // Initialize all criteria
      Object.keys(WCAG_CRITERIA).forEach((id) => {
        const urlSlug = WCAG_SPEC_URLS[id] || id;
        criteriaMap.set(id, {
          id,
          page: `https://www.w3.org/WAI/${id === "2.4.11" || id === "2.5.7" || id === "2.5.8" || id === "3.2.6" || id === "3.3.7" || id === "3.3.8" ? "WCAG22" : "WCAG21"}/Understanding/${urlSlug}.html`,
          name: WCAG_CRITERIA[id],
          level: getCriteriaLevel(id),
          totalPages: pages.length,
          passedPages: 0,
          failedPages: 0,
          violations: [],
          passedRules: [],
        });
      });

      // Track which pages failed for each criteria
      const failedPagesPerCriteria = new Map<string, Set<string>>();

      // Process violations and passed elements
      pages.forEach((test) => {
        // Process violations
        test.violations.forEach((violation) => {
          if (violation.id) {
            const wcagId = axeToWcagMapping[violation.id];
            if (wcagId) {
              const criteria = criteriaMap.get(wcagId);
              if (criteria) {
                if (!failedPagesPerCriteria.has(wcagId)) {
                  failedPagesPerCriteria.set(wcagId, new Set());
                }
                failedPagesPerCriteria.get(wcagId)!.add(test.path);

                const wcagCriteria = violation.tags
                  ? extractWcagCriteria(violation.tags)
                  : "No WCAG criteria mapped";

                criteria.violations.push({
                  page: test.path,
                  impact: violation.impact,
                  description: violation.description,
                  wcag: wcagCriteria,
                  help: violation.help,
                  helpUrl: violation.helpUrl,
                  tags: violation.tags,
                  id: violation.id,
                  elements: violation.elements,
                });
              }
            }
          }
        });

        // Process passed elements
        test.passedElements?.forEach((passed) => {
          if (passed.rule) {
            const wcagId = axeToWcagMapping[passed.rule];
            if (wcagId) {
              const criteria = criteriaMap.get(wcagId);
              if (criteria) {
                // Add to passed rules if not already present
                const existingRule = criteria.passedRules.find((r) => r.rule === passed.rule);
                if (!existingRule) {
                  criteria.passedRules.push({
                    rule: passed.rule,
                    description: passed.description,
                    helpUrl: passed.helpUrl,
                    html: passed.html,
                    target: passed.target,
                  });
                }
              }
            }
          }
        });
      });

      // Calculate final pass/fail counts for each criteria
      criteriaMap.forEach((criteria, id) => {
        const failedPages = failedPagesPerCriteria.get(id);
        criteria.failedPages = failedPages ? failedPages.size : 0;
        criteria.passedPages = criteria.totalPages - criteria.failedPages;
      });

      return Array.from(criteriaMap.values()).sort((a, b) => {
        const aParts = a.id.split(".").map(Number);
        const bParts = b.id.split(".").map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aPart = aParts[i] ?? 0;
          const bPart = bParts[i] ?? 0;

          if (aPart !== bPart) {
            return aPart - bPart;
          }
        }

        return 0;
      });
    },
    [WCAG_CRITERIA, WCAG_SPEC_URLS, axeToWcagMapping],
  );

  // Function to get color scheme for impact levels
  const getImpactColorScheme = (impact: string) => {
    switch (impact.toUpperCase()) {
      case "CRITICAL":
        return {
          chipColor: "error" as const,
          borderColor: "error.dark",
          textColor: "error.dark",
        };
      case "SERIOUS":
        return {
          chipColor: "warning" as const,
          borderColor: "warning.dark",
          textColor: "warning.dark",
        };
      case "Incomplete":
        return {
          chipColor: "info" as const,
          borderColor: "info.main",
          textColor: "info.dark",
        };
      default:
        return {
          chipColor: "default" as const,
          borderColor: "text.primary",
          textColor: "text.secondary",
        };
    }
  };

  // Function to get display text for impact levels
  const getImpactDisplayText = (impact: string, description: string) => {
    if (impact.toUpperCase() === "Incomplete") {
      // Clean up the description for Incomplete results
      const cleanDescription = description.replace(/^Incomplete:\s*/i, "").trim();
      return {
        impact: "Needs Review",
        description: `Review Required: ${cleanDescription}`,
        prefix: "⚠️",
      };
    }
    return {
      impact: impact.toUpperCase(),
      description,
      prefix:
        impact.toUpperCase() === "CRITICAL"
          ? "🚨"
          : impact.toUpperCase() === "SERIOUS"
            ? "⚠️"
            : "❓",
    };
  };

  if (!results?.pages) {
    return (
      <Container>
        <Typography>Loading accessibility report...</Typography>
      </Container>
    );
  }

  const pages = results.pages || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Typography variant="pageTitle" component="h1" gutterBottom>
          Accessibility Report
        </Typography>
        {/* Last Updated */}
        <Typography variant="body3" color="text.secondary" gutterBottom>
          Last updated: {new Date(results.timestamp).toLocaleString()}
        </Typography>

        {/* Summary Stats */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="h4" color="primary">
              {pages.length}
            </Typography>
            <Typography variant="body3" color="text.secondary">
              Pages Tested
            </Typography>
          </Card>
          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography
              variant="h4"
              color={
                pages.every((test: TestResult) => test.violations.length === 0)
                  ? "success.main"
                  : "warning.dark"
              }
            >
              {pages.length - pages.filter((test: TestResult) => test.violations.length > 0).length}
            </Typography>
            <Typography variant="body3" color="text.secondary">
              Pages Passed
            </Typography>
          </Card>
          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography
              variant="h4"
              color={
                pages.some((test: TestResult) => test.violations.length > 0)
                  ? "error.dark"
                  : "success.main"
              }
            >
              {pages.reduce((total: number, test: TestResult) => total + test.violations.length, 0)}
            </Typography>
            <Typography variant="body3" color="text.secondary">
              Total Issues
            </Typography>
          </Card>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* View Toggle and Download */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_event, newValue) => setViewMode(newValue)}
            sx={{ cursor: "pointer" }}
          >
            <ToggleButton value="criteria" sx={{ cursor: "pointer" }}>
              View By Criteria
            </ToggleButton>
            <ToggleButton value="pages" sx={{ cursor: "pointer" }}>
              View By Page
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Results */}
        <Stack spacing={2}>
          {pages.length === 0 ? (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Typography variant="body3" fontWeight="500" gutterBottom>
                No Test Results Available
              </Typography>
              <Typography variant="body3" color="text.secondary">
                Accessibility tests haven&apos;t been run yet or no results were generated. Tests
                are typically run during the build process.
              </Typography>
            </Card>
          ) : viewMode === "criteria" ? (
            // Criteria Summary View - Show each WCAG criteria with description and violations
            Object.keys(axeToWcagMapping).length > 0 ? (
              generateCriteriaSummary(results).map((criteria) => (
                <Card variant="outlined" key={criteria.id} sx={{ p: 2 }}>
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body3" sx={{ fontWeight: 500, flexGrow: 1 }}>
                        WCAG {criteria.id}:&nbsp;
                        <Link href={criteria.page} target="_blank">
                          {criteria.name}
                        </Link>
                      </Typography>
                      {isCriterionTested(criteria.id) && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => toggleRulesExpanded(criteria.id)}
                        >
                          {expandedRules[criteria.id] ? "Hide Rules" : "View Rules"}
                        </Button>
                      )}
                      <Chip
                        label={`Level ${criteria.level}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={
                          !isCriterionTested(criteria.id)
                            ? "Not Tested"
                            : criteria.failedPages === 0
                              ? "Pass"
                              : criteria.violations.every(
                                    (v) => v.impact.toUpperCase() === "Incomplete",
                                  )
                                ? "Needs Review"
                                : "Fail"
                        }
                        size="small"
                        color={
                          !isCriterionTested(criteria.id)
                            ? "default"
                            : criteria.failedPages === 0
                              ? "success"
                              : criteria.violations.every(
                                    (v) => v.impact.toUpperCase() === "Incomplete",
                                  )
                                ? "info"
                                : "error"
                        }
                      />
                    </Box>

                    {/* Criteria Description */}
                    {getCriteriaDescription(criteria.id, criteria.violations || []) && (
                      <Typography
                        variant="body3"
                        component="pre"
                        sx={{
                          mb: 2,
                          color: "text.secondary",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                        }}
                      >
                        {getCriteriaDescription(criteria.id, criteria.violations || [])}
                      </Typography>
                    )}

                    {/* View Rules Button - only show if criterion is tested */}
                    {isCriterionTested(criteria.id) && (
                      <Collapse in={expandedRules[criteria.id]}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body3" gutterBottom sx={{ fontWeight: 500 }}>
                          Axe Rules Testing This Criterion:
                        </Typography>
                        <Stack spacing={1}>
                          {Object.keys(axeToWcagMapping)
                            .filter((ruleId) => axeToWcagMapping[ruleId] === criteria.id)
                            .map((ruleId) => {
                              // Check if this rule passed
                              const passedRule = criteria.passedRules.find(
                                (r) => r.rule === ruleId,
                              );
                              const ruleData = axeRulesData[ruleId];

                              if (!ruleData) return null;

                              return (
                                <Box
                                  key={ruleId}
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: "background.default",
                                    border: "1px solid",
                                    borderColor: passedRule ? "success.main" : "divider",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body3"
                                      sx={{
                                        color: passedRule ? "success.dark" : "text.primary",
                                        flex: 1,
                                      }}
                                    >
                                      {ruleData.helpUrl ? (
                                        <Link
                                          href={ruleData.helpUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={{
                                            textDecoration: "none",
                                            "&:hover": {
                                              textDecoration: "underline",
                                            },
                                          }}
                                        >
                                          {ruleData.description}
                                        </Link>
                                      ) : (
                                        ruleData.description
                                      )}
                                    </Typography>
                                    {passedRule && (
                                      <Chip
                                        label="Passed"
                                        size="small"
                                        color="success"
                                        sx={{ height: "20px" }}
                                      />
                                    )}
                                  </Box>

                                  {/* Show HTML elements for passed rules */}
                                  {passedRule &&
                                    (passedRule.target !== undefined ||
                                      passedRule.html !== undefined) && (
                                      <Box sx={{ mt: 1 }}>
                                        {passedRule.target !== undefined && (
                                          <Typography variant="body3" sx={{ mb: 0.5 }}>
                                            <strong>Selector:</strong>{" "}
                                            <code
                                              style={{
                                                backgroundColor:
                                                  "var(--mui-palette-action-selected)",
                                                color: "var(--mui-palette-text-primary)",
                                                padding: "2px 4px",
                                                borderRadius: "3px",
                                                fontSize: "0.85em",
                                                fontFamily: "monospace",
                                              }}
                                            >
                                              {Array.isArray(passedRule.target)
                                                ? passedRule.target.join(", ")
                                                : passedRule.target}
                                            </code>
                                          </Typography>
                                        )}
                                        {passedRule.html !== undefined && (
                                          <>
                                            <Typography variant="body3" sx={{ mb: 0.5 }}>
                                              <strong>Element HTML:</strong>
                                            </Typography>
                                            <Box
                                              component="pre"
                                              sx={{
                                                backgroundColor:
                                                  "var(--mui-palette-action-selected)",
                                                color: "var(--mui-palette-text-primary)",
                                                padding: 1,
                                                borderRadius: 1,
                                                overflow: "auto",
                                                fontSize: "0.85em",
                                                fontFamily: "monospace",
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-all",
                                              }}
                                            >
                                              {passedRule.html}
                                            </Box>
                                          </>
                                        )}
                                      </Box>
                                    )}
                                </Box>
                              );
                            })}
                        </Stack>
                      </Collapse>
                    )}
                  </Box>

                  {/* Violations Section */}
                  {criteria.violations && criteria.violations.length > 0 ? (
                    <Box>
                      <Typography variant="body3" fontWeight="500" sx={{ mb: 2 }}>
                        Violations ({criteria.violations?.length ?? 0}):
                      </Typography>
                      <Stack spacing={2}>
                        {criteria.violations.map((violation, vIndex) => (
                          <Box
                            key={vIndex}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            {/* Page and Impact */}
                            <Box sx={{ mb: 2 }}>
                              <Link
                                href={violation.page}
                                sx={{
                                  fontWeight: 500,
                                }}
                              >
                                {violation.page}
                              </Link>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Chip
                                  label={
                                    getImpactDisplayText(violation.impact, violation.description)
                                      .impact
                                  }
                                  color={getImpactColorScheme(violation.impact).chipColor}
                                  size="small"
                                />
                                <Chip
                                  label={
                                    violation.tags
                                      ? extractWcagCriteria(violation.tags)
                                      : "No WCAG criteria mapped"
                                  }
                                  size="small"
                                />
                                {violation.id && (
                                  <Chip label={violation.id} variant="outlined" size="small" />
                                )}
                              </Stack>
                            </Box>

                            {/* Issue Description */}
                            <Typography variant="body3" fontWeight="500" sx={{ mb: 1 }}>
                              {
                                getImpactDisplayText(violation.impact, violation.description)
                                  .description
                              }
                            </Typography>

                            {/* Help Text */}
                            <Typography variant="body3" color="text.secondary" sx={{ mb: 2 }}>
                              {violation.help}
                            </Typography>
                            {/* Help URL */}
                            {violation.helpUrl && (
                              <Typography variant="body3">
                                <Link
                                  href={violation.helpUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {violation.helpUrl}
                                </Link>
                              </Typography>
                            )}

                            {/* Element Details */}
                            {violation.elements && violation.elements.length > 0 && (
                              <Box
                                sx={{
                                  mt: 2,
                                  mb: 2,
                                }}
                              >
                                {violation.elements.map((element, eIndex) => (
                                  <Box
                                    key={eIndex}
                                    sx={{
                                      mb: 2,
                                      p: 2,
                                      bgcolor: "var(--mui-palette-background-default)",
                                      color: "var(--mui-palette-common-onBackground)",
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "divider",
                                    }}
                                  >
                                    <Typography
                                      variant="body3"
                                      sx={{
                                        mb: 1,
                                        color: getImpactColorScheme(violation.impact).textColor,
                                      }}
                                    >
                                      <strong>
                                        {getImpactDisplayText(
                                          violation.impact,
                                          violation.description,
                                        ).impact === "Needs Review"
                                          ? "Review needed:"
                                          : "How it violates accessibility:"}
                                      </strong>{" "}
                                      {element.failureSummary}
                                    </Typography>
                                    <Typography variant="body3" sx={{ mb: 1 }}>
                                      <strong>Selector:</strong>{" "}
                                      <code
                                        style={{
                                          backgroundColor: "var(--mui-palette-action-selected)",
                                          color: "var(--mui-palette-text-primary)",
                                          padding: "2px 4px",
                                          borderRadius: "3px",
                                          fontSize: "0.85em",
                                          fontFamily: "monospace",
                                        }}
                                      >
                                        {Array.isArray(element.target)
                                          ? element.target.join(", ")
                                          : element.target}
                                      </code>
                                    </Typography>
                                    <Typography variant="body3" sx={{ mb: 1 }}>
                                      <strong>HTML:</strong>{" "}
                                      <code
                                        style={{
                                          backgroundColor: "var(--mui-palette-action-selected)",
                                          color: "var(--mui-palette-text-primary)",
                                          padding: "2px 4px",
                                          borderRadius: "3px",
                                          fontSize: "0.85em",
                                          fontFamily: "monospace",
                                        }}
                                      >
                                        {Array.isArray(element.html) ? element.html : element.html}
                                      </code>
                                    </Typography>
                                    {element.relatedNodes && element.relatedNodes.length > 0 && (
                                      <Box sx={{ mt: 1, mb: 1 }}>
                                        <Typography variant="body3" sx={{ fontWeight: 500 }}>
                                          Related Nodes ({element.relatedNodes.length}):
                                        </Typography>
                                        <Stack spacing={1}>
                                          {element.relatedNodes.map((node: RelatedNode, rIndex) => (
                                            <Box key={rIndex} sx={{ pl: 2 }}>
                                              <Typography variant="body3" sx={{ mb: 0.5 }}>
                                                <strong>Target:</strong>{" "}
                                                <code
                                                  style={{
                                                    backgroundColor:
                                                      "var(--mui-palette-action-selected)",
                                                    color: "var(--mui-palette-text-primary)",
                                                    padding: "2px 4px",
                                                    borderRadius: "3px",
                                                    fontSize: "0.85em",
                                                    fontFamily: "monospace",
                                                  }}
                                                >
                                                  {Array.isArray(node.target)
                                                    ? node.target.join(", ")
                                                    : node.target}
                                                </code>
                                              </Typography>
                                              {node.html && (
                                                <Box
                                                  component="pre"
                                                  sx={{
                                                    backgroundColor:
                                                      "var(--mui-palette-action-selected)",
                                                    color: "var(--mui-palette-text-primary)",
                                                    padding: 1,
                                                    borderRadius: 1,
                                                    overflow: "auto",
                                                    fontSize: "0.85em",
                                                    fontFamily: "monospace",
                                                    whiteSpace: "pre-wrap",
                                                    wordBreak: "break-all",
                                                    mt: 0.5,
                                                  }}
                                                >
                                                  {node.html}
                                                </Box>
                                              )}
                                            </Box>
                                          ))}
                                        </Stack>
                                      </Box>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : isCriterionTested(criteria.id) ? (
                    <Typography variant="body3" color="success.main" sx={{ fontWeight: 500 }}>
                      ✓ No accessibility issues found
                    </Typography>
                  ) : (
                    isCriterionTested(criteria.id) && (
                      <CardActions>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => toggleRulesExpanded(criteria.id)}
                        >
                          {expandedRules[criteria.id] ? "Hide Rules" : "View Rules"}
                        </Button>
                      </CardActions>
                    )
                  )}
                </Card>
              ))
            ) : (
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="body3" fontWeight="500" gutterBottom>
                  Loading Criteria Analysis...
                </Typography>
                <Typography variant="body3" color="text.secondary">
                  Please wait while we analyze WCAG compliance data.
                </Typography>
              </Card>
            )
          ) : (
            // Page-by-Page View (original)
            pages.map((test, index) => (
              <Card variant="outlined" key={index} sx={{ p: 2 }}>
                <Typography variant="body3" fontWeight="500" gutterBottom>
                  <Link href={test.path} sx={{ textDecoration: "underline" }}>
                    {test.path}
                  </Link>
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body3" color="text.secondary">
                    Elements tested: {test.elementsTested} • Test duration: {test.testDuration}ms
                  </Typography>
                </Box>

                {test.violations.length === 0 ? (
                  <Typography variant="body3" color="success.main" sx={{ fontWeight: 500 }}>
                    ✓ No accessibility issues found
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {test.violations.map((violation, vIndex) => (
                      <Box
                        key={vIndex}
                        sx={{
                          p: 3,
                          borderLeft: "4px solid",
                          borderColor:
                            violation.impact === "CRITICAL"
                              ? "error.dark"
                              : violation.impact === "SERIOUS"
                                ? "warning.dark"
                                : violation.impact.toUpperCase() === "Incomplete"
                                  ? "info.main"
                                  : "grey.300",
                          bgcolor: "background.default",
                          borderRadius: "0 4px 4px 0",
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip
                            label={
                              getImpactDisplayText(violation.impact, violation.description).impact
                            }
                            color={getImpactColorScheme(violation.impact).chipColor}
                            size="small"
                          />
                          <Chip
                            label={
                              violation.tags
                                ? extractWcagCriteria(violation.tags)
                                : "No WCAG criteria mapped"
                            }
                            size="small"
                          />
                          {violation.id && (
                            <Chip label={violation.id} variant="outlined" size="small" />
                          )}
                        </Stack>

                        <Typography variant="body3" fontWeight="500" gutterBottom>
                          {
                            getImpactDisplayText(violation.impact, violation.description)
                              .description
                          }
                        </Typography>

                        <Typography variant="body3" color="text.secondary" sx={{ mb: 2 }}>
                          {violation.help}
                        </Typography>

                        {violation.helpUrl && (
                          <Typography variant="body3" sx={{ mb: 2 }}>
                            <strong>Learn more:</strong>{" "}
                            <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer">
                              {violation.helpUrl}
                            </a>
                          </Typography>
                        )}

                        {violation.elements && violation.elements.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              sx={{ fontWeight: 500, color: "text.primary" }}
                            >
                              {violation.impact?.toUpperCase() === "Incomplete"
                                ? "Elements to Review"
                                : "Failing Elements"}{" "}
                              ({violation.elements.length} of {violation.nodes}):
                            </Typography>
                            <Stack spacing={2}>
                              {violation.elements.map((element, eIndex) => (
                                <Box
                                  key={eIndex}
                                  sx={{
                                    p: 2,
                                    bgcolor: "background.Card",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                >
                                  <Typography variant="body3" sx={{ mb: 1 }}>
                                    <strong>Element #{eIndex + 1} - Selector:</strong>{" "}
                                    <code
                                      style={{
                                        backgroundColor: "var(--mui-palette-action-selected)",
                                        color: "var(--mui-palette-text-primary)",
                                        padding: "2px 4px",
                                        borderRadius: "3px",
                                        fontSize: "0.85em",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {Array.isArray(element.target)
                                        ? element.target.join(", ")
                                        : element.target}
                                    </code>
                                  </Typography>

                                  <Typography
                                    variant="body3"
                                    sx={{
                                      mb: 1,
                                      color: getImpactColorScheme(violation.impact).textColor,
                                    }}
                                  >
                                    <strong>
                                      {violation.impact?.toUpperCase() === "Incomplete"
                                        ? "Review needed:"
                                        : "Violation:"}
                                    </strong>{" "}
                                    {element.failureSummary}
                                  </Typography>

                                  <Typography variant="body3">
                                    <strong>Element HTML:</strong>
                                  </Typography>
                                  <Box
                                    component="pre"
                                    sx={{
                                      "&::first-letter": {
                                        textTransform: "uppercase",
                                      },
                                      backgroundColor: "var(--mui-palette-action-selected)",
                                      color: "var(--mui-palette-text-primary)",
                                      padding: 1,
                                      borderRadius: 1,
                                      overflow: "auto",
                                      fontSize: "0.85em",
                                      fontFamily: "monospace",
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-all",
                                      mt: 0.5,
                                    }}
                                  >
                                    {element.html}
                                  </Box>
                                  {element.relatedNodes && element.relatedNodes.length > 0 && (
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                      <Typography variant="body3" sx={{ fontWeight: 500 }}>
                                        Related Nodes ({element.relatedNodes.length}):
                                      </Typography>
                                      <Stack spacing={1}>
                                        {element.relatedNodes.map((node: RelatedNode, rIndex) => (
                                          <Box key={rIndex} sx={{ pl: 2 }}>
                                            <Typography variant="body3" sx={{ mb: 0.5 }}>
                                              <strong>Target:</strong>{" "}
                                              <code
                                                style={{
                                                  backgroundColor:
                                                    "var(--mui-palette-action-selected)",
                                                  color: "var(--mui-palette-text-primary)",
                                                  padding: "2px 4px",
                                                  borderRadius: "3px",
                                                  fontSize: "0.85em",
                                                  fontFamily: "monospace",
                                                }}
                                              >
                                                {Array.isArray(node.target)
                                                  ? node.target.join(", ")
                                                  : node.target}
                                              </code>
                                            </Typography>
                                            {node.html && (
                                              <Box
                                                component="pre"
                                                sx={{
                                                  backgroundColor:
                                                    "var(--mui-palette-action-selected)",
                                                  color: "var(--mui-palette-text-primary)",
                                                  padding: 1,
                                                  borderRadius: 1,
                                                  overflow: "auto",
                                                  fontSize: "0.85em",
                                                  fontFamily: "monospace",
                                                  whiteSpace: "pre-wrap",
                                                  wordBreak: "break-all",
                                                  mt: 0.5,
                                                }}
                                              >
                                                {node.html}
                                              </Box>
                                            )}
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                              {violation.nodes > (violation.elements?.length ?? 0) && (
                                <Typography
                                  variant="body3"
                                  color="text.secondary"
                                  sx={{ fontStyle: "italic" }}
                                >
                                  ... and {violation.nodes - (violation.elements?.length ?? 0)} more
                                  similar elements
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        )}

                        {violation.tags && violation.tags.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body3">
                              <strong>WCAG Criteria:</strong> {extractWcagCriteria(violation.tags)}
                            </Typography>
                            {violation.tags.some((tag) => !tag.startsWith("wcag")) && (
                              <Typography variant="body3" sx={{ mt: 1 }}>
                                <strong>Other Tags:</strong>{" "}
                                {violation.tags.filter((tag) => !tag.startsWith("wcag")).join(", ")}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Card>
            ))
          )}
        </Stack>
      </Box>
    </Container>
  );
}
