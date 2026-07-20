"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@workspace/database"
import {
  DEFAULT_TIMEZONE,
  isSendHourPreset,
} from "@workspace/shared/cadence"
import { MAX_TOPIC_WEIGHT, MIN_TOPIC_WEIGHT } from "@workspace/shared/topics"
import { DOMAIN_EVENTS } from "@workspace/shared/events"

import { dispatchEvent } from "@/lib/events"
import { requireUser } from "@/modules/auth/dal"
import { invalidateUserRecommendations } from "@/modules/recommendation/recommendation.service"
import {
  replaceUserPreferences,
  updateDeliverySettings,
} from "./preferences.service"

const preferenceSchema = z.object({
  topicId: z.string().min(1),
  weight: z.number().min(MIN_TOPIC_WEIGHT).max(MAX_TOPIC_WEIGHT),
})

const deliverySchema = z
  .object({
    timezone: z.literal(DEFAULT_TIMEZONE),
    autoSendEnabled: z.boolean(),
    dailyEnabled: z.boolean(),
    dailySendHour: z.number().int().refine(isSendHourPreset, {
      message: "Choose morning, midday, or evening.",
    }),
    dailySendDays: z.array(z.number().int().min(0).max(6)),
    weeklyEnabled: z.boolean(),
    weeklySendHour: z.number().int().refine(isSendHourPreset, {
      message: "Choose morning, midday, or evening.",
    }),
    weeklySendDay: z.number().int().min(0).max(6),
  })
  .superRefine((data, ctx) => {
    if (data.autoSendEnabled && !data.dailyEnabled && !data.weeklyEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enable daily, weekly, or turn off automatic email.",
        path: ["autoSendEnabled"],
      })
    }
    if (data.dailyEnabled && data.dailySendDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick at least one day for the daily digest.",
        path: ["dailySendDays"],
      })
    }
  })

const payloadSchema = z.object({
  preferences: z.array(preferenceSchema),
  delivery: deliverySchema,
})

export interface PreferencesFormState {
  success?: boolean
  error?: string
  delivery?: {
    timezone: typeof DEFAULT_TIMEZONE
    autoSendEnabled: boolean
    dailyEnabled: boolean
    dailySendHour: number
    dailySendDays: number[]
    weeklyEnabled: boolean
    weeklySendHour: number
    weeklySendDay: number
  }
  preferences?: Array<{ topicId: string; weight: number }>
}

export async function savePreferences(
  _prev: PreferencesFormState | undefined,
  formData: FormData
): Promise<PreferencesFormState> {
  const user = await requireUser()

  const rawPrefs = formData.get("preferences")
  const rawDelivery = formData.get("delivery")
  if (typeof rawPrefs !== "string" || typeof rawDelivery !== "string") {
    return { error: "Invalid submission." }
  }

  let parsedPrefs: unknown
  let parsedDelivery: unknown
  try {
    parsedPrefs = JSON.parse(rawPrefs)
    parsedDelivery = JSON.parse(rawDelivery)
  } catch {
    return { error: "Invalid submission." }
  }

  const result = payloadSchema.safeParse({
    preferences: parsedPrefs,
    delivery: parsedDelivery,
  })

  if (!result.success) {
    const first = result.error.issues[0]?.message
    return {
      error: first ?? "Please review your topics and delivery settings.",
    }
  }

  const uniqueDays = [...new Set(result.data.delivery.dailySendDays)].sort(
    (a, b) => a - b
  )

  await replaceUserPreferences(user.id, result.data.preferences)
  await updateDeliverySettings(user.id, {
    ...result.data.delivery,
    timezone: DEFAULT_TIMEZONE,
    dailySendDays: uniqueDays,
  })

  await prisma.analyticsEvent.create({
    data: { userId: user.id, type: "PREFERENCE_CHANGED" },
  })

  await invalidateUserRecommendations(user.id)
  dispatchEvent(DOMAIN_EVENTS.PreferenceUpdated, { userId: user.id })

  revalidatePath("/preferences")
  revalidatePath("/dashboard")

  return {
    success: true,
    delivery: {
      ...result.data.delivery,
      timezone: DEFAULT_TIMEZONE,
      dailySendDays: uniqueDays,
    },
    preferences: result.data.preferences,
  }
}
