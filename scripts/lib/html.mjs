const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

export function attrs(record) {
  return Object.entries(record)
    .filter(([, value]) => value !== false && value != null)
    .map(([name, value]) => ` ${name}="${escapeHtml(value === true ? "" : value)}"`)
    .join("");
}

export function jsonLd(value) {
  const serialized = JSON.stringify(value).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${serialized}</script>`;
}
