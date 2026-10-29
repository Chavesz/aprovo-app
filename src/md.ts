// Markdown mínimo usado pelos enunciados (imagens, negrito, itálico, parágrafos).
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function md(src: string): string {
  return esc(src)
    .split(/\n{2,}/)
    .map((bloco) =>
      bloco
        .replace(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g, '<img src="$1" alt="Figura da questão" loading="lazy" />')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/ {2}\n|\n/g, '<br />')
    )
    .filter((b) => b.trim())
    .map((b) => `<p>${b}</p>`)
    .join('');
}
