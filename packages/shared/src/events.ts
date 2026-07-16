/**
 * Domain event contracts for the Astra event system.
 *
 * Events describe meaningful state transitions in the platform and can be
 * dispatched to in-process handlers today and to a message broker later
 * without changing call sites.
 */

export const DOMAIN_EVENTS = {
  NewsletterCreated: "newsletter.created",
  NewsletterSent: "newsletter.sent",
  ArticleCollected: "article.collected",
  ArticleRanked: "article.ranked",
  ArticleClicked: "article.clicked",
  PreferenceUpdated: "preference.updated",
  WorkerFinished: "worker.finished",
} as const

export type DomainEventName =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS]

export interface DomainEventMap {
  [DOMAIN_EVENTS.NewsletterCreated]: { newsletterId: string; userId: string }
  [DOMAIN_EVENTS.NewsletterSent]: { newsletterId: string; userId: string }
  [DOMAIN_EVENTS.ArticleCollected]: { articleId: string; sourceId?: string }
  [DOMAIN_EVENTS.ArticleRanked]: { articleId: string; score: number }
  [DOMAIN_EVENTS.ArticleClicked]: { articleId: string; userId?: string }
  [DOMAIN_EVENTS.PreferenceUpdated]: { userId: string }
  [DOMAIN_EVENTS.WorkerFinished]: {
    workerName: string
    status: "SUCCESS" | "FAILED"
    itemsProcessed: number
  }
}

export interface DomainEvent<T extends DomainEventName = DomainEventName> {
  name: T
  payload: DomainEventMap[T]
  occurredAt: Date
}

export function createEvent<T extends DomainEventName>(
  name: T,
  payload: DomainEventMap[T]
): DomainEvent<T> {
  return { name, payload, occurredAt: new Date() }
}
