import { BRAND_NAME } from "@workspace/shared/branding"

export interface NewsletterArticleView {
  title: string
  summary: string | null
  reason: string | null
  sourceName: string | null
  readingTimeMin: number | null
  topics: string[]
  trackedUrl: string
}

export interface NewsletterTemplateData {
  subject: string
  intro: string
  articles: NewsletterArticleView[]
  trendingTopic: string | null
  toolOfTheWeek: NewsletterArticleView | null
  branding: string
  openPixelUrl: string
  unsubscribeUrl: string
  recipientEmail: string
  sample?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderArticle(article: NewsletterArticleView, index: number): string {
  const topics = article.topics
    .slice(0, 2)
    .map(
      (topic) =>
        `<span style="display:inline-block;background:#f5f5f4;color:#57534e;font-size:11px;padding:2px 8px;border-radius:999px;margin-right:6px">${escapeHtml(
          topic
        )}</span>`
    )
    .join("")

  const meta = [article.sourceName, article.readingTimeMin ? `${article.readingTimeMin} min read` : null]
    .filter(Boolean)
    .map((value) => escapeHtml(String(value)))
    .join(" &middot; ")

  return `
  <tr><td style="padding:20px 0;border-bottom:1px solid #e7e5e4">
    <div style="font-family:ui-monospace,monospace;font-size:12px;color:#b45309;margin-bottom:8px">
      ${String(index + 1).padStart(2, "0")} ${topics}
    </div>
    <a href="${article.trackedUrl}" style="color:#1c1917;text-decoration:none;font-size:16px;font-weight:600;line-height:1.4">
      ${escapeHtml(article.title)}
    </a>
    ${article.summary ? `<p style="color:#57534e;font-size:14px;line-height:1.6;margin:8px 0 0">${escapeHtml(article.summary)}</p>` : ""}
    ${article.reason ? `<p style="color:#78716c;font-size:13px;line-height:1.6;margin:8px 0 0"><strong>Why it matters:</strong> ${escapeHtml(article.reason)}</p>` : ""}
    ${meta ? `<p style="color:#a8a29e;font-size:12px;margin:10px 0 0">${meta}</p>` : ""}
  </td></tr>`
}

export function renderNewsletterHtml(data: NewsletterTemplateData): string {
  const articlesHtml = data.articles
    .map((article, index) => renderArticle(article, index))
    .join("")

  const toolHtml = data.toolOfTheWeek
    ? `
    <tr><td style="padding:24px 0 0">
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#b45309;margin:0 0 6px;font-weight:700">Tool of the week</p>
        <a href="${data.toolOfTheWeek.trackedUrl}" style="color:#1c1917;text-decoration:none;font-size:15px;font-weight:600">${escapeHtml(
          data.toolOfTheWeek.title
        )}</a>
      </div>
    </td></tr>`
    : ""

  const trendingHtml = data.trendingTopic
    ? `<p style="color:#78716c;font-size:13px;margin:8px 0 0">Trending topic: <strong>${escapeHtml(
        data.trendingTopic
      )}</strong></p>`
    : ""

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;background:#f5f5f4;padding:24px 0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4">
        <tr><td style="padding:28px 28px 0">
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#b45309;font-weight:700;margin:0">${escapeHtml(data.branding)}</p>
          <h1 style="font-size:22px;color:#1c1917;margin:6px 0 0">${escapeHtml(data.subject)}</h1>
          <p style="color:#57534e;font-size:14px;line-height:1.6;margin:12px 0 0">${escapeHtml(data.intro)}</p>
          ${trendingHtml}
        </td></tr>
        <tr><td style="padding:8px 28px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${articlesHtml}
          </table>
          ${toolHtml}
        </td></tr>
        <tr><td style="padding:24px 28px 28px">
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:0 0 16px" />
          <p style="color:#a8a29e;font-size:12px;line-height:1.6;margin:0">
            ${
              data.sample
                ? `This is a sample ${escapeHtml(data.branding)} edition sent to ${escapeHtml(
                    data.recipientEmail
                  )}. It is not a subscription.`
                : `You are receiving ${BRAND_NAME} because you subscribed with ${escapeHtml(
                    data.recipientEmail
                  )}.<br />
            <a href="${data.unsubscribeUrl}" style="color:#a8a29e">Unsubscribe</a>`
            }
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${
    data.sample
      ? ""
      : `<img src="${data.openPixelUrl}" width="1" height="1" alt="" style="display:none" />`
  }
</body>
</html>`
}
