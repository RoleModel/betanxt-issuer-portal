import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import { extractWcagCriteria } from "@/utils/wcagMapping";

interface ViolationElement {
  target: string | string[];
  html: string;
  failureSummary: string;
  relatedNodes?: {
    target: string | string[];
    html: string;
    failureSummary: string;
  }[];
}

interface Violation {
  impact: string;
  description: string;
  wcag: string;
  help: string;
  helpUrl?: string;
  tags?: string[];
  id?: string;
  elements?: ViolationElement[];
}

interface ViolationCardProps {
  violation: Violation;
  page: string;
  index: number;
}

// Helper functions
const getImpactColorScheme = (impact: string) => {
  switch (impact.toUpperCase()) {
    case "CRITICAL":
      return { chipColor: "error" as const, textColor: "error.dark" };
    case "SERIOUS":
      return { chipColor: "warning" as const, textColor: "warning.dark" };
    case "INCOMPLETE":
      return { chipColor: "info" as const, textColor: "info.dark" };
    default:
      return { chipColor: "default" as const, textColor: "text.secondary" };
  }
};

const getImpactDisplayText = (impact: string, description: string) => {
  if (impact.toUpperCase() === "INCOMPLETE") {
    return {
      impact: "Needs Review",
      description: `Review Required: ${description.replace(/^Incomplete:\s*/i, "").trim()}`,
      prefix: "⚠️",
    };
  }
  return {
    impact: impact.toUpperCase(),
    description,
    prefix:
      impact.toUpperCase() === "CRITICAL" ? "🚨" : impact.toUpperCase() === "SERIOUS" ? "⚠️" : "❓",
  };
};

export default function ViolationCard({ violation, page }: ViolationCardProps) {
  const displayInfo = getImpactDisplayText(violation.impact, violation.description);
  const colorScheme = getImpactColorScheme(violation.impact);

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Link href={page} sx={{ fontWeight: 500 }}>
          {page}
        </Link>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label={displayInfo.impact} color={colorScheme.chipColor} size="small" />
          <Chip
            label={violation.tags ? extractWcagCriteria(violation.tags) : "No WCAG criteria mapped"}
            size="small"
          />
          {violation.id && <Chip label={violation.id} variant="outlined" size="small" />}
        </Stack>
      </Box>

      {/* Issue Description */}
      <Typography variant="body3" fontWeight="500" sx={{ mb: 1 }}>
        {displayInfo.description}
      </Typography>

      {/* Help Text */}
      <Typography variant="body3" color="text.secondary" sx={{ mb: 2 }}>
        {violation.help}
      </Typography>

      {/* Help URL */}
      {violation.helpUrl && (
        <Typography variant="body3" sx={{ mb: 2 }}>
          <Link
            href={violation.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontWeight: 500 }}
          >
            Learn More →
          </Link>
        </Typography>
      )}

      {/* Element Details */}
      {violation.elements && violation.elements.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body3" fontWeight="500">
              Affected Elements ({violation.elements.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {violation.elements.map((element, elemIndex) => (
                <Box
                  key={elemIndex}
                  sx={{
                    p: 1.5,
                    backgroundColor: "action.hover",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body3" sx={{ mb: 1 }}>
                    <strong>Selector:</strong>{" "}
                    <code
                      style={{
                        backgroundColor: "var(--mui-palette-action-selected)",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        fontSize: "0.85em",
                      }}
                    >
                      {Array.isArray(element.target) ? element.target.join(", ") : element.target}
                    </code>
                  </Typography>

                  <Typography variant="body3" sx={{ mb: 1 }}>
                    <strong>Issue:</strong> {element.failureSummary}
                  </Typography>

                  <Accordion sx={{ mt: 1 }}>
                    <AccordionSummary>
                      <Typography variant="body3" fontSize="0.85em">
                        View HTML
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: "action.selected",
                          p: 1,
                          borderRadius: 1,
                          overflow: "auto",
                          fontSize: "0.75em",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {element.html}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
