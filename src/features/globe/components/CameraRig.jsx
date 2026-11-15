import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { useMapStore } from "@/stores/useMapStore";
import { latLonToCartesian } from "@/features/globe/utils/geoMath";

const FLY_SPEED = 2.6; // mayor = vuelo más rápido
const ANGLE_EPSILON = 0.0005;
const DISTANCE_EPSILON = 0.001;

// Objetos reutilizados en cada frame (sin crear basura para el GC)
const fromDirection = new Vector3();
const fullRotation = new Quaternion();
const stepRotation = new Quaternion();

// Vuela la cámara hasta useMapStore.cameraTarget ({ lat, lon, distance }).
// Rota sobre la esfera (no atraviesa el planeta) y ajusta la distancia a la vez.
// Si el usuario arrastra el globo, el vuelo se cancela.
function CameraRig() {
  const cameraTarget = useMapStore((state) => state.cameraTarget);
  const controls = useThree((state) => state.controls);
  const flight = useRef(null);

  useEffect(() => {
    if (!cameraTarget) return;
    const direction = new Vector3(...latLonToCartesian(cameraTarget.lat, cameraTarget.lon, 1)).normalize();
    flight.current = { direction, distance: cameraTarget.distance ?? null };
  }, [cameraTarget]);

  useEffect(() => {
    if (!controls) return;
    const cancelFlight = () => {
      flight.current = null;
    };
    controls.addEventListener("start", cancelFlight);
    return () => controls.removeEventListener("start", cancelFlight);
  }, [controls]);

  useFrame((state, delta) => {
    const target = flight.current;
    if (!target) return;

    const { camera } = state;
    const t = 1 - Math.exp(-delta * FLY_SPEED);
    const radius = camera.position.length();
    const targetRadius = target.distance ?? radius;

    fromDirection.copy(camera.position).normalize();
    fullRotation.setFromUnitVectors(fromDirection, target.direction);
    stepRotation.identity().slerp(fullRotation, t);
    fromDirection.applyQuaternion(stepRotation);

    const nextRadius = radius + (targetRadius - radius) * t;
    camera.position.copy(fromDirection).multiplyScalar(nextRadius);
    camera.lookAt(0, 0, 0);
    state.controls?.update();

    const arrived =
      fromDirection.angleTo(target.direction) < ANGLE_EPSILON && Math.abs(nextRadius - targetRadius) < DISTANCE_EPSILON;
    if (arrived) flight.current = null;
  });

  return null;
}

export default CameraRig;
