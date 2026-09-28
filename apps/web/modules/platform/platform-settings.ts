import "server-only"

import { prisma } from "@workspace/database"

const SETTINGS_ID = "default"

/** True when the singleton row is missing, matching the migration default. */
export async function isLlmCopyEnabled(): Promise<boolean> {
  const row = await prisma.platformSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { llmCopyEnabled: true },
  })
  return row?.llmCopyEnabled ?? true
}

export async function setLlmCopyEnabled(enabled: boolean): Promise<void> {
  await prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, llmCopyEnabled: enabled },
    update: { llmCopyEnabled: enabled },
  })
}
