export interface DemoPreviewArticle {
  title: string
  summary: string | null
  reason: string | null
  sourceName: string | null
  readingTimeMin: number | null
  topics: string[]
  url: string
}

export interface DemoPreview {
  previewId: string
  topicSlugs: string[]
  subject: string
  intro: string
  trendingTopic: string | null
  topicNames: string[]
  articles: DemoPreviewArticle[]
}
