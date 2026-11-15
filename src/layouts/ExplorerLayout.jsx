import { Outlet } from "react-router";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useDockStore } from "@/stores/useDockStore";
import { AssistantFab, AssistantProvider } from "@/features/assistant";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import IntroSplash from "@/features/intro/components/IntroSplash";
import LanguageSwitch from "@/components/Hud/LanguageSwitch";

// Robot flotante: solo en el globo 3D (en el 2D el asistente es una pestaña junto a Tendencias).
// En móvil va arriba a la derecha para no tapar la consola del sensor; en pantallas grandes, abajo.
const ASSISTANT_POSITION = "right-3 top-14 sm:top-auto sm:bottom-6 sm:right-6";

// Marco del explorador: barra superior fija con el logo + área de trabajo.
// La barra es fija (no se despliega al pasar el mouse) para no tapar el dock ni el HUD
// y para funcionar igual en pantallas táctiles.
// `data-sensor` define la vista activa: todo lo que esté dentro usa sus colores.
// El dominio sale de useTelemetryStore (única fuente de verdad).
function ExplorerLayout() {
  const domain = useTelemetryStore((state) => state.domain);
  const level = useExplorerStore((state) => state.level);
  const isDockOpen = useDockStore((state) => state.activeTab !== null);
  const openDockTab = useDockStore((state) => state.openTab);

  return (
    <AssistantProvider>
      <div data-sensor={domain} className="relative flex h-dvh w-full flex-col overflow-hidden bg-space-950 text-ink">
        {/* Barra superior: logo + selector de idioma */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-hud-border bg-space-900/90 px-4 backdrop-blur-md sm:h-12">
          <span className="text-sm font-semibold uppercase tracking-[0.08em]">
            Terra<span className="text-sensor-accent">Term</span>
          </span>
          <LanguageSwitch />
        </header>

        {/* Área de trabajo */}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Robot del asistente (fixed): abre el chat en el dock; se oculta con el dock abierto */}
        <AssistantFab
          position={ASSISTANT_POSITION}
          hidden={isDockOpen || level !== "globe"}
          onOpen={() => openDockTab("assistant")}
        />

        {/* Intro de carga (video o logo animado) encima de todo; la app carga debajo */}
        <IntroSplash />
      </div>
    </AssistantProvider>
  );
}

export default ExplorerLayout;
