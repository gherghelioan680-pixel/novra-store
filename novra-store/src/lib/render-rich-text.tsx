import Link from "next/link";
import type { ReactNode } from "react";

export type RichTextLink = {
  tag: string;
  href: string;
  external?: boolean;
};

export function renderRichText(text: string, links: RichTextLink[]): ReactNode {
  if (!links.length) return text;

  const tagNames = links.map((l) => l.tag).join("|");
  const regex = new RegExp(`<(${tagNames})>(.*?)</\\1>`, "g");
  const linkMap = Object.fromEntries(links.map((l) => [l.tag, l]));

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const config = linkMap[match[1]];
    const content = match[2];

    if (config) {
      if (config.external) {
        parts.push(
          <a
            key={`${match.index}-${config.tag}`}
            href={config.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            {content}
          </a>
        );
      } else {
        parts.push(
          <Link key={`${match.index}-${config.tag}`} href={config.href} className="text-purple-400 hover:underline">
            {content}
          </Link>
        );
      }
    } else {
      parts.push(content);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export const LEGAL_LINKS: RichTextLink[] = [
  { tag: "shippingLink", href: "/livrare-si-plata" },
  { tag: "warrantyLink", href: "/garantie-si-retur" },
  { tag: "catalogLink", href: "/produse" },
  { tag: "contactLink", href: "/contact" },
  { tag: "privacyLink", href: "/politica-confidentialitate" },
  { tag: "affiliateTermsLink", href: "/termeni-program-afiliere" },
  { tag: "cookieLink", href: "/politica-cookies" },
  { tag: "faqLink", href: "/faq" },
  { tag: "termsLink", href: "/termeni-si-conditii" },
];

export const FAQ_LINKS: RichTextLink[] = [
  { tag: "catalogLink", href: "/produse" },
  { tag: "shippingLink", href: "/livrare-si-plata" },
  { tag: "contactLink", href: "/contact" },
  { tag: "warrantyLink", href: "/garantie-si-retur" },
];
