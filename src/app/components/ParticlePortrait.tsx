import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  extractParticleImageData,
  type ParticleImageData,
} from "./ImageProcessor";

type ParticlePortraitProps = {
  src?: string;
  particleStep?: number;
  maxParticles?: number;
};

const vertexShader = `
  attribute vec3 aTarget;
  attribute float aSize;
  attribute float aBrightness;
  attribute float aSeed;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uRepulsion;

  varying float vBrightness;
  varying float vOpacity;

  void main() {
    float formed = smoothstep(0.0, 1.0, uProgress);
    vec3 particle = mix(position, aTarget, formed);
    vec4 worldParticle = modelMatrix * vec4(particle, 1.0);
    vec2 mouseDelta = worldParticle.xy - uMouse;
    float distanceSquared = dot(mouseDelta, mouseDelta);
    float influence = exp(-distanceSquared * 18.0) * uRepulsion;
    vec2 direction = mouseDelta * inversesqrt(max(distanceSquared, 0.0001));

    worldParticle.xy += direction * influence * 0.12;
    worldParticle.z += influence * 0.13;
    worldParticle.z +=
      sin(uTime * 0.7 + aSeed * 6.283 + worldParticle.y * 3.0) * 0.006;

    vec4 viewPosition = viewMatrix * worldParticle;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(
      aSize * uPixelRatio * (4.5 / max(0.1, -viewPosition.z)),
      1.0,
      8.0
    );

    float shimmer = 0.94 + 0.06 * sin(uTime * 1.25 + aSeed * 31.0);
    vBrightness = aBrightness * shimmer;
    vOpacity = mix(0.22, 1.0, formed);
  }
`;

const fragmentShader = `
  varying float vBrightness;
  varying float vOpacity;

  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.06, 0.5, radius);
    float halo = exp(-radius * 8.0) * 0.32;
    float intensity = clamp(vBrightness * 1.32 + 0.12, 0.0, 1.0);
    vec3 silver = mix(vec3(0.24, 0.27, 0.32), vec3(0.95, 0.97, 1.0), intensity);
    float blueAccent = smoothstep(0.68, 0.98, intensity) * 0.32;
    vec3 color = mix(silver, vec3(0.36, 0.52, 1.0), blueAccent);
    float alpha = (core + halo) * vOpacity * (0.32 + intensity * 0.68);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function ParticlePortrait({
  src = "/assets/noir-code-at-midnight.png",
  particleStep,
  maxParticles,
}: ParticlePortraitProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isSmallScreen = window.matchMedia("(max-width: 720px)").matches;
    const step = particleStep ?? (isSmallScreen ? 6 : 4);
    const particleLimit = maxParticles ?? (isSmallScreen ? 18000 : 48000);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.58,
      0.7,
      0.82,
    );
    composer.addPass(bloomPass);

    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: reduceMotion ? 1 : 0 },
      uPixelRatio: { value: pixelRatio },
      uMouse: { value: new THREE.Vector2(-100, -100) },
      uRepulsion: { value: 0 },
    };

    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let portraitGroup: THREE.Group | null = null;
    let points: THREE.Points | null = null;
    let imageAspect = 1;
    let introTween: gsap.core.Tween | null = null;
    let idleTween: gsap.core.Tween | null = null;
    let frame = 0;
    let disposed = false;
    const startTime = performance.now();

    const fitPortrait = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;

      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);

      if (portraitGroup) {
        const viewHeight =
          2 *
          camera.position.z *
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const fitScale = Math.min(
          viewHeight,
          (viewHeight * aspect) / imageAspect,
        );
        portraitGroup.scale.setScalar(fitScale * 0.92);
      }
      if (reduceMotion) composer.render();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!points) return;

      const bounds = mount.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const normalizedX = (event.clientX - bounds.left) / bounds.width;
      const normalizedY = (event.clientY - bounds.top) / bounds.height;
      const viewHeight =
        2 *
        camera.position.z *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const mouseX = (normalizedX - 0.5) * viewHeight * camera.aspect;
      const mouseY = (0.5 - normalizedY) * viewHeight;

      if (reduceMotion) {
        uniforms.uMouse.value.set(mouseX, mouseY);
        uniforms.uRepulsion.value = 1;
        points.rotation.set(-normalizedY * 0.035, (normalizedX - 0.5) * 0.05, 0);
        composer.render();
        return;
      }

      gsap.to(uniforms.uMouse.value, {
        x: mouseX,
        y: mouseY,
        duration: 0.42,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(uniforms.uRepulsion, {
        value: 1,
        duration: 0.2,
        overwrite: "auto",
      });
      gsap.to(points.rotation, {
        x: -normalizedY * 0.08,
        y: (normalizedX - 0.5) * 0.12,
        duration: 0.65,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onPointerLeave = () => {
      if (!points) return;

      if (reduceMotion) {
        uniforms.uMouse.value.set(-100, -100);
        uniforms.uRepulsion.value = 0;
        points.rotation.set(0, 0, 0);
        composer.render();
        return;
      }

      gsap.to(uniforms.uMouse.value, {
        x: -100,
        y: -100,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(uniforms.uRepulsion, {
        value: 0,
        duration: 0.45,
        overwrite: "auto",
      });
      gsap.to(points.rotation, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      uniforms.uTime.value = (performance.now() - startTime) * 0.001;
      composer.render();
    };

    const resizeObserver = new ResizeObserver(fitPortrait);
    resizeObserver.observe(mount);
    mount.addEventListener("pointermove", onPointerMove, { passive: true });
    mount.addEventListener("pointerleave", onPointerLeave);
    fitPortrait();

    const image = new Image();
    image.onload = () => {
      if (disposed) return;

      let particleData: ParticleImageData;
      try {
        particleData = extractParticleImageData(image, step, particleLimit);
      } catch (error) {
        console.error("Could not process the portrait image into particles.", error);
        return;
      }
      if (!particleData.count) {
        console.error("The portrait image produced no visible particles.");
        return;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(particleData.startPositions, 3),
      );
      geometry.setAttribute(
        "aTarget",
        new THREE.Float32BufferAttribute(particleData.positions, 3),
      );
      geometry.setAttribute(
        "aSize",
        new THREE.Float32BufferAttribute(particleData.sizes, 1),
      );
      geometry.setAttribute(
        "aBrightness",
        new THREE.Float32BufferAttribute(particleData.brightness, 1),
      );
      geometry.setAttribute(
        "aSeed",
        new THREE.Float32BufferAttribute(particleData.seeds, 1),
      );

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      points = new THREE.Points(geometry, material);
      imageAspect = particleData.aspect;
      portraitGroup = new THREE.Group();
      portraitGroup.add(points);
      scene.add(portraitGroup);
      fitPortrait();

      if (reduceMotion) {
        composer.render();
        return;
      }

      introTween = gsap.to(uniforms.uProgress, {
        value: 1,
        duration: 2.7,
        delay: 0.2,
        ease: "power3.out",
      });
      idleTween = gsap.to(portraitGroup.rotation, {
        x: -0.008,
        y: 0.012,
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    };
    image.onerror = (error) => {
      if (!disposed) {
        console.error(`Could not load the portrait image at ${src}.`, error);
      }
    };
    image.src = src;

    if (!reduceMotion) frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      introTween?.kill();
      idleTween?.kill();
      gsap.killTweensOf(uniforms.uMouse.value);
      gsap.killTweensOf(uniforms.uRepulsion);
      if (points) gsap.killTweensOf(points.rotation);
      if (portraitGroup) gsap.killTweensOf(portraitGroup.rotation);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      image.onload = null;
      image.onerror = null;
      geometry?.dispose();
      material?.dispose();
      bloomPass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src, particleStep, maxParticles]);

  return (
    <div
      className="portrait-motion"
      ref={mountRef}
      role="img"
      aria-label="Interactive silver and blue particle reconstruction of a person working at a laptop"
    />
  );
}
