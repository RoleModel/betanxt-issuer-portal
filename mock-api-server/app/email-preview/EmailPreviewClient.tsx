"use client";

import React, { useEffect, useRef, useState } from "react";

type TemplateKey = "tabulation-daily-report" | "document-update-notification";
type SendStatus = "idle" | "sending" | "success" | "error";

const TEMPLATES: { key: TemplateKey; label: string }[] = [
  { key: "tabulation-daily-report", label: "Daily Tabulation Report" },
  { key: "document-update-notification", label: "Document Update Notification" },
];

const TABULATION_FIXTURE = {
  companyName: "Wendy's International",
  meetingType: "Annual Meeting 2026",
  meetingDate: "2026-06-17T14:00:00.000Z",
  reportDate: "2026-06-02T06:00:00.000Z",
  daysUntilMeeting: 15,
  recipientName: "Dallas Peters",
  totalSharesEligible: 12_500_000,
  totalSharesVoted: 6_842_000,
  quorumRequired: 50,
  quorumMet: true,
  viewTabulationUrl: "http://localhost:3000/WEN/meeting/wen-annual-meeting-2026/tabulation",
  portalBaseUrl: "http://localhost:3000",
  proposals: [
    {
      number: "1",
      title: "Election of Directors — Class II",
      totalShares: 12_500_000,
      votesFor: 6_021_000,
      votesAgainst: 420_000,
      votesAbstain: 401_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "2",
      title: "Advisory Vote on Executive Compensation (Say-on-Pay)",
      totalShares: 12_500_000,
      votesFor: 5_810_000,
      votesAgainst: 780_000,
      votesAbstain: 252_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "3",
      title: "Ratification of Independent Registered Public Accounting Firm",
      totalShares: 12_500_000,
      votesFor: 6_500_000,
      votesAgainst: 190_000,
      votesAbstain: 152_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "4",
      title: "Approval of the 2026 Equity Incentive Plan",
      totalShares: 12_500_000,
      votesFor: 4_200_000,
      votesAgainst: 2_100_000,
      votesAbstain: 542_000,
      votesNotCast: 5_658_000,
    },
  ],
};

const DOCUMENT_FIXTURE = {
  meetingType: "Annual Meeting",
  issuerAccountName: "Sample Issuer Account",
  documentName: "Proxy Notice",
  uploaderName: "Sarah Chen",
  documentDescription: "Sarah Chen has uploaded the first draft of the Proxy Notice.",
  uploadDate: "2026-06-02T12:00:00.000Z",
  viewDocumentUrl: "http://localhost:3000/documents/preview",
  portalBaseUrl: "http://localhost:3000",
};

function getFixture(template: TemplateKey): unknown {
  return template === "tabulation-daily-report" ? TABULATION_FIXTURE : DOCUMENT_FIXTURE;
}

export function EmailPreviewClient() {
  const [template, setTemplate] = useState<TemplateKey>("tabulation-daily-report");
  const [html, setHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [toEmail, setToEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendMessage, setSendMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setPreviewError(null);
    setHtml(null);

    async function fetchPreview() {
      try {
        const res = await fetch(`/api/emails/preview?template=${template}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { html: string };
        setHtml(data.html);
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        setLoading(false);
      }
    }

    void fetchPreview();
  }, [template]);

  async function handleSendTest() {
    const email = toEmail.trim();
    if (!email) {
      inputRef.current?.focus();
      return;
    }

    setSendStatus("sending");
    setSendMessage("");

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: template,
          to: [email],
          props: getFixture(template),
        }),
      });

      const data = (await res.json()) as {
        data?: { id: string };
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setSendStatus("error");
        setSendMessage(data.message ?? data.error ?? `HTTP ${res.status}`);
        return;
      }

      const id = data.data?.id ?? "";
      const isNoop = id.startsWith("noop-");
      setSendStatus(isNoop ? "error" : "success");
      setSendMessage(
        isNoop
          ? "No SMTP/Resend credentials — email not delivered. Check server logs for the rendered HTML file."
          : `Sent ✓  (id: ${id})`,
      );
    } catch (err) {
      setSendStatus("error");
      setSendMessage(err instanceof Error ? err.message : "Send failed");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") void handleSendTest();
  }

  const statusColor =
    sendStatus === "success" ? "#15803D" : sendStatus === "error" ? "#DC2626" : "#6B7280";

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#F3F4F6",
        minHeight: "100vh",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          backgroundColor: "#0E2A38",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: title + template switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "600" }}>
            Email Preview
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTemplate(t.key);
                  setSendStatus("idle");
                  setSendMessage("");
                }}
                style={{
                  padding: "5px 14px",
                  borderRadius: "5px",
                  border:
                    template === t.key
                      ? "1.5px solid rgba(255,255,255,0.9)"
                      : "1.5px solid rgba(255,255,255,0.25)",
                  backgroundColor: template === t.key ? "rgba(255,255,255,0.15)" : "transparent",
                  color: template === t.key ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: send test input */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            ref={inputRef}
            type="email"
            placeholder="recipient@example.com"
            value={toEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              padding: "6px 12px",
              borderRadius: "5px",
              border: "1.5px solid rgba(255,255,255,0.25)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#FFFFFF",
              fontSize: "13px",
              width: "220px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={() => void handleSendTest()}
            disabled={sendStatus === "sending"}
            style={{
              padding: "6px 16px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: sendStatus === "sending" ? "#374151" : "#16A34A",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: sendStatus === "sending" ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {sendStatus === "sending" ? "Sending…" : "Send Test ↗"}
          </button>
        </div>
      </div>

      {/* Send status bar */}
      {sendMessage && (
        <div
          style={{
            backgroundColor: sendStatus === "success" ? "#F0FDF4" : "#FEF2F2",
            borderBottom: `1px solid ${sendStatus === "success" ? "#BBF7D0" : "#FECACA"}`,
            padding: "8px 24px",
            fontSize: "13px",
            color: statusColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{sendMessage}</span>
          <button
            onClick={() => {
              setSendStatus("idle");
              setSendMessage("");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: statusColor,
              fontSize: "16px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Preview frame */}
      <div style={{ padding: "24px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {loading && (
            <div
              style={{ padding: "64px", textAlign: "center", color: "#9CA3AF", fontSize: "14px" }}
            >
              Loading preview…
            </div>
          )}
          {previewError && (
            <div style={{ padding: "24px", color: "#DC2626", fontSize: "14px" }}>
              Error: {previewError}
            </div>
          )}
          {html && !loading && (
            <iframe
              srcDoc={html}
              title="Email preview"
              style={{ width: "100%", height: "920px", border: "none", display: "block" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
