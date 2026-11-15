// Grupo de opciones tipo "chip" (una seleccionada). Base de VariableChips,
// PeriodChips y cualquier selector corto futuro.
function OptionChips({ label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.description}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent ${
              isActive
                ? "border-sensor-accent bg-sensor-accent font-semibold text-space-950"
                : "border-hud-border text-ink-secondary hover:border-sensor-accent/50 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default OptionChips;
