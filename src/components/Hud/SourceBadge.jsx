import StatusBadge from "@/components/Hud/StatusBadge";
import { formatDate, formatPeriod } from "@/utils/formatValues";

// Procedencia de un bloque de datos: tipo · fuente · periodo · resolución · consulta.
// Recibe el `meta` del formato común de servicios (services/api/serviceResponse.js).
function SourceBadge({ meta, className = "" }) {
  if (!meta) return null;

  const details = [
    meta.source,
    meta.period && formatPeriod(meta.period),
    meta.resolution,
    meta.fetchedAt && `consultado ${formatDate(meta.fetchedAt)}`,
  ].filter(Boolean);

  return (
    <div className={`flex flex-col gap-1 text-[11px] text-ink-muted ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusBadge kind={meta.kind} />
        <span>{details.join(" · ")}</span>
      </div>
      {meta.notes && <p>{meta.notes}</p>}
    </div>
  );
}

export default SourceBadge;
