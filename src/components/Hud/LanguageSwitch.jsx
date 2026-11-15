import { LANGUAGES, useLanguageStore } from "@/i18n/languageStore";
import { useT } from "@/i18n/useT";

// Selector de idioma ES / EN (barra superior). Botones táctiles; el activo usa el color de la vista.
function LanguageSwitch({ className = "" }) {
  const { lang, t } = useT();
  const setLang = useLanguageStore((state) => state.setLang);

  return (
    <div role="group" aria-label={t("language.switch")} className={`flex rounded-md border border-hud-border p-0.5 ${className}`}>
      {Object.values(LANGUAGES).map((language) => {
        const isActive = language.id === lang;
        return (
          <button
            key={language.id}
            type="button"
            lang={language.id}
            aria-pressed={isActive}
            aria-label={language.name}
            onClick={() => setLang(language.id)}
            className={`min-h-8 min-w-9 rounded px-2 font-mono text-[11px] tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent ${
              isActive ? "bg-space-800 text-sensor-accent" : "text-ink-muted hover:text-ink"
            }`}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitch;
