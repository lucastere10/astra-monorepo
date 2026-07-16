"""HTML email template for Astra digests."""

from __future__ import annotations

from dataclasses import dataclass
from html import escape


@dataclass
class ArticleView:
    title: str
    summary: str | None
    reason: str | None
    source_name: str | None
    reading_time_min: int | None
    topics: list[str]
    tracked_url: str


@dataclass
class TemplateData:
    subject: str
    intro: str
    articles: list[ArticleView]
    trending_topic: str | None
    tool_of_the_week: ArticleView | None
    open_pixel_url: str
    unsubscribe_url: str
    recipient_email: str
    branding: str


def _render_article(article: ArticleView, index: int) -> str:
    topics = "".join(
        f'<span style="display:inline-block;background:#f5f5f4;color:#57534e;'
        f'font-size:11px;padding:2px 8px;border-radius:999px;margin-right:6px">'
        f"{escape(topic)}</span>"
        for topic in article.topics[:2]
    )
    meta_parts = [
        escape(article.source_name) if article.source_name else None,
        f"{article.reading_time_min} min read"
        if article.reading_time_min
        else None,
    ]
    meta = " &middot; ".join(p for p in meta_parts if p)

    summary = (
        f'<p style="color:#57534e;font-size:14px;line-height:1.6;margin:8px 0 0">'
        f"{escape(article.summary)}</p>"
        if article.summary
        else ""
    )
    reason = (
        f'<p style="color:#78716c;font-size:13px;line-height:1.6;margin:8px 0 0">'
        f"<strong>Why it matters:</strong> {escape(article.reason)}</p>"
        if article.reason
        else ""
    )
    meta_html = (
        f'<p style="color:#a8a29e;font-size:12px;margin:10px 0 0">{meta}</p>'
        if meta
        else ""
    )

    return f"""
  <tr><td style="padding:20px 0;border-bottom:1px solid #e7e5e4">
    <div style="font-family:ui-monospace,monospace;font-size:12px;color:#b45309;margin-bottom:8px">
      {str(index + 1).zfill(2)} {topics}
    </div>
    <a href="{escape(article.tracked_url, quote=True)}" style="color:#1c1917;text-decoration:none;font-size:16px;font-weight:600;line-height:1.4">
      {escape(article.title)}
    </a>
    {summary}
    {reason}
    {meta_html}
  </td></tr>"""


def render_newsletter_html(data: TemplateData) -> str:
    articles_html = "".join(
        _render_article(article, index)
        for index, article in enumerate(data.articles)
    )

    tool_html = ""
    if data.tool_of_the_week:
        tool = data.tool_of_the_week
        tool_html = f"""
    <tr><td style="padding:24px 0 0">
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#b45309;margin:0 0 6px;font-weight:700">Tool of the week</p>
        <a href="{escape(tool.tracked_url, quote=True)}" style="color:#1c1917;text-decoration:none;font-size:15px;font-weight:600">{escape(tool.title)}</a>
      </div>
    </td></tr>"""

    trending_html = ""
    if data.trending_topic:
        trending_html = (
            f'<p style="color:#78716c;font-size:13px;margin:8px 0 0">'
            f"Trending topic this week: <strong>{escape(data.trending_topic)}</strong></p>"
        )

    return f"""<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;background:#f5f5f4;padding:24px 0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4">
        <tr><td style="padding:28px 28px 0">
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#b45309;font-weight:700;margin:0">{escape(data.branding)}</p>
          <h1 style="font-size:22px;color:#1c1917;margin:6px 0 0">{escape(data.subject)}</h1>
          <p style="color:#57534e;font-size:14px;line-height:1.6;margin:12px 0 0">{escape(data.intro)}</p>
          {trending_html}
        </td></tr>
        <tr><td style="padding:8px 28px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            {articles_html}
          </table>
          {tool_html}
        </td></tr>
        <tr><td style="padding:24px 28px 28px">
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:0 0 16px" />
          <p style="color:#a8a29e;font-size:12px;line-height:1.6;margin:0">
            You are receiving Astra because you subscribed with {escape(data.recipient_email)}.<br />
            <a href="{escape(data.unsubscribe_url, quote=True)}" style="color:#a8a29e">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <img src="{escape(data.open_pixel_url, quote=True)}" width="1" height="1" alt="" style="display:none" />
</body>
</html>"""
