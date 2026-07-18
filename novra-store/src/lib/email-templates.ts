import "server-only";

import { getStripeCheckoutOrigin } from "./stripe-server";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatRon(value: number): string {
  return `${value.toFixed(2)} RON`;
}

export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return getStripeCheckoutOrigin();
}

export function getLogoUrl(): string {
  return `${getSiteOrigin()}/logo.png`;
}

export function emailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px auto 0;">
  <tr>
    <td align="center" style="border-radius:999px;background:#111111;">
      <a href="${safeHref}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;border:1px solid #111111;">${safeLabel}</a>
    </td>
  </tr>
</table>`;
}

export function emailSecondaryButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:16px auto 0;">
  <tr>
    <td align="center" style="border-radius:999px;background:#ffffff;border:1px solid #e5e7eb;">
      <a href="${safeHref}" style="display:inline-block;padding:12px 24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;color:#111111;text-decoration:none;border-radius:999px;">${safeLabel}</a>
    </td>
  </tr>
</table>`;
}

export function highlightBox(label: string, value: string, subtext?: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;">
  <tr>
    <td align="center" style="padding:20px 24px;">
      <p style="margin:0 0 6px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">${escapeHtml(label)}</p>
      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:22px;font-weight:700;color:#111111;">${escapeHtml(value)}</p>
      ${subtext ? `<p style="margin:8px 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#6b7280;">${escapeHtml(subtext)}</p>` : ""}
    </td>
  </tr>
</table>`;
}

export function infoPanel(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;">
  <tr>
    <td style="padding:18px 20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:#374151;">${content}</td>
  </tr>
</table>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#111111;">${text}</p>`;
}

export function wrapEmailHtml(title: string, body: string, subtitle?: string): string {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
  const logoUrl = escapeHtml(getLogoUrl());
  const siteUrl = escapeHtml(getSiteOrigin());

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(17,17,17,0.06);">
          <tr>
            <td align="center" style="padding:28px 28px 12px;background:#ffffff;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="NOVRA" width="120" style="display:block;width:120px;max-width:120px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;background:#ffffff;">
              <h1 style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#111111;">${safeTitle}</h1>
              ${safeSubtitle ? `<p style="margin:8px 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">${safeSubtitle}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;background:#ffffff;">${body}</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e5e7eb;">
                <tr>
                  <td align="center" style="padding-top:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.7;color:#6b7280;">
                    <a href="${siteUrl}" style="color:#111111;text-decoration:none;font-weight:600;">novra.ro</a>
                    ·
                    <a href="mailto:contact@novra.ro" style="color:#111111;text-decoration:none;">contact@novra.ro</a>
                    <br>
                    <span style="color:#9ca3af;">© NOVRA — Cabluri &amp; adaptoare premium</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
