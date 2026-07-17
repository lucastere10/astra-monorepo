"use client"

import { useActionState, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Moon,
  Sun,
  Sunrise,
} from "lucide-react"

import {
  COMMON_TIMEZONES,
  DEFAULT_DAILY_ENABLED,
  DEFAULT_DAILY_SEND_DAYS,
  DEFAULT_SEND_HOUR,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEKLY_ENABLED,
  DEFAULT_WEEKLY_SEND_DAY,
  WEEKDAY_LABELS,
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
import { cn } from "@workspace/ui/lib/utils"

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

const HOUR_PRESETS = [
  { hour: 8, label: "Morning", icon: Sunrise },
  { hour: 12, label: "Midday", icon: Sun },
  { hour: 18, label: "Evening", icon: Moon },
] as const

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`
}

function HourPicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string
  value: number
  onChange: (hour: number) => void
  disabled?: boolean
}) {
  const matchedPreset = HOUR_PRESETS.find((p) => p.hour === value)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {HOUR_PRESETS.map(({ hour, label, icon: Icon }) => {
          const selected = value === hour
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(hour)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background text-muted-foreground hover:bg-muted",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          aria-label="Earlier hour"
          onClick={() => onChange((value + 23) % 24)}
          className={cn(
            "border-input hover:bg-muted inline-flex size-9 items-center justify-center rounded-md border",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div
          id={id}
          className="border-input bg-muted/40 flex h-9 min-w-[5.5rem] flex-1 items-center justify-center rounded-md border font-mono text-sm tabular-nums"
          aria-live="polite"
        >
          {formatHour(value)}
          {matchedPreset ? (
            <span className="text-muted-foreground ml-2 text-xs font-sans">
              {matchedPreset.label}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          aria-label="Later hour"
          onClick={() => onChange((value + 1) % 24)}
          className={cn(
            "border-input hover:bg-muted inline-flex size-9 items-center justify-center rounded-md border",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function WeekdayStrip({
  mode,
  selected,
  onToggle,
  disabled,
}: {
  mode: "single" | "multi"
  selected: number | number[]
  onToggle: (day: number) => void
  disabled?: boolean
}) {
  const isSelected = (day: number) =>
    mode === "single"
      ? selected === day
      : (selected as number[]).includes(day)

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role={mode === "single" ? "radiogroup" : "group"}
      aria-label={mode === "single" ? "Day of week" : "Days of week"}
    >
      {WEEKDAY_LABELS.map((label, day) => {
        const active = isSelected(day)
        return (
          <button
            key={`${label}-${day}`}
            type="button"
            disabled={disabled}
            title={label}
            aria-label={label}
            aria-pressed={mode === "multi" ? active : undefined}
            aria-checked={mode === "single" ? active : undefined}
            role={mode === "single" ? "radio" : undefined}
            onClick={() => onToggle(day)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-background text-muted-foreground hover:bg-muted",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            {WEEKDAY_SHORT[day]}
          </button>
        )
      })}
    </div>
  )
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

  const [timezone, setTimezone] = useState(
    delivery.timezone ?? DEFAULT_TIMEZONE
  )
  const [autoSendEnabled, setAutoSendEnabled] = useState(
    delivery.autoSendEnabled ?? true
  )
  const [dailyEnabled, setDailyEnabled] = useState(
    delivery.dailyEnabled ?? DEFAULT_DAILY_ENABLED
  )
  const [dailySendHour, setDailySendHour] = useState(
    delivery.dailySendHour ?? DEFAULT_SEND_HOUR
  )
  const [dailySendDays, setDailySendDays] = useState<number[]>(
    delivery.dailySendDays?.length
      ? delivery.dailySendDays
      : [...DEFAULT_DAILY_SEND_DAYS]
  )
  const [weeklyEnabled, setWeeklyEnabled] = useState(
    delivery.weeklyEnabled ?? DEFAULT_WEEKLY_ENABLED
  )
  const [weeklySendHour, setWeeklySendHour] = useState(
    delivery.weeklySendHour ?? DEFAULT_SEND_HOUR
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
        timezone,
        autoSendEnabled,
        dailyEnabled,
        dailySendHour,
        dailySendDays,
        weeklyEnabled,
        weeklySendHour,
        weeklySendDay,
      }),
    [
      timezone,
      autoSendEnabled,
      dailyEnabled,
      dailySendHour,
      dailySendDays,
      weeklyEnabled,
      weeklySendHour,
      weeklySendDay,
    ]
  )

  const enabledCount = Object.values(rows).filter((r) => r.enabled).length
  const scheduleLocked = !autoSendEnabled

  function setRow(topicId: string, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId]!, ...patch },
    }))
  }

  function toggleDailyDay(day: number) {
    setDailySendDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  function toggleDigest(
    kind: "daily" | "weekly",
    next: boolean
  ) {
    if (kind === "daily") setDailyEnabled(next)
    else setWeeklyEnabled(next)
  }

  return (
    <form action={action} className="flex flex-col gap-10">
      <input type="hidden" name="preferences" value={serializedPrefs} />
      <input type="hidden" name="delivery" value={serializedDelivery} />

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Your digests
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick Daily, Weekly, or both. Each has its own schedule.
          </p>
        </div>

        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            scheduleLocked && "opacity-60"
          )}
        >
          {/* Daily card */}
          <div
            className={cn(
              "bg-card flex flex-col rounded-xl border transition-colors",
              dailyEnabled && autoSendEnabled
                ? "border-foreground/40 ring-1 ring-foreground/10"
                : "border-border"
            )}
          >
            <button
              type="button"
              disabled={scheduleLocked}
              onClick={() => toggleDigest("daily", !dailyEnabled)}
              aria-pressed={dailyEnabled}
              className="flex flex-col gap-3 p-5 text-left disabled:pointer-events-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Short brief
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">
                    Astra Daily
                  </p>
                </div>
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    dailyEnabled
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/40"
                  )}
                  aria-hidden
                >
                  {dailyEnabled ? "✓" : ""}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                ~4 stories on the days you choose — a quick pulse of what
                matters.
              </p>
              <p className="text-muted-foreground text-xs">
                Best if you want a light daily habit.
              </p>
            </button>

            {dailyEnabled && (
              <div className="border-t px-5 pt-4 pb-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Which days?</Label>
                    <WeekdayStrip
                      mode="multi"
                      selected={dailySendDays}
                      onToggle={toggleDailyDay}
                      disabled={scheduleLocked}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">What time?</Label>
                    <HourPicker
                      id="dailySendHour"
                      value={dailySendHour}
                      onChange={setDailySendHour}
                      disabled={scheduleLocked}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weekly card */}
          <div
            className={cn(
              "bg-card flex flex-col rounded-xl border transition-colors",
              weeklyEnabled && autoSendEnabled
                ? "border-foreground/40 ring-1 ring-foreground/10"
                : "border-border"
            )}
          >
            <button
              type="button"
              disabled={scheduleLocked}
              onClick={() => toggleDigest("weekly", !weeklyEnabled)}
              aria-pressed={weeklyEnabled}
              className="flex flex-col gap-3 p-5 text-left disabled:pointer-events-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Deep roundup
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">
                    Astra Weekly
                  </p>
                </div>
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    weeklyEnabled
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/40"
                  )}
                  aria-hidden
                >
                  {weeklyEnabled ? "✓" : ""}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                ~8 stories once a week — a fuller briefing you can sit with.
              </p>
              <p className="text-muted-foreground text-xs">
                Best for a weekend or Monday catch-up.
              </p>
            </button>

            {weeklyEnabled && (
              <div className="border-t px-5 pt-4 pb-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Which day?</Label>
                    <WeekdayStrip
                      mode="single"
                      selected={weeklySendDay}
                      onToggle={setWeeklySendDay}
                      disabled={scheduleLocked}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">What time?</Label>
                    <HourPicker
                      id="weeklySendHour"
                      value={weeklySendHour}
                      onChange={setWeeklySendHour}
                      disabled={scheduleLocked}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div>
              <p className="text-sm font-medium">Send automatically</p>
              <p className="text-muted-foreground text-xs">
                Turn off to pause every digest.
              </p>
            </div>
            <Switch
              checked={autoSendEnabled}
              onCheckedChange={setAutoSendEnabled}
              aria-label="Enable automatic email"
            />
          </div>
          <div className="flex flex-col gap-1 sm:min-w-[14rem]">
            <Label htmlFor="timezone" className="text-xs">
              Timezone
            </Label>
            <select
              id="timezone"
              className="border-input bg-background h-8 rounded-md border px-2 text-xs"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Topics</h2>
          <p className="text-muted-foreground mt-1 text-sm">
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
