import { MarkdownTextPrimitive, memoizeMarkdownComponents } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

// Muestra las respuestas del modelo con formato (negritas, listas, tablas, código, enlaces),
// con los colores del asistente. Se usa como componente "Text" de MessagePrimitive.Parts.
function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="flex flex-col gap-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      components={markdownComponents}
      smooth
    />
  );
}

// Cada elemento ignora la clase que trae el markdown: `className` va después del spread y la reemplaza.
// (Integración: `font-display` → `font-sans`, porque theme.css del proyecto no define --font-display.)
const markdownComponents = memoizeMarkdownComponents({
  p: (props) => <p {...props} className="leading-relaxed" />,
  strong: (props) => <strong {...props} className="font-semibold text-white" />,
  em: (props) => <em {...props} className="text-bot-ink-soft" />,
  a: (props) => (
    <a {...props} className="font-medium text-bot-accent-soft underline underline-offset-2 hover:text-white" target="_blank" rel="noreferrer" />
  ),
  h1: (props) => <h3 {...props} className="mt-1 font-sans text-base font-semibold text-white" />,
  h2: (props) => <h3 {...props} className="mt-1 font-sans text-[15px] font-semibold text-white" />,
  h3: (props) => <h4 {...props} className="mt-1 font-sans text-sm font-semibold text-white" />,
  ul: (props) => (
    <ul {...props} className="flex flex-col gap-1 pl-5 marker:text-bot-accent-soft [list-style-type:disc]" />
  ),
  ol: (props) => (
    <ol {...props} className="flex flex-col gap-1 pl-5 marker:font-semibold marker:text-bot-accent-soft [list-style-type:decimal]" />
  ),
  li: (props) => <li {...props} className="pl-0.5 leading-relaxed" />,
  blockquote: (props) => (
    <blockquote {...props} className="border-l-2 border-bot-accent-soft pl-3 text-bot-ink-soft italic" />
  ),
  hr: (props) => <hr {...props} className="border-white/10" />,
  code: (props) => (
    <code {...props} className="rounded bg-black/25 px-1 py-0.5 font-mono text-[12.5px] text-bot-accent-soft" />
  ),
  pre: (props) => (
    <pre {...props} className="bot-scroll overflow-x-auto rounded-lg bg-black/25 p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-bot-ink" />
  ),
  table: (props) => (
    <div className="bot-scroll overflow-x-auto rounded-lg border border-white/10">
      <table {...props} className="w-full border-collapse text-xs" />
    </div>
  ),
  th: (props) => <th {...props} className="bg-white/5 px-2 py-1.5 text-left font-semibold text-white" />,
  td: (props) => <td {...props} className="border-t border-white/10 px-2 py-1.5" />,
});

export default MarkdownText;
