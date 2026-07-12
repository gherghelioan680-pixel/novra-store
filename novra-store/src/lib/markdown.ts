/** Lightweight markdown-to-HTML for blog articles (no external deps). */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-purple-400 hover:text-purple-300 underline underline-offset-2">$1</a>'
  );
  return result;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      const cls =
        level === 1
          ? "text-2xl font-bold text-white mt-8 mb-4"
          : level === 2
            ? "text-xl font-semibold text-white mt-6 mb-3"
            : "text-lg font-semibold text-gray-200 mt-4 mb-2";
      html.push(`<${tag} class="${cls}">${inlineFormat(headingMatch[2])}</${tag}>`);
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        html.push('<ul class="list-disc list-inside space-y-2 text-gray-300 my-4">');
        inList = true;
      }
      html.push(`<li>${inlineFormat(listMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="text-gray-300 leading-relaxed mb-4">${inlineFormat(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}
