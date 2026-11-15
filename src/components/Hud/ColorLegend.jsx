import { formatNumber } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Leyenda de una escala de color. `palette` y `range` deben venir del catálogo
// de variables: es la MISMA paleta que usa el shader del globo.
function ColorLegend({ title, palette, range, unit, className = "" }) {
  const { t, locale } = useT();
  if (!palette?.length || !range) return null;

  const [min, max] = range;
  const mid = (min + max) / 2;
  const gradient = `linear-gradient(to right, ${palette.join(", ")})`;
  const description = `${title ? `${title}: ` : ""}${t("legend.scale", { min: formatNumber(min, 1, locale), max: formatNumber(max, 1, locale), unit })}`;

  return (
    <figure className={`flex flex-col gap-1 ${className}`}>
      {title && <figcaption className="text-[11px] uppercase tracking-wider text-ink-secondary">{title}</figcaption>}

      {/* El color es dinámico (viene del catálogo), por eso va en style */}
      <div role="img" aria-label={description} className="h-2 w-full rounded-full" style={{ background: gradient }} />

      <div className="flex justify-between font-mono text-[10px] tabular-nums text-ink-muted">
        <span>{formatNumber(min, 1, locale)}</span>
        <span>{formatNumber(mid, 1, locale)}</span>
        <span>
          {formatNumber(max, 1, locale)} {unit}
        </span>
      </div>
    </figure>
  );
}

export default ColorLegend;
