"""Entry point for the Astra collector worker.

Run with:
  collector collect   # collect + enrich + embed + dedup
  collector deliver   # auto-send due newsletters
  collector           # defaults to collect (back-compat)
"""

from __future__ import annotations

import sys

from . import repository
from .config import Settings
from .db import connection
from .delivery import run_deliver
from .pipeline import process_source

COLLECT_WORKER = "collector"
DELIVER_WORKER = "deliver"


def run_collect() -> int:
    settings = Settings.from_env()

    with connection(settings) as conn:
        sources = repository.fetch_active_sources(conn)
        topic_map = repository.fetch_topic_map(conn)
        worker_id = repository.start_worker(conn, COLLECT_WORKER)

    print(
        f"[collector] starting run {worker_id} with {len(sources)} active sources"
    )

    total = 0
    try:
        for source in sources:
            with connection(settings) as conn:
                count = process_source(conn, source, topic_map, settings)
            total += count
            print(f"[collector] {source.name}: +{count} articles")

        with connection(settings) as conn:
            repository.finish_worker(
                conn,
                worker_id,
                status="SUCCESS",
                items_processed=total,
                logs=f"Processed {len(sources)} sources, inserted {total} articles.",
            )
    except Exception as exc:  # noqa: BLE001
        with connection(settings) as conn:
            repository.finish_worker(
                conn,
                worker_id,
                status="FAILED",
                items_processed=total,
                error=str(exc),
            )
        print(f"[collector] run failed: {exc}", file=sys.stderr)
        raise

    print(f"[collector] done. inserted {total} articles total.")
    return total


def run_deliver_job() -> int:
    settings = Settings.from_env()

    with connection(settings) as conn:
        worker_id = repository.start_worker(conn, DELIVER_WORKER)

    print(f"[deliver] starting run {worker_id}")
    sent = 0
    try:
        with connection(settings) as conn:
            sent = run_deliver(conn, settings)
            repository.finish_worker(
                conn,
                worker_id,
                status="SUCCESS",
                items_processed=sent,
                logs=f"Sent {sent} newsletters.",
            )
    except Exception as exc:  # noqa: BLE001
        with connection(settings) as conn:
            repository.finish_worker(
                conn,
                worker_id,
                status="FAILED",
                items_processed=sent,
                error=str(exc),
            )
        print(f"[deliver] run failed: {exc}", file=sys.stderr)
        raise

    print(f"[deliver] done. sent {sent} newsletters.")
    return sent


def main(argv: list[str] | None = None) -> None:
    args = list(argv if argv is not None else sys.argv[1:])
    command = args[0] if args else "collect"

    if command in {"collect", "run"}:
        run_collect()
    elif command == "deliver":
        run_deliver_job()
    elif command in {"-h", "--help", "help"}:
        print(__doc__)
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print("Usage: collector [collect|deliver]", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
