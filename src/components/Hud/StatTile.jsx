import StatusBadge from "@/components/Hud/StatusBadge";
import { formatNumber } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Indicador numérico: etiqueta, valor con unidad, variación opcional y tipo de dato.
// La variación se muestra neutra (▲/▼): subir no es "bueno" ni "malo" por sí solo.
function StatTile({ label, value, unit, delta, kind, decimals = 1, className = "" }) {
  const { t, locale } = useT();
  const hasDelta = delta !== null && delta !== undefined && !Number.isNaN(delta);

  return (
    <div className={`flex flex-col gap-1 rounded-sm border border-hud-border bg-space-900/70 p-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-ink-secondary">{label}</span>
        {kind && <StatusBadge kind={kind} />}
      </div>

      <p className="font-mono text-xl tabular-nums text-ink">
        {formatNumber(value, decimals, locale)}
        {unit && <span className="ml-1 text-sm text-ink-secondary">{unit}</span>}
      </p>

      {hasDelta && (
        <p className="font-mono text-[11px] tabular-nums text-ink-secondary">
          <span aria-hidden="true">{delta >= 0 ? "▲" : "▼"} </span>
          <span className="sr-only">{delta >= 0 ? t("stat.increase") : t("stat.decrease")} </span>
          {formatNumber(Math.abs(delta), decimals, locale)} {unit}
        </p>
      )}
    </div>
  );
}

export default StatTile;
