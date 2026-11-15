import StatusBadge from "@/components/Hud/StatusBadge";
import { formatDate, formatPeriod } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Procedencia de un bloque de datos: tipo · fuente · periodo · resolución · consulta.
// Recibe el `meta` del formato común de servicios (services/api/serviceResponse.js).
// Si el servicio manda claves (`resolutionKey`, `notesKey`), se traducen al idioma activo;
// si no, se muestran los textos tal cual.
function SourceBadge({ meta, className = "" }) {
  const { t, locale } = useT();
  if (!meta) return null;

  const resolution = meta.resolutionKey ? t(meta.resolutionKey, meta.resolutionVars) : meta.resolution;
  const notes = meta.notesKey ? t(meta.notesKey) : meta.notes;
  const details = [
    meta.source,
    meta.period && formatPeriod(meta.period, locale),
    resolution,
    meta.fetchedAt && t("source.fetched", { date: formatDate(meta.fetchedAt, locale) }),
  ].filter(Boolean);

  return (
    <div className={`flex flex-col gap-1 text-[11px] text-ink-muted ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusBadge kind={meta.kind} />
        <span>{details.join(" · ")}</span>
      </div>
      {notes && <p>{notes}</p>}
    </div>
  );
}

export default SourceBadge;
