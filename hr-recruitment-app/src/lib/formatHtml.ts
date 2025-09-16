export function htmlToPlainText(html: string): string {
  if (!html) return "";

  let text = html;

  // Normalize newlines
  text = text.replace(/\r\n/g, "\n");

  // Replace common block/line break tags with newlines
  text = text.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  text = text.replace(/<\s*\/p\s*>/gi, "\n");
  text = text.replace(/<\s*p\b[^>]*>/gi, "");

  // Convert list items to bullets and newlines
  text = text.replace(/<\s*li\b[^>]*>/gi, "• ");
  text = text.replace(/<\s*\/li\s*>/gi, "\n");
  text = text.replace(/<\s*ul\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/ul\s*>/gi, "\n");
  text = text.replace(/<\s*ol\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/ol\s*>/gi, "\n");

  // Headings -> keep content with a newline
  text = text.replace(/<\s*h[1-6]\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/h[1-6]\s*>/gi, "\n");

  // Tables -> separate cells/rows with delimiters
  text = text.replace(/<\s*tr\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/tr\s*>/gi, "\n");
  text = text.replace(/<\s*td\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/td\s*>/gi, "\t");
  text = text.replace(/<\s*th\b[^>]*>/gi, "");
  text = text.replace(/<\s*\/th\s*>/gi, "\t");

  // Replace horizontal rule with a divider line
  text = text.replace(/<\s*hr\s*\/?\s*>/gi, "\n———\n");

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode a few common HTML entities
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  Object.entries(entities).forEach(([k, v]) => {
    const re = new RegExp(k, 'g');
    text = text.replace(re, v);
  });

  // Collapse excessive whitespace
  text = text.replace(/[\t ]+/g, ' ');
  text = text.replace(/\u00A0/g, ' '); // non-breaking space

  // Normalize multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
