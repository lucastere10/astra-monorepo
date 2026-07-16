import "server-only"

import { Resend } from "resend"

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

function buildMagicLinkEmail(url: string) {
  const subject = "Your Astra sign-in link"
  const text = `Sign in to Astra using this link (valid for 15 minutes):\n\n${url}\n\nIf you did not request this, you can safely ignore this email.`
  const html = `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h1 style="font-size:18px;margin:0 0 12px">Sign in to Astra</h1>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px">
      Click the button below to sign in. This link is valid for 15 minutes.
    </p>
    <a href="${url}" style="display:inline-block;background:#b45309;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600">
      Sign in to Astra
    </a>
    <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0">
      If the button does not work, copy and paste this URL into your browser:<br />
      <span style="word-break:break-all">${url}</span>
    </p>
    <p style="color:#999;font-size:12px;margin:16px 0 0">
      If you did not request this, you can safely ignore this email.
    </p>
  </div>`
  return { subject, text, html }
}

/**
 * Send a magic-link email via Resend. When `RESEND_API_KEY` is not configured
 * (local development), the link is logged to the server console instead so the
 * flow remains usable without email credentials.
 */
export async function sendMagicLinkEmail(
  email: string,
  rawToken: string
): Promise<void> {
  const url = `${getAppUrl()}/api/auth/verify?token=${rawToken}`
  const { subject, text, html } = buildMagicLinkEmail(url)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      `[auth] RESEND_API_KEY not set. Magic link for ${email}:\n${url}`
    )
    return
  }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? "Astra <onboarding@caldasdev.com.br>"

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    text,
    html,
  })

  if (error) {
    console.error("[auth] Failed to send magic link email", error)
    throw new Error("Failed to send sign-in email")
  }
}
