"use server"

import { revalidatePath } from "next/cache"

import {
  unsubscribeByToken,
  type UnsubscribeResult,
} from "@/modules/unsubscribe/service"

export interface UnsubscribeFormState {
  result?: UnsubscribeResult
}

export async function confirmUnsubscribe(
  _prev: UnsubscribeFormState | undefined,
  formData: FormData
): Promise<UnsubscribeFormState> {
  const token = formData.get("token")
  const result = await unsubscribeByToken(
    typeof token === "string" ? token : null
  )
  revalidatePath("/unsubscribe")
  return { result }
}
