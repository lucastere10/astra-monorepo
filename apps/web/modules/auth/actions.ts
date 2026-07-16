"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { deleteSession } from "./session"
import { createMagicLinkToken } from "./tokens"
import { sendMagicLinkEmail } from "./email"

const emailSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim(),
})

export interface LoginFormState {
  error?: string
  success?: boolean
  email?: string
}

export async function requestMagicLink(
  _prev: LoginFormState | undefined,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid email.",
    }
  }

  const email = parsed.data.email.toLowerCase()

  try {
    const rawToken = await createMagicLinkToken(email)
    await sendMagicLinkEmail(email, rawToken)
  } catch (error) {
    console.error("[auth] requestMagicLink failed", error)
    return { error: "Something went wrong. Please try again." }
  }

  return { success: true, email }
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect("/login")
}
