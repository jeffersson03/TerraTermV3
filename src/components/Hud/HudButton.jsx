const VARIANT_CLASSES = {
  primary: "border border-sensor-accent/60 text-sensor-accent hover:bg-sensor-glow",
  ghost: "border border-transparent text-ink-secondary hover:bg-space-800 hover:text-ink",
};

// Botón estándar. Toma el color de la vista activa (`*-sensor-accent`).
// `icon`: componente de lucide-react. Si no hay texto, pasa `aria-label`.
function HudButton({ variant = "primary", icon: Icon, type = "button", className = "", children, ...rest }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary} ${className}`}
      {...rest}
    >
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export default HudButton;
