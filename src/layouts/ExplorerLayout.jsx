import { Outlet } from "react-router";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useDockStore } from "@/stores/useDockStore";
import { AssistantFab, AssistantProvider } from "@/features/assistant";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

// Posición del robot: en el mapa 2D sube para no tapar la barra de pasos (FlowTimeline).
const ASSISTANT_POSITION = {
  globe: "right-6 bottom-6",
  country: "right-6 bottom-28",
};

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
        {/* Barra superior: solo el logo */}
        <header className="flex h-11 shrink-0 items-center border-b border-hud-border bg-space-900/90 px-4 backdrop-blur-md sm:h-12">
          <span className="text-sm font-semibold uppercase tracking-[0.08em]">
            Terra<span className="text-sensor-accent">Term</span>
          </span>
        </header>

        {/* Área de trabajo */}
        <main className="relative min-h-0 w-full flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Robot del asistente (fixed): abre el chat en el dock; se oculta con el dock abierto */}
        <AssistantFab
          position={ASSISTANT_POSITION[level] ?? ASSISTANT_POSITION.globe}
          hidden={isDockOpen}
          onOpen={() => openDockTab("assistant")}
        />
      </div>
    </AssistantProvider>
  );
}

export default ExplorerLayout;
