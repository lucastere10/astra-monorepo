import "server-only"

import OpenAI from "openai"
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions"

const MAX_PARAM_DROPS = 5

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

/**
 * chat.completions.create that peels off sampling params a model rejects
 * (e.g. gpt-5.x only allows the default temperature, so sending 0.5 400s).
 */
export async function createChatCompletion(
  client: OpenAI,
  params: ChatCompletionCreateParamsNonStreaming
): Promise<ChatCompletion> {
  const request: Record<string, unknown> = { ...params }
  for (let attempt = 0; attempt < MAX_PARAM_DROPS; attempt++) {
    try {
      return await client.chat.completions.create(
        request as ChatCompletionCreateParamsNonStreaming
      )
    } catch (error) {
      const param = unsupportedParam(error)
      if (!param || !(param in request)) throw error
      console.warn(`[openai-chat] dropping unsupported "${param}"`)
      delete request[param]
    }
  }
  throw new Error("OpenAI chat completion failed after dropping optional params")
}
