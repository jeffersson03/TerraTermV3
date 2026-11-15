import { useEffect, useRef, useState } from "react";
import { INTRO_CONFIG } from "@/features/intro/constants/introConfig";

// Video vertical en pantallas verticales (si existe); si no, el horizontal.
function pickSource() {
  const { landscape, portrait } = INTRO_CONFIG.video;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  return isPortrait && portrait ? portrait : landscape;
}

// Video de la intro: sin audio y en línea (requisito de los navegadores para reproducir solo).
// onEnded → terminó; onFail → no existe, no se puede reproducir o no empezó a tiempo (→ logo).
function IntroVideo({ onEnded, onFail }) {
  const videoRef = useRef(null);
  const [source] = useState(pickSource); // se elige una vez (no cambia si se gira el móvil)

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let started = false;
    const markStarted = () => (started = true);
    video.addEventListener("playing", markStarted);

    // iOS en ahorro de batería u otras políticas pueden rechazar la reproducción automática
    video.play()?.catch(onFail);
    const startTimer = setTimeout(() => !started && onFail(), INTRO_CONFIG.videoStartTimeoutMs);

    return () => {
      clearTimeout(startTimer);
      video.removeEventListener("playing", markStarted);
    };
  }, [onFail]);

  return (
    <video
      ref={videoRef}
      src={source}
      poster={INTRO_CONFIG.video.poster ?? undefined}
      muted
      playsInline
      autoPlay
      preload="auto"
      onEnded={onEnded}
      onError={onFail}
      aria-hidden="true"
      className="h-full w-full bg-space-950 object-cover"
    />
  );
}

export default IntroVideo;
