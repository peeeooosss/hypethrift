"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { MALL_STORES, SPAWN_POSITION, collides } from "@/lib/mall/layout";
import { ZONE_BY_SLUG } from "@/lib/mall/zones";
import { useMallControls } from "@/lib/mall/controls";
import type { MallShowcase, MallProduct } from "@/lib/mall/showcase";
import { makeArenaTexture, makeProductTexture, makeSignTexture, makeWallTexture } from "./textures";
import { money } from "@/lib/utils";

function PlayerController({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.03);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const bob = useRef(0);
  const activeRef = useRef(active);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const dom = gl.domElement;
    dom.style.touchAction = "none";
    dom.style.cursor = "grab";

    const onKeyDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!activeRef.current) return;
      dragging.current = true;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      dom.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current || !activeRef.current) return;
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      yaw.current -= dx * 0.0036;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.003, -1.15, 1.05);
    };
    const onPointerUp = () => {
      dragging.current = false;
      dom.style.cursor = "grab";
    };
    const onBlur = () => {
      keys.current = {};
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (activeRef.current) {
      let moveX = 0;
      let moveZ = 0;
      if (keys.current.KeyW || keys.current.ArrowUp) moveZ -= 1;
      if (keys.current.KeyS || keys.current.ArrowDown) moveZ += 1;
      if (keys.current.KeyA || keys.current.ArrowLeft) moveX -= 1;
      if (keys.current.KeyD || keys.current.ArrowRight) moveX += 1;

      const virtual = useMallControls.getState();
      moveX += virtual.moveX;
      moveZ += virtual.moveZ;

      const length = Math.hypot(moveX, moveZ);
      if (length > 0) {
        moveX /= length;
        moveZ /= length;
        const sprint = keys.current.ShiftLeft || keys.current.ShiftRight;
        const speed = sprint ? 7.2 : 4.4;

        forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
        right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));

        const dx = (forward.x * -moveZ + right.x * moveX) * speed * dt;
        const dz = (forward.z * -moveZ + right.z * moveX) * speed * dt;

        const nextX = camera.position.x + dx;
        const nextZ = camera.position.z + dz;
        if (!collides(nextX, camera.position.z)) camera.position.x = nextX;
        if (!collides(camera.position.x, nextZ)) camera.position.z = nextZ;

        if (!reducedMotion) bob.current += dt * (sprint ? 13 : 9);
      } else if (!reducedMotion) {
        bob.current += dt * 2;
      }
    }

    const eye = reducedMotion ? 1.65 : 1.65 + Math.sin(bob.current) * 0.018;
    camera.position.y = eye;
    euler.set(pitch.current, yaw.current, 0);
    camera.quaternion.setFromEuler(euler);
  });

  return null;
}

function ProductPanel({ product, x, zoneColor }: { product: MallProduct; x: number; zoneColor: string }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(
    () =>
      makeProductTexture({
        title: product.title,
        price: money(product.price),
        emoji: product.emoji,
        color: zoneColor,
        meta: product.meta,
      }),
    [product.emoji, product.meta, product.price, product.title, zoneColor],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={[x, 2.15, 0.35]}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "grab";
        }}
        onClick={(event) => {
          event.stopPropagation();
          const target = product.id ? `/listing/${encodeURIComponent(product.id)}` : `/mall/${product.zone}`;
          document.body.style.cursor = "grab";
          router.push(target);
        }}
        scale={hovered ? 1.07 : 1}
      >
        <boxGeometry args={[2.05, 2.55, 0.16]} />
        <meshStandardMaterial color="#121212" roughness={0.7} />
        <mesh position={[0, 0, 0.09]}>
          <planeGeometry args={[1.92, 2.42]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </mesh>
      <mesh position={[0, -1.33, 0.08]}>
        <boxGeometry args={[2.2, 0.12, 0.3]} />
        <meshStandardMaterial color={zoneColor} emissive={zoneColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Storefront({ store, products, index }: { store: (typeof MALL_STORES)[number]; products: MallProduct[]; index: number }) {
  const router = useRouter();
  const zone = ZONE_BY_SLUG[store.zone];
  const signTexture = useMemo(
    () =>
      makeSignTexture({
        name: zone.name,
        tagline: zone.tagline,
        emoji: zone.emoji,
        color: zone.color,
        index,
      }),
    [index, zone.color, zone.emoji, zone.name, zone.tagline],
  );

  useEffect(() => () => signTexture.dispose(), [signTexture]);
  const panelX = [-3.35, -1.12, 1.12, 3.35];

  return (
    <group position={store.position} rotation={[0, store.rotationY, 0]}>
      <mesh position={[0, 0.02, -1.7]} receiveShadow>
        <boxGeometry args={[11.2, 0.08, 5.8]} />
        <meshStandardMaterial color="#F4F0EA" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, -4.65]}>
        <boxGeometry args={[11.4, 6.4, 0.3]} />
        <meshStandardMaterial color="#171717" roughness={0.88} />
      </mesh>
      <mesh position={[-5.65, 3.2, -1.8]}>
        <boxGeometry args={[0.35, 6.4, 5.9]} />
        <meshStandardMaterial color="#222222" roughness={0.9} />
      </mesh>
      <mesh position={[5.65, 3.2, -1.8]}>
        <boxGeometry args={[0.35, 6.4, 5.9]} />
        <meshStandardMaterial color="#222222" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.25, -1.55]}>
        <boxGeometry args={[11.2, 0.22, 6.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[0, 6.25, -1.54]}>
        <boxGeometry args={[7.2, 0.07, 0.07]} />
        <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-5.62, 3.2, -1.55]}>
        <boxGeometry args={[0.05, 5.2, 0.05]} />
        <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[5.62, 3.2, -1.55]}>
        <boxGeometry args={[0.05, 5.2, 0.05]} />
        <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={1.4} />
      </mesh>

      <mesh
        position={[0, 7.55, -1.4]}
        onClick={(event) => {
          event.stopPropagation();
          router.push(`/mall/${zone.slug}`);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "grab";
        }}
      >
        <planeGeometry args={[10.8, 2.7]} />
        <meshBasicMaterial map={signTexture} toneMapped={false} />
      </mesh>

      <mesh position={[0, 4.8, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.4, 0.04]} />
        <meshBasicMaterial color={zone.color} toneMapped={false} />
      </mesh>

      {products.slice(0, 4).map((product, productIndex) => (
        <ProductPanel key={`${store.zone}-${product.title}-${productIndex}`} product={product} x={panelX[productIndex] ?? 0} zoneColor={zone.color} />
      ))}
    </group>
  );
}

function ArenaPortal() {
  const router = useRouter();
  const texture = useMemo(() => makeArenaTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={[0, 0, -27.2]} onClick={() => router.push("/bid-arena")}>
      <mesh position={[0, 22, 0]}>
        <boxGeometry args={[17, 44, 1]} />
        <meshStandardMaterial color="#0B0B0F" />
      </mesh>
      <mesh position={[0, 20, 0.6]}>
        <boxGeometry args={[18.5, 1.4, 1.4]} />
        <meshStandardMaterial color="#D4FF33" emissive="#D4FF33" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-8.5, 12, 0.6]}>
        <boxGeometry args={[1.4, 18, 1.4]} />
        <meshStandardMaterial color="#D4FF33" emissive="#D4FF33" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[8.5, 12, 0.6]}>
        <boxGeometry args={[1.4, 18, 1.4]} />
        <meshStandardMaterial color="#D4FF33" emissive="#D4FF33" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 13.4, 0.75]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 8.5, 0.7]}>
        <planeGeometry args={[14.5, 5.6]} />
        <meshBasicMaterial color="#FF66B2" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0.03, 4.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 12]} />
        <meshStandardMaterial color="#FF66B2" emissive="#FF66B2" emissiveIntensity={0.12} />
      </mesh>
      <pointLight position={[0, 5, 4]} color="#FF66B2" intensity={45} distance={20} />
    </group>
  );
}

function MallShell() {
  const wallTexture = useMemo(() => makeWallTexture("HYPETHRIFT"), []);
  const wallTexture2 = useMemo(() => makeWallTexture("BID · BUY · FLEX", "#FF66B2"), []);
  useEffect(
    () => () => {
      wallTexture.dispose();
      wallTexture2.dispose();
    },
    [wallTexture, wallTexture2],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 3]} receiveShadow>
        <planeGeometry args={[40, 82]} />
        <meshStandardMaterial color="#E9E4DB" roughness={0.96} />
      </mesh>
      <gridHelper args={[80, 40, "#c9c2b6", "#d9d2c6"]} position={[0, 0.02, 3]} />
      <mesh position={[-20, 4, 3]}>
        <boxGeometry args={[0.4, 8, 82]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
      </mesh>
      <mesh position={[20, 4, 3]}>
        <boxGeometry args={[0.4, 8, 82]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5, 43.5]}>
        <boxGeometry args={[40, 10, 0.4]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
      </mesh>

      {[24, 10, -4, -18].map((z) => (
        <group key={z}>
          <mesh position={[0, 7.5, z]}>
            <boxGeometry args={[40, 0.22, 0.22]} />
            <meshStandardMaterial color="#121212" />
          </mesh>
          {[-8, -4, 4, 8].map((x) => (
            <mesh key={x} position={[x, 7.1, z]}>
              <boxGeometry args={[0.35, 0.35, 0.35]} />
              <meshStandardMaterial color="#D4FF33" emissive="#D4FF33" emissiveIntensity={1.8} />
            </mesh>
          ))}
        </group>
      ))}

      {[-10, 0, 10].map((x) =>
        [30, 18, 4, -10].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 7.05, z]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#121212" />
          </mesh>
        )),
      )}

      <mesh position={[0, 7.9, 34]} rotation={[0, 0, 0]}>
        <planeGeometry args={[16, 4]} />
        <meshBasicMaterial map={wallTexture} toneMapped={false} />
      </mesh>
      <mesh position={[-16, 4.2, 10]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 5]} />
        <meshBasicMaterial map={wallTexture2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function MallScene({
  showcase,
  active,
  reducedMotion,
}: {
  showcase: MallShowcase;
  active: boolean;
  reducedMotion: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#0B0B0F"]} />
      <fog attach="fog" args={["#0B0B0F", 32, 72]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#fff7e8", "#2a2520", 1.2]} />
      <directionalLight position={[0, 12, 18]} intensity={1.8} color="#fff7e8" />
      <directionalLight position={[0, 8, -24]} intensity={1.2} color="#ff66b2" />
      <PlayerController active={active} reducedMotion={reducedMotion} />
      <MallShell />
      {MALL_STORES.map((store, index) => (
        <Storefront key={store.zone} store={store} products={showcase[store.zone] ?? []} index={index} />
      ))}
      <ArenaPortal />
      <SpawnMarker />
    </>
  );
}

function SpawnMarker() {
  return (
    <group position={[SPAWN_POSITION[0], 0.02, SPAWN_POSITION[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.55, 48]} />
        <meshBasicMaterial color="#D4FF33" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2, 0]} intensity={8} color="#D4FF33" distance={10} />
    </group>
  );
}
