import { PrismaClient, type Prisma } from "@prisma/client"

const prisma = new PrismaClient()

const TOPICS: { name: string; slug: string; description: string }[] = [
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
]

type SourceSeed = {
  name: string
  url: string
  type: "RSS" | "SCRAPER" | "API"
  config?: Prisma.InputJsonValue
}

const SOURCES: SourceSeed[] = [
  // Core tech RSS
  { name: "Hacker News (Front Page)", url: "https://hnrss.org/frontpage", type: "RSS" },
  { name: "Hacker News (Best)", url: "https://hnrss.org/best", type: "RSS" },
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    type: "RSS",
  },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", type: "RSS" },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    type: "RSS",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    type: "RSS",
  },

  // Niche AI newsletters / blogs
  { name: "Import AI", url: "https://importai.substack.com/feed", type: "RSS" },
  {
    name: "The Batch (DeepLearning.AI)",
    url: "https://www.deeplearning.ai/the-batch/feed/",
    type: "RSS",
  },
  { name: "TLDR AI", url: "https://tldr.tech/api/rss/ai", type: "RSS" },
  { name: "Latent Space", url: "https://www.latent.space/feed", type: "RSS" },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", type: "RSS" },
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    type: "RSS",
  },
  {
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    type: "RSS",
  },

  // Papers via arXiv RSS
  {
    name: "arXiv cs.AI",
    url: "https://rss.arxiv.org/rss/cs.AI",
    type: "RSS",
  },
  {
    name: "arXiv cs.LG",
    url: "https://rss.arxiv.org/rss/cs.LG",
    type: "RSS",
  },

  // Exa semantic search (requires EXA_API_KEY)
  {
    name: "Exa — AI Agents",
    url: "exa://ai-agents",
    type: "API",
    config: {
      provider: "exa",
      query: "AI agents autonomous multi-agent systems tools",
      numResults: 10,
      category: "news",
    },
  },
  {
    name: "Exa — LLMs",
    url: "exa://llms",
    type: "API",
    config: {
      provider: "exa",
      query: "large language models GPT Claude Gemini breakthroughs",
      numResults: 10,
      category: "news",
    },
  },
  {
    name: "Exa — AI Engineering",
    url: "exa://ai-engineering",
    type: "API",
    config: {
      provider: "exa",
      query: "AI engineering RAG evals production LLM systems",
      numResults: 10,
      category: "news",
    },
  },
  {
    name: "Exa — Open Source AI",
    url: "exa://open-source-ai",
    type: "API",
    config: {
      provider: "exa",
      query: "open source AI models Llama Mistral open weights",
      numResults: 10,
      category: "news",
    },
  },
]

async function main() {
  console.log("Seeding topics...")
  for (const topic of TOPICS) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: { name: topic.name, description: topic.description },
      create: topic,
    })
  }

  console.log("Seeding news sources...")
  for (const source of SOURCES) {
    await prisma.newsSource.upsert({
      where: { url: source.url },
      update: {
        name: source.name,
        type: source.type,
        config: source.config ?? undefined,
      },
      create: {
        name: source.name,
        url: source.url,
        type: source.type,
        config: source.config ?? undefined,
      },
    })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    console.log(`Ensuring admin user ${adminEmail}...`)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: { email: adminEmail, name: "Admin", role: "ADMIN" },
    })
  }

  console.log("Seed complete.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
