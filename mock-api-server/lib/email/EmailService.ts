import fs from 'fs'
import os from 'os'
import path from 'path'

import { render } from '@react-email/render'
import type React from 'react'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

interface SendInput {
  to: string[]
  subject: string
  react: React.ReactElement
  replyTo?: string
  cc?: string[]
  bcc?: string[]
}

interface SendResult {
  id: string
}

interface EmailService {
  send(input: SendInput): Promise<SendResult>
}

class ResendEmailService implements EmailService {
  private client: Resend
  private from: string

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey)
    this.from = from
  }

  async send(input: SendInput): Promise<SendResult> {
    const html = await render(input.react)
    const text = await render(input.react, { plainText: true })
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html,
      text,
      reply_to: input.replyTo,
      cc: input.cc,
      bcc: input.bcc,
    })
    if (error || !data) {
      throw new Error(error?.message ?? 'Resend send failed')
    }
    return { id: data.id }
  }
}

class NoopEmailService implements EmailService {
  async send(input: SendInput): Promise<SendResult> {
    const id = `noop-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const html = await render(input.react)

    const tmpFile = path.join(os.tmpdir(), `betanxt-email-${id}.html`)
    fs.writeFileSync(tmpFile, html, 'utf-8')

    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║  📧  EMAIL (no RESEND_API_KEY — not actually sent)           ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  To:      ${input.to.join(', ').padEnd(52)}║`)
    console.log(`║  Subject: ${input.subject.substring(0, 52).padEnd(52)}║`)
    console.log(`║  Preview: file://${tmpFile.substring(0, 44).padEnd(44)}║`)
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  Add RESEND_API_KEY to mock-api-server/.env.local to send   ║')
    console.log('║  real emails → https://resend.com/api-keys                  ║')
    console.log('╚══════════════════════════════════════════════════════════════╝\n')

    return Promise.resolve({ id })
  }
}

class SmtpEmailService implements EmailService {
  private transporter: nodemailer.Transporter
  private from: string

  constructor(from: string) {
    this.from = from
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    })

    // Verify connection on startup so misconfiguration surfaces immediately
    this.transporter.verify((err) => {
      if (err) {
        console.error('[EmailService] SMTP connection failed:', err.message)
        console.error('[EmailService] Check EMAIL_SMTP_HOST / USER / PASS in .env.local')
      } else {
        console.log(`[EmailService] SMTP ready — sending as ${from}`)
      }
    })
  }

  async send(input: SendInput): Promise<SendResult> {
    const html = await render(input.react)
    const text = await render(input.react, { plainText: true })

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: input.to.join(', '),
        subject: input.subject,
        html,
        text,
        replyTo: input.replyTo,
        cc: input.cc?.join(', '),
        bcc: input.bcc?.join(', '),
      })
      console.log(`[EmailService] Sent to ${input.to.join(', ')} — messageId: ${String(info.messageId)}`)
      return { id: info.messageId as string }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[EmailService] SMTP send failed: ${msg}`)
      throw new Error(`SMTP send failed: ${msg}`)
    }
  }
}

let _instance: EmailService | null = null
let _instanceProvider: string | null = null
let _instanceFrom: string | null = null

export function getEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER ?? 'noop'
  const from = process.env.EMAIL_FROM ?? 'BetaNXT Issuer Portal <noreply@example.com>'

  // Re-create if provider or from address changed (e.g. after .env.local edit)
  if (_instance && _instanceProvider === provider && _instanceFrom === from) {
    return _instance
  }

  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    _instance = new ResendEmailService(process.env.RESEND_API_KEY, from)
  } else if (provider === 'smtp' && process.env.EMAIL_SMTP_HOST) {
    _instance = new SmtpEmailService(from)
  } else {
    _instance = new NoopEmailService()
  }

  _instanceProvider = provider
  _instanceFrom = from
  return _instance
}

export type { EmailService, SendInput, SendResult }
