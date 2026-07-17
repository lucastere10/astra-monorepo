import type { Metadata } from "next"

import { PreferencesForm } from "@/components/preferences/preferences-form"
import { requireUser } from "@/modules/auth/dal"
import {
  getDeliverySettings,
  getTopicPreferences,
} from "@/modules/preferences/preferences.service"

export const metadata: Metadata = {
  title: "Preferences",
}

export default async function PreferencesPage() {
  const user = await requireUser()
  const [topics, delivery] = await Promise.all([
    getTopicPreferences(user.id),
    getDeliverySettings(user.id),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose Astra Daily, Weekly, or both — then pick days, time, and
          topics.
        </p>
      </header>

      <PreferencesForm initial={topics} delivery={delivery} />
    </div>
  )
}
