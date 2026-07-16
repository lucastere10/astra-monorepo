import "server-only"

import {
  createEvent,
  type DomainEvent,
  type DomainEventMap,
  type DomainEventName,
} from "@workspace/shared/events"

type Handler<T extends DomainEventName> = (
  event: DomainEvent<T>
) => void | Promise<void>

const handlers = new Map<DomainEventName, Handler<DomainEventName>[]>()

export function registerHandler<T extends DomainEventName>(
  name: T,
  handler: Handler<T>
): void {
  const list = handlers.get(name) ?? []
  list.push(handler as Handler<DomainEventName>)
  handlers.set(name, list)
}

/**
 * Dispatch a domain event to all registered handlers. Handlers run
 * fire-and-forget and never throw back to the caller, so emitting an event is
 * safe inside request handling. This in-process bus can later be swapped for a
 * message broker without changing call sites.
 */
export function dispatchEvent<T extends DomainEventName>(
  name: T,
  payload: DomainEventMap[T]
): void {
  const event = createEvent(name, payload)
  const list = handlers.get(name)
  if (!list || list.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[events] ${name}`, payload)
    }
    return
  }

  for (const handler of list) {
    Promise.resolve()
      .then(() => handler(event))
      .catch((error) => {
        console.error(`[events] handler for ${name} failed`, error)
      })
  }
}
