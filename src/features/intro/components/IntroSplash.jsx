import { useCallback, useEffect, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { INTRO_CONFIG } from "@/features/intro/constants/introConfig";
import { useIntroGate } from "@/features/intro/hooks/useIntroGate";
import IntroVideo from "@/features/intro/components/IntroVideo";
import IntroLogo from "@/features/intro/components/IntroLogo";

const PORTAL_EASE = [0.65, 0, 0.35, 1];
const PORTAL_END_VMAX = 150; // radio final: cubre las esquinas de cualquier pantalla

// Intro de carga a pantalla completa. La app se monta DEBAJO desde el principio, así el globo
// y sus texturas cargan mientras se ve el video (o el logo animado si no hay video).
// Salida: «portal» que se abre desde el centro dejando ver el globo, con un anillo de luz
// en el borde mientras la intro se aleja y se desenfoca. Con movimiento reducido: fundido simple.
function IntroSplash() {
  const gate = useIntroGate();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [useLogo, setUseLogo] = useState(reducedMotion);

  // Radio del agujero del portal (en vmax) → máscara y anillo
  const radius = useMotionValue(0);
  // Sin máscara hasta que empieza la salida (con radio 0 quedaría un punto translúcido en el centro)
  const mask = useTransform(radius, (value) =>
    value <= 0 ? "none" : `radial-gradient(circle at 50% 50%, transparent ${value}vmax, #000 ${value + 0.8}vmax)`
  );
  const ringSize = useTransform(radius, (value) => `${value * 2}vmax`);
  const ringOpacity = useTransform(radius, [0, 8, PORTAL_END_VMAX * 0.7, PORTAL_END_VMAX], [0, 1, 0.6, 0]);
  const contentScale = useTransform(radius, [0, PORTAL_END_VMAX], [1, 1.25]);
  const contentBlur = useTransform(radius, [0, PORTAL_END_VMAX], ["blur(0px)", "blur(10px)"]);

  const { isVisible, isLeaving, complete } = gate;
  useEffect(() => {
    if (!isVisible || !isLeaving) return;
    if (reducedMotion) {
      const timer = setTimeout(complete, 400);
      return () => clearTimeout(timer);
    }
    const controls = animate(radius, PORTAL_END_VMAX, {
      duration: INTRO_CONFIG.exitDurationS,
      ease: PORTAL_EASE,
      onComplete: complete,
    });
    return () => controls.stop();
  }, [isVisible, isLeaving, reducedMotion, radius, complete]);

  const handleVideoFail = useCallback(() => setUseLogo(true), []);

  if (!isVisible) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Cargando TerraTerm"
      className="fixed inset-0 z-[100] overflow-hidden"
      style={reducedMotion ? undefined : { maskImage: mask, WebkitMaskImage: mask }}
      animate={reducedMotion && isLeaving ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="h-full w-full" style={reducedMotion ? undefined : { scale: contentScale, filter: contentBlur }}>
        {useLogo ? (
          <IntroLogo durationMs={INTRO_CONFIG.fallbackDurationMs} reducedMotion={reducedMotion} onDone={gate.finishMedia} />
        ) : (
          <IntroVideo onEnded={gate.finishMedia} onFail={handleVideoFail} />
        )}
      </motion.div>

      {/* Anillo de luz en el borde del portal */}
      {!reducedMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sensor-accent shadow-[0_0_40px_6px_var(--sensor-accent)]"
          style={{ width: ringSize, height: ringSize, opacity: ringOpacity }}
        />
      )}

      {/* El video terminó pero el globo aún carga */}
      <AnimatePresence>
        {gate.isWaitingForApp && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-16 mx-auto flex w-56 flex-col items-center gap-2"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-secondary">Preparando el globo…</span>
            <span className="relative h-0.5 w-full overflow-hidden rounded-full bg-hud-border">
              <motion.span
                className="absolute inset-y-0 w-1/3 rounded-full bg-sensor-accent"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gate.canSkip && (
          <motion.button
            type="button"
            onClick={gate.skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 min-h-11 rounded-full border border-hud-border bg-space-900/70 px-4 font-mono text-xs uppercase tracking-wider text-ink-secondary backdrop-blur-md transition-colors hover:border-sensor-accent hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-sensor-accent sm:right-6"
          >
            Saltar
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default IntroSplash;
