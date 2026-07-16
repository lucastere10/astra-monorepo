import "server-only"

import { prisma } from "@workspace/database"
import type { NewsletterCadence } from "@workspace/shared/cadence"
import {
  DEFAULT_CADENCE,
  DEFAULT_SEND_HOUR,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_SEND_DAY,
} from "@workspace/shared/cadence"

export interface TopicPreference {
  topicId: string
  name: string
  slug: string
  description: string | null
  enabled: boolean
  weight: number
}

export interface DeliverySettings {
  cadence: NewsletterCadence
  sendHour: number
  timezone: string
  autoSendEnabled: boolean
  weeklySendDay: number
}

export async function getTopicPreferences(
  userId: string
): Promise<TopicPreference[]> {
  const [topics, preferences] = await Promise.all([
    prisma.topic.findMany({ orderBy: { name: "asc" } }),
    prisma.userPreference.findMany({ where: { userId } }),
  ])

  const byTopic = new Map(preferences.map((p) => [p.topicId, p]))

  return topics.map((topic) => {
    const pref = byTopic.get(topic.id)
    return {
      topicId: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      enabled: Boolean(pref),
      weight: pref?.weight ?? 1,
    }
  })
}

export async function getDeliverySettings(
  userId: string
): Promise<DeliverySettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cadence: true,
      sendHour: true,
      timezone: true,
      autoSendEnabled: true,
      weeklySendDay: true,
    },
  })

  return {
    cadence: (user?.cadence as NewsletterCadence) ?? DEFAULT_CADENCE,
    sendHour: user?.sendHour ?? DEFAULT_SEND_HOUR,
    timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    autoSendEnabled: user?.autoSendEnabled ?? true,
    weeklySendDay: user?.weeklySendDay ?? DEFAULT_WEEKLY_SEND_DAY,
  }
}

export interface PreferenceInput {
  topicId: string
  weight: number
}

export async function replaceUserPreferences(
  userId: string,
  inputs: PreferenceInput[]
): Promise<void> {
  await prisma.$transaction([
    prisma.userPreference.deleteMany({ where: { userId } }),
    prisma.userPreference.createMany({
      data: inputs.map((input) => ({
        userId,
        topicId: input.topicId,
        weight: input.weight,
      })),
      skipDuplicates: true,
    }),
  ])
}

export async function updateDeliverySettings(
  userId: string,
  settings: DeliverySettings
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      cadence: settings.cadence,
      sendHour: settings.sendHour,
      timezone: settings.timezone,
      autoSendEnabled: settings.autoSendEnabled,
      weeklySendDay: settings.weeklySendDay,
    },
  })
}

export async function countActivePreferences(userId: string): Promise<number> {
  return prisma.userPreference.count({ where: { userId } })
}
