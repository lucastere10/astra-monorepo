"""Send email via Resend HTTP API."""

from __future__ import annotations

import requests

from ..config import Settings

_TIMEOUT = 30


def send_email(
    settings: Settings,
    *,
    to: str,
    subject: str,
    html: str,
) -> None:
    if not settings.resend_api_key:
        print(f"[deliver] RESEND_API_KEY not set. Skipping send to {to}: {subject}")
        return

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html,
        },
        timeout=_TIMEOUT,
    )
    if response.status_code >= 400:
        raise RuntimeError(
            f"Resend error {response.status_code}: {response.text[:300]}"
        )
