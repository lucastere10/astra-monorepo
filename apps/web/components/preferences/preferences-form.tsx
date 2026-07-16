"use client"

import { useActionState, useMemo, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import {
  COMMON_TIMEZONES,
  DEFAULT_CADENCE,
  DEFAULT_SEND_HOUR,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_SEND_DAY,
  WEEKDAY_LABELS,
  type NewsletterCadence,
} from "@workspace/shared/cadence"
import {
  DEFAULT_TOPIC_WEIGHT,
  MAX_TOPIC_WEIGHT,
  MIN_TOPIC_WEIGHT,
} from "@workspace/shared/topics"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"

import {
  savePreferences,
  type PreferencesFormState,
} from "@/modules/preferences/actions"
import type {
  DeliverySettings,
  TopicPreference,
} from "@/modules/preferences/preferences.service"

interface RowState {
  enabled: boolean
  weight: number
}

interface PreferencesFormProps {
  initial: TopicPreference[]
  delivery: DeliverySettings
}

export function PreferencesForm({ initial, delivery }: PreferencesFormProps) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      initial.map((topic) => [
        topic.topicId,
        { enabled: topic.enabled, weight: topic.weight },
      ])
    )
  )

  const [cadence, setCadence] = useState<NewsletterCadence>(
    delivery.cadence ?? DEFAULT_CADENCE
  )
  const [sendHour, setSendHour] = useState(delivery.sendHour ?? DEFAULT_SEND_HOUR)
  const [timezone, setTimezone] = useState(
    delivery.timezone ?? DEFAULT_TIMEZONE
  )
  const [autoSendEnabled, setAutoSendEnabled] = useState(
    delivery.autoSendEnabled ?? true
  )
  const [weeklySendDay, setWeeklySendDay] = useState(
    delivery.weeklySendDay ?? DEFAULT_WEEKLY_SEND_DAY
  )

  const [state, action, pending] = useActionState<
    PreferencesFormState | undefined,
    FormData
  >(savePreferences, undefined)

  const serializedPrefs = useMemo(
    () =>
      JSON.stringify(
        initial
          .filter((topic) => rows[topic.topicId]?.enabled)
          .map((topic) => ({
            topicId: topic.topicId,
            weight: rows[topic.topicId]?.weight ?? DEFAULT_TOPIC_WEIGHT,
          }))
      ),
    [initial, rows]
  )

  const serializedDelivery = useMemo(
    () =>
      JSON.stringify({
        cadence,
        sendHour,
        timezone,
        autoSendEnabled,
        weeklySendDay,
      }),
    [cadence, sendHour, timezone, autoSendEnabled, weeklySendDay]
  )

  const enabledCount = Object.values(rows).filter((r) => r.enabled).length

  function setRow(topicId: string, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId]!, ...patch },
    }))
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="preferences" value={serializedPrefs} />
      <input type="hidden" name="delivery" value={serializedDelivery} />

      <section className="bg-card flex flex-col gap-4 rounded-lg border p-5">
        <div>
          <h2 className="text-sm font-semibold">Delivery</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Choose how often we send, and at what local time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cadence">Cadence</Label>
            <select
              id="cadence"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={cadence}
              onChange={(e) =>
                setCadence(e.target.value as NewsletterCadence)
              }
            >
              <option value="WEEKLY">Weekly (8 stories)</option>
              <option value="DAILY">Daily digest (4 stories)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sendHour">Send hour (local)</Label>
            <select
              id="sendHour"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={sendHour}
              onChange={(e) => setSendHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {cadence === "WEEKLY" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weeklySendDay">Day of week</Label>
              <select
                id="weeklySendDay"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={weeklySendDay}
                onChange={(e) => setWeeklySendDay(Number(e.target.value))}
              >
                {WEEKDAY_LABELS.map((label, day) => (
                  <option key={label} value={day}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Automatic email</p>
            <p className="text-muted-foreground text-xs">
              Send editions on schedule without opening the app.
            </p>
          </div>
          <Switch
            checked={autoSendEnabled}
            onCheckedChange={setAutoSendEnabled}
            aria-label="Enable automatic email"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">Topics</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Higher weights push matching articles higher in your newsletter.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {initial.map((topic) => {
            const row = rows[topic.topicId]!
            return (
              <div
                key={topic.topicId}
                className="bg-card flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{topic.name}</p>
                    {topic.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={row.enabled}
                    onCheckedChange={(checked) =>
                      setRow(topic.topicId, { enabled: checked })
                    }
                    aria-label={`Enable ${topic.name}`}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Slider
                    value={[row.weight]}
                    min={MIN_TOPIC_WEIGHT}
                    max={MAX_TOPIC_WEIGHT}
                    step={1}
                    disabled={!row.enabled}
                    onValueChange={([value]) =>
                      setRow(topic.topicId, {
                        weight: value ?? DEFAULT_TOPIC_WEIGHT,
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-muted-foreground w-10 text-right font-mono text-xs">
                    {row.enabled ? `\u00d7${row.weight}` : "off"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {enabledCount} topic{enabledCount === 1 ? "" : "s"} selected
        </p>
        <div className="flex items-center gap-3">
          {state?.success && (
            <span className="text-primary flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="size-4" />
              Saved
            </span>
          )}
          {state?.error && (
            <span className="text-destructive text-sm">{state.error}</span>
          )}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save preferences
          </Button>
        </div>
      </div>
    </form>
  )
}
