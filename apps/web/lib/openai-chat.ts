import "server-only"

import OpenAI from "openai"

const MAX_PARAM_DROPS = 5

/** Params we use for newsletter copy — always non-streaming JSON. */
export interface ChatCompletionJsonParams {
  model: string
  messages: Array<{ role: "user"; content: string }>
  response_format?: { type: "json_object" }
  temperature?: number
}

function unsupportedParam(error: unknown): string | null {
  if (!error || typeof error !== "object") return null
  const candidate = error as {
    code?: string | null
    param?: string | null
    error?: { code?: string | null; param?: string | null }
  }
  const code = candidate.code ?? candidate.error?.code
  const param = candidate.param ?? candidate.error?.param
  if (
    (code === "unsupported_value" || code === "unsupported_parameter") &&
    typeof param === "string" &&
    param.length > 0
  ) {
    return param
  }
  return null
}

function completionText(result: unknown): string | null {
  if (!result || typeof result !== "object") return null
  const choices = (result as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== "object") return null
  const content = (message as { content?: unknown }).content
  return typeof content === "string" ? content : null
}

function omitUnsupportedSampling(request: Record<string, unknown>): void {
  const model = request.model
  if (typeof model === "string" && model.startsWith("gpt-5")) {
    delete request.temperature
  }
}

/**
 * chat.completions.create that peels off sampling params a model rejects
 * (e.g. gpt-5.x only allows the default temperature, so sending 0.5 400s).
 * Returns the assistant message text (expected JSON).
 */
export async function createChatCompletion(
  client: OpenAI,
  params: ChatCompletionJsonParams
): Promise<string> {
  const request: Record<string, unknown> = { ...params }
  omitUnsupportedSampling(request)
  for (let attempt = 0; attempt < MAX_PARAM_DROPS; attempt++) {
    try {
      const result = await client.chat.completions.create(
        request as unknown as Parameters<
          OpenAI["chat"]["completions"]["create"]
        >[0]
      )
      const text = completionText(result)
      if (text) return text
      throw new Error("OpenAI chat completion returned no message content")
    } catch (error) {
      const param = unsupportedParam(error)
      if (!param || !(param in request)) throw error
      console.warn(`[openai-chat] dropping unsupported "${param}"`)
      delete request[param]
    }
  }
  throw new Error("OpenAI chat completion failed after dropping optional params")
}
