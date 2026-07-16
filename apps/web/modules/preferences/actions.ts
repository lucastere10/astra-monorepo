"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@workspace/database"
import {
  COMMON_TIMEZONES,
  NEWSLETTER_CADENCES,
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

const deliverySchema = z.object({
  cadence: z.enum(NEWSLETTER_CADENCES),
  sendHour: z.number().int().min(0).max(23),
  timezone: z.string().min(1),
  autoSendEnabled: z.boolean(),
  weeklySendDay: z.number().int().min(0).max(6),
})

const payloadSchema = z.object({
  preferences: z.array(preferenceSchema),
  delivery: deliverySchema,
})

export interface PreferencesFormState {
  success?: boolean
  error?: string
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
    return { error: "Please review your topics and delivery settings." }
  }

  const timezoneOk =
    (COMMON_TIMEZONES as readonly string[]).includes(
      result.data.delivery.timezone
    ) || Boolean(result.data.delivery.timezone.trim())

  if (!timezoneOk) {
    return { error: "Please choose a valid timezone." }
  }

  await replaceUserPreferences(user.id, result.data.preferences)
  await updateDeliverySettings(user.id, result.data.delivery)

  await prisma.analyticsEvent.create({
    data: { userId: user.id, type: "PREFERENCE_CHANGED" },
  })

  await invalidateUserRecommendations(user.id)
  dispatchEvent(DOMAIN_EVENTS.PreferenceUpdated, { userId: user.id })

  revalidatePath("/preferences")
  revalidatePath("/dashboard")

  return { success: true }
}
