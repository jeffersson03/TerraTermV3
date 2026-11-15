import { formatNumber } from "@/utils/formatValues";

// Leyenda de una escala de color. `palette` y `range` deben venir del catálogo
// de variables: es la MISMA paleta que usa el shader del globo.
function ColorLegend({ title, palette, range, unit, className = "" }) {
  if (!palette?.length || !range) return null;

  const [min, max] = range;
  const mid = (min + max) / 2;
  const gradient = `linear-gradient(to right, ${palette.join(", ")})`;
  const description = `${title ? `${title}: ` : ""}escala de ${formatNumber(min)} a ${formatNumber(max)} ${unit}`;

  return (
    <figure className={`flex flex-col gap-1 ${className}`}>
      {title && <figcaption className="text-[11px] uppercase tracking-wider text-ink-secondary">{title}</figcaption>}

      {/* El color es dinámico (viene del catálogo), por eso va en style */}
      <div role="img" aria-label={description} className="h-2 w-full rounded-full" style={{ background: gradient }} />

      <div className="flex justify-between font-mono text-[10px] tabular-nums text-ink-muted">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(mid)}</span>
        <span>
          {formatNumber(max)} {unit}
        </span>
      </div>
    </figure>
  );
}

export default ColorLegend;
