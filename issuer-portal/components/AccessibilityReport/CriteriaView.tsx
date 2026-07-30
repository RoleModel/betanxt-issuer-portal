import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import ViolationCard from "./ViolationCard";

interface PassedRule {
  rule: string;
  description: string;
  helpUrl: string;
  html?: string;
  target?: string | string[];
}

interface ViolationItem {
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
}

interface CriteriaSummary {
  id: string;
  name: string;
  level: string;
  totalPages: number;
  passedPages: number;
  failedPages: number;
  page: string;
  violations: ViolationItem[];
  passedRules: PassedRule[];
}

interface CriteriaViewProps {
  criteriaSummary: CriteriaSummary[];
  axeRulesData: Record<
    string,
    { description: string; help: string; helpUrl: string }
  >;
  axeToWcagMapping: Record<string, string>;
}

const CriteriaView = ({
  criteriaSummary,
  axeRulesData,
  axeToWcagMapping,
}: CriteriaViewProps) => {
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>(
    {}
  );

  const toggleRulesExpanded = (criteriaId: string) => {
    setExpandedRules((prev) => ({
      ...prev,
      [criteriaId]: !prev[criteriaId],
    }));
  };

  const isCriterionTested = (wcagId: string): boolean => {
    const relevantAxeRules = Object.keys(axeToWcagMapping).filter(
      (ruleId) => axeToWcagMapping[ruleId] === wcagId
    );
    return relevantAxeRules.length > 0;
  };

  return (
    <Stack spacing={2}>
      {criteriaSummary.map((criteria) => (
        <Card variant="outlined" key={criteria.id} sx={{ p: 2 }}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
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
                            (v) => v.impact.toUpperCase() === "INCOMPLETE"
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
                            (v) => v.impact.toUpperCase() === "INCOMPLETE"
                          )
                        ? "info"
                        : "error"
                }
              />
            </Box>

            {/* Rules expansion */}
            {isCriterionTested(criteria.id) && (
              <Collapse in={expandedRules[criteria.id]}>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="body3"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  Axe Rules Testing This Criterion:
                </Typography>
                <Stack spacing={1}>
                  {Object.keys(axeToWcagMapping)
                    .filter(
                      (ruleId) => axeToWcagMapping[ruleId] === criteria.id
                    )
                    .map((ruleId) => {
                      const passedRule = criteria.passedRules.find(
                        (r) => r.rule === ruleId
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
                            bgcolor: passedRule
                              ? "success.light"
                              : "transparent",
                            border: "1px solid",
                            borderColor: passedRule
                              ? "success.main"
                              : "divider",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {passedRule && (
                              <Typography
                                variant="body3"
                                sx={{
                                  color: "success.main",
                                  fontWeight: 500,
                                  minWidth: "24px",
                                }}
                              >
                                ✓
                              </Typography>
                            )}
                            <Typography
                              variant="body3"
                              sx={{
                                color: passedRule
                                  ? "success.dark"
                                  : "text.primary",
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
                                    "&:hover": { textDecoration: "underline" },
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
                        </Box>
                      );
                    })}
                </Stack>
              </Collapse>
            )}
          </Box>

          {/* Violations Section */}
          {criteria.violations && criteria.violations.length > 0 && (
            <Box>
              <Typography variant="body3" fontWeight="500" sx={{ mb: 2 }}>
                Violations ({criteria.violations.length}):
              </Typography>
              <Stack spacing={2}>
                {criteria.violations.map((violation, vIndex) => (
                  <ViolationCard
                    key={vIndex}
                    violation={violation}
                    page={violation.page}
                    index={vIndex}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Card>
      ))}
    </Stack>
  );
};

export default CriteriaView;
