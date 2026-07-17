import "server-only"

import { prisma } from "@workspace/database"
import {
  DEFAULT_DAILY_ENABLED,
  DEFAULT_DAILY_SEND_DAYS,
  DEFAULT_SEND_HOUR,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_ENABLED,
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
  timezone: string
  autoSendEnabled: boolean
  dailyEnabled: boolean
  dailySendHour: number
  dailySendDays: number[]
  weeklyEnabled: boolean
  weeklySendHour: number
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
      timezone: true,
      autoSendEnabled: true,
      dailyEnabled: true,
      dailySendHour: true,
      dailySendDays: true,
      weeklyEnabled: true,
      weeklySendHour: true,
      weeklySendDay: true,
    },
  })

  return {
    timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    autoSendEnabled: user?.autoSendEnabled ?? true,
    dailyEnabled: user?.dailyEnabled ?? DEFAULT_DAILY_ENABLED,
    dailySendHour: user?.dailySendHour ?? DEFAULT_SEND_HOUR,
    dailySendDays: user?.dailySendDays?.length
      ? user.dailySendDays
      : [...DEFAULT_DAILY_SEND_DAYS],
    weeklyEnabled: user?.weeklyEnabled ?? DEFAULT_WEEKLY_ENABLED,
    weeklySendHour: user?.weeklySendHour ?? DEFAULT_SEND_HOUR,
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
      timezone: settings.timezone,
      autoSendEnabled: settings.autoSendEnabled,
      dailyEnabled: settings.dailyEnabled,
      dailySendHour: settings.dailySendHour,
      dailySendDays: settings.dailySendDays,
      weeklyEnabled: settings.weeklyEnabled,
      weeklySendHour: settings.weeklySendHour,
      weeklySendDay: settings.weeklySendDay,
    },
  })
}

export async function countActivePreferences(userId: string): Promise<number> {
  return prisma.userPreference.count({ where: { userId } })
}
