export interface TopicSeed {
  name: string
  slug: string
  description: string
}

/**
 * Canonical list of topics offered to users for personalization.
 * Mirrors the database seed in `@workspace/database`.
 */
export const TOPICS: readonly TopicSeed[] = [
  { name: "AI Agents", slug: "ai-agents", description: "Autonomous and multi-agent systems" },
  { name: "MCP", slug: "mcp", description: "Model Context Protocol and tool integrations" },
  { name: "Open Source AI", slug: "open-source-ai", description: "Open models, weights and tooling" },
  { name: "LLMs", slug: "llms", description: "Large language models and frontier research" },
  { name: "AI Engineering", slug: "ai-engineering", description: "Building production AI systems" },
  { name: "Cloud", slug: "cloud", description: "Cloud platforms and infrastructure" },
  { name: "Startups", slug: "startups", description: "Funding, launches and the startup ecosystem" },
  { name: "Robotics", slug: "robotics", description: "Embodied AI and robotics" },
  { name: "AI Research", slug: "ai-research", description: "Papers and breakthroughs" },
  { name: "Security", slug: "security", description: "AI security, privacy and safety" },
  { name: "Developer Tools", slug: "developer-tools", description: "IDEs, frameworks and dev productivity" },
] as const

export type TopicSlug = (typeof TOPICS)[number]["slug"]

export const MIN_TOPIC_WEIGHT = 0
export const MAX_TOPIC_WEIGHT = 5
export const DEFAULT_TOPIC_WEIGHT = 1
