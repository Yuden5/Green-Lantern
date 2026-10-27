import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const randomBetween = (random, min, max) => min + random() * (max - min);

function createRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function makeRock(random) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.getAttribute('position');
  const colors = [];
  const palette = ['#126e79', '#16808a', '#23949a', '#125b69', '#2a9c9b', '#1d7885'].map(
    (color) => new THREE.Color(color),
  );

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const radius = randomBetween(random, 0.94, 1.08);
    const top = y > 0.15 ? 0.62 + (y - 0.15) * 0.18 : y;
    const bottom = y < -0.12 ? -0.2 - Math.pow((-y - 0.12) / 0.88, 1.4) * 0.98 : top;
    position.setXYZ(index, x * radius * 1.72, bottom * radius, z * radius * 1.5);
    const color = palette[Math.floor(random() * palette.length)];
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addTree(group, x, z, scale, random, broadleaf = false) {
  const trunkHeight = scale * (broadleaf ? 0.92 : 1.1);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(scale * 0.045, scale * 0.075, trunkHeight, 5),
    new THREE.MeshStandardMaterial({ color: '#60402c', flatShading: true }),
  );
  trunk.position.set(x, 0.8 + trunkHeight / 2, z);
  trunk.rotation.z = randomBetween(random, -0.1, 0.1);
  group.add(trunk);

  if (broadleaf) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(scale * 0.42, 1),
      new THREE.MeshStandardMaterial({ color: '#347746', flatShading: true }),
    );
    crown.scale.set(1.1, 0.9, 0.95);
    crown.position.set(x, 0.8 + trunkHeight + scale * 0.12, z);
    group.add(crown);
    const crownSide = new THREE.Mesh(
      new THREE.IcosahedronGeometry(scale * 0.27, 0),
      new THREE.MeshStandardMaterial({ color: '#4d914e', flatShading: true }),
    );
    crownSide.position.set(x + scale * 0.22, crown.position.y - scale * 0.13, z + scale * 0.12);
    group.add(crownSide);
    return;
  }

  for (let tier = 0; tier < 3; tier += 1) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(scale * (0.35 - tier * 0.055), scale * 0.54, 5),
      new THREE.MeshStandardMaterial({
        color: tier === 1 ? '#397a4b' : '#2d6741',
        flatShading: true,
      }),
    );
    foliage.position.set(x, 0.8 + trunkHeight * 0.54 + tier * scale * 0.27, z);
    group.add(foliage);
  }
}

function buildIsland() {
  const random = createRandom(4217);
  const root = new THREE.Group();
  const underside = new THREE.Mesh(
    makeRock(random),
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 }),
  );
  underside.position.y = 0.05;
  root.add(underside);

  const turf = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.71, 0.16, 13, 1, false),
    [
      new THREE.MeshStandardMaterial({ color: '#668b43', flatShading: true }),
      new THREE.MeshStandardMaterial({ color: '#82a94f', flatShading: true }),
      new THREE.MeshStandardMaterial({ color: '#6f9a49', flatShading: true }),
    ],
  );
  turf.position.y = 0.69;
  root.add(turf);

  const mountainMaterial = new THREE.MeshStandardMaterial({ color: '#b8b5a1', flatShading: true, roughness: 1 });
  const mountainFaces = ['#d6d0b8', '#aaa894', '#e4ddc8', '#888b7d'].map(
    (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 }),
  );
  const peaks = [
    [-0.25, 1.35, -0.28, 0.62, 0.95],
    [0.33, 1.2, -0.2, 0.52, 0.82],
    [0.73, 1.02, 0.05, 0.37, 0.64],
    [-0.68, 1.01, -0.08, 0.38, 0.62],
    [0.03, 1.02, 0.24, 0.36, 0.57],
  ];
  peaks.forEach(([x, height, z, radius, tall], index) => {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(radius, tall, 5, 1),
      index === 0 ? mountainFaces : mountainMaterial,
    );
    peak.position.set(x, 0.76 + height * 0.2, z);
    peak.rotation.y = randomBetween(random, 0, Math.PI);
    peak.rotation.z = randomBetween(random, -0.12, 0.12);
    root.add(peak);
  });

  addTree(root, -1.05, -0.25, 0.92, random);
  addTree(root, 1.05, -0.2, 0.82, random);
  addTree(root, 0.78, 0.56, 0.73, random, true);
  addTree(root, -0.82, 0.48, 0.58, random);

  const bushMaterials = ['#347c45', '#458b4c', '#5a9b51'].map(
    (color) => new THREE.MeshStandardMaterial({ color, flatShading: true }),
  );
  for (let index = 0; index < 24; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = randomBetween(random, 0.55, 1.52);
    const bush = new THREE.Mesh(
      new THREE.IcosahedronGeometry(randomBetween(random, 0.06, 0.13), 0),
      bushMaterials[Math.floor(random() * bushMaterials.length)],
    );
    bush.scale.set(1.4, randomBetween(random, 0.65, 1.1), 1);
    bush.position.set(Math.cos(angle) * radius, 0.83, Math.sin(angle) * radius * 0.8);
    root.add(bush);
  }

  for (let index = 0; index < 19; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = randomBetween(random, 0.62, 1.55);
    const plant = new THREE.Mesh(
      new THREE.ConeGeometry(randomBetween(random, 0.025, 0.05), randomBetween(random, 0.1, 0.22), 4),
      new THREE.MeshStandardMaterial({ color: index % 2 ? '#a5bd69' : '#69944d', flatShading: true }),
    );
    plant.position.set(Math.cos(angle) * radius, 0.91, Math.sin(angle) * radius * 0.8);
    root.add(plant);
  }
  return root;
}

export default function FloatingIsland() {
  const hostRef = useRef(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
      setWebglUnavailable(true);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 3.2, 7.7);
    camera.lookAt(0, 0.55, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#f4fff1', '#456c70', 2.1));
    const keyLight = new THREE.DirectionalLight('#fff5d9', 3.2);
    keyLight.position.set(-4, 8, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#9fe8df', 1.5);
    fillLight.position.set(4, 2, -4);
    scene.add(fillLight);

    const island = buildIsland();
    scene.add(island);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    let animationFrame = 0;
    let observer;

    const onPointerMove = (event) => {
      if (reducedMotion || event.pointerType === 'touch' || window.innerWidth < 768) return;
      const bounds = host.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.08;
      pointerTarget.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.04;
    };
    const resetPointer = () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    };

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 460 ? 9.2 : width < 800 ? 8.5 : 7.7;
      camera.updateProjectionMatrix();
    };

    const render = (time) => {
      if (document.hidden) {
        animationFrame = 0;
        return;
      }
      if (!reducedMotion) {
        island.position.y = Math.sin(time * 0.0007) * 0.09;
        pointer.x += (pointerTarget.x - pointer.x) * 0.035;
        pointer.y += (pointerTarget.y - pointer.y) * 0.035;
        island.rotation.y = Math.sin(time * 0.00025) * 0.13 + pointer.x;
        island.rotation.z = Math.sin(time * 0.0004) * 0.018 + pointer.y;
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (!document.hidden && !animationFrame) animationFrame = window.requestAnimationFrame(render);
    };
    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', resetPointer);
    document.addEventListener('visibilitychange', start);
    start();

    return () => {
      stop();
      observer.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', start);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else if (object.material) object.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="island-stage" ref={hostRef} aria-label="A floating low-poly island with turquoise rock, green forest, and mountains" role="img">
      {webglUnavailable && <div className="island-fallback">A greener Bangkok, growing together.</div>}
    </div>
  );
}
