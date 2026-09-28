"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@workspace/database"

import { requireAdmin } from "@/modules/auth/dal"
import {
  isLlmCopyEnabled,
  setLlmCopyEnabled,
} from "@/modules/platform/platform-settings"

const toggleSchema = z.object({
  sourceId: z.string().min(1),
  isActive: z.coerce.boolean(),
})

export async function toggleSourceActive(formData: FormData) {
  await requireAdmin()

  const parsed = toggleSchema.safeParse({
    sourceId: formData.get("sourceId"),
    isActive: formData.get("isActive"),
  })

  if (!parsed.success) return

  await prisma.newsSource.update({
    where: { id: parsed.data.sourceId },
    data: { isActive: parsed.data.isActive },
  })

  revalidatePath("/admin/sources")
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
})

export async function setUserRole(formData: FormData) {
  await requireAdmin()

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  })

  if (!parsed.success) return

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  })

  revalidatePath("/admin/users")
}

export async function toggleLlmCopy() {
  await requireAdmin()
  const enabled = await isLlmCopyEnabled()
  await setLlmCopyEnabled(!enabled)
  revalidatePath("/admin/newsletters")
}
