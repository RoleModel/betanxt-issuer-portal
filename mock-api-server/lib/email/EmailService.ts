import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import type React from "react";

interface SendInput {
  to: string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendResult {
  id: string;
}

interface EmailService {
  send: (input: SendInput) => Promise<SendResult>;
}

class ResendEmailService implements EmailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(input: SendInput): Promise<SendResult> {
    const html = await render(input.react);
    const text = await render(input.react, { plainText: true });
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html,
      text,
      replyTo: input.replyTo,
      cc: input.cc,
      bcc: input.bcc,
    });
    if (error || !data) {
      throw new Error(error?.message ?? "Resend send failed");
    }
    return { id: data.id };
  }
}

class NoopEmailService implements EmailService {
  async send(input: SendInput): Promise<SendResult> {
    const id = `noop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const html = await render(input.react);

    const temporaryFile = path.join(os.tmpdir(), `betanxt-email-${id}.html`);
    fs.writeFileSync(temporaryFile, html, "utf-8");

    console.log(
      "\n╔══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  📧  EMAIL (noop provider — not actually sent)               ║"
    );
    console.log(
      "╠══════════════════════════════════════════════════════════════╣"
    );
    console.log(`║  To:      ${input.to.join(", ").padEnd(52)}║`);
    console.log(`║  Subject: ${input.subject.slice(0, 52).padEnd(52)}║`);
    console.log(`║  Preview: file://${temporaryFile.slice(0, 44).padEnd(44)}║`);
    console.log(
      "╠══════════════════════════════════════════════════════════════╣"
    );
    console.log(
      "║  Configure EMAIL_PROVIDER and credentials to send real mail ║"
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n"
    );

    return { id };
  }
}

class SmtpEmailService implements EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(from: string) {
    this.from = from;
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
      secure: process.env.EMAIL_SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });

    // Verify connection on startup so misconfiguration surfaces immediately
    this.transporter.verify((error) => {
      if (error) {
        console.error("[EmailService] SMTP connection failed:", error.message);
        console.error(
          "[EmailService] Check EMAIL_SMTP_HOST / USER / PASS in .env.local"
        );
      } else {
        console.log(`[EmailService] SMTP ready — sending as ${from}`);
      }
    });
  }

  async send(input: SendInput): Promise<SendResult> {
    const html = await render(input.react);
    const text = await render(input.react, { plainText: true });

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: input.to.join(", "),
        subject: input.subject,
        html,
        text,
        replyTo: input.replyTo,
        cc: input.cc?.join(", "),
        bcc: input.bcc?.join(", "),
      });
      console.log(
        `[EmailService] Sent to ${input.to.join(", ")} — messageId: ${String(info.messageId)}`
      );
      return { id: String(info.messageId) };
    } catch (error) {
      const message = Error.isError(error) ? error.message : String(error);
      console.error(`[EmailService] SMTP send failed: ${message}`);
      throw new Error(`SMTP send failed: ${message}`);
    }
  }
}

let _instance: EmailService | null = null;
let _instanceProvider: string | null = null;
let _instanceFrom: string | null = null;

function requiresConfiguredProvider(provider: string): boolean {
  return (
    process.env.VERCEL === "1" &&
    process.env.ENABLE_EMAILS === "true" &&
    provider !== "noop"
  );
}

function createMissingProviderError(
  provider: string,
  missingKeys: string[]
): Error {
  const missing = missingKeys.join(", ");
  return new Error(
    `Email provider "${provider}" is not configured for Vercel. Missing: ${missing}. ` +
      "Set these environment variables in the Vercel project before enabling emails."
  );
}

export function getEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER ?? "noop").toLowerCase();
  const from =
    process.env.EMAIL_FROM ?? "BetaNXT Issuer Portal <noreply@example.com>";

  // Re-create if provider or from address changed (e.g. after .env.local edit)
  if (_instance && _instanceProvider === provider && _instanceFrom === from) {
    return _instance;
  }

  if (provider === "resend") {
    if (!process.env.RESEND_API_KEY && requiresConfiguredProvider(provider)) {
      throw createMissingProviderError(provider, ["RESEND_API_KEY"]);
    }

    _instance = process.env.RESEND_API_KEY
      ? new ResendEmailService(process.env.RESEND_API_KEY, from)
      : new NoopEmailService();
  } else if (provider === "smtp") {
    const missingKeys: string[] = [];
    if (!process.env.EMAIL_SMTP_HOST) {
      missingKeys.push("EMAIL_SMTP_HOST");
    }
    if (!process.env.EMAIL_SMTP_USER) {
      missingKeys.push("EMAIL_SMTP_USER");
    }
    if (!process.env.EMAIL_SMTP_PASS) {
      missingKeys.push("EMAIL_SMTP_PASS");
    }

    if (missingKeys.length > 0 && requiresConfiguredProvider(provider)) {
      throw createMissingProviderError(provider, missingKeys);
    }

    _instance =
      missingKeys.length === 0
        ? new SmtpEmailService(from)
        : new NoopEmailService();
  } else {
    if (process.env.VERCEL === "1" && process.env.ENABLE_EMAILS === "true") {
      throw createMissingProviderError("unknown", ["EMAIL_PROVIDER"]);
    }

    _instance = new NoopEmailService();
  }

  _instanceProvider = provider;
  _instanceFrom = from;
  return _instance;
}

export type { EmailService, SendInput, SendResult };
