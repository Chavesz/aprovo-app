// Markdown mínimo usado pelos enunciados (imagens, negrito, itálico, parágrafos).
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function md(src: string): string {
  return esc(src)
    .split(/\n{2,}/)
    .map((bloco) =>
      bloco
        // Quebra de linha do PDF no meio da frase (próxima linha começa em minúscula) vira espaço.
        .replace(/([^.:;?!\n])\n(?=[a-zà-ú("“])/g, '$1 ')
        .replace(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g, '<img src="$1" alt="Figura da questão" loading="lazy" />')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/ {2}\n|\n/g, '<br />')
    )
    .filter((b) => b.trim())
    .map((b) => `<p>${b}</p>`)
    .join('');
}

/** Cebraspe: alguns comandos trazem o fim cortado do texto associado antes de **Item:**; mostra só o item. */
export function comandoExibido(c: string): string {
  const t = c.trim();
  const i = t.indexOf('**Item:**');
  return i > 0 && /^[a-zà-ú]/.test(t) ? t.slice(i) : c;
}
