'use client';

import { Html, Line } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { BloomEffect } from 'postprocessing';
import * as THREE from 'three';
import { HEX, NETWORK_NODES, PALETTE } from '@/lib/palette';
import { getStageProgress } from './stageStore';
import { createStageState, prominentStageWeight, writeStageState } from './stages';
import {
  isSmallViewport,
  latLngToVector3,
  mulberry32,
  prefersReducedMotion,
  smoothstep,
} from './utils';

const ARC_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['lim', 'sao'],
  ['mex', 'bog'],
  ['lim', 'bog'],
  ['mex', 'sao'],
  ['bog', 'sao'],
  ['lim', 'scl'],
  ['sao', 'eze'],
  ['eze', 'bue2'],
  ['bog', 'bog2'],
  ['mex', 'mex2'],
  ['lim', 'lim2'],
  ['lim', 'lim3'],
  ['pan', 'mex'],
  ['scl', 'eze'],
];

const LABEL_IDS: ReadonlyArray<string> = ['mex', 'bog', 'lim', 'sao'];

const LABEL_TEXT: Record<string, string> = {
  mex: 'México',
  bog: 'Bogotá',
  lim: 'Lima',
  sao: 'São Paulo',
};

const ARC_SAMPLE_COUNT = 64;
const GLOBE_POINT_SEED = 77003;
const ARC_SEED = 20240517;
const STAR_SEED = 1337;
const INITIAL_GLOBE_YAW = -0.23;
const INITIAL_GLOBE_TILT = 0.06;
const NODE_RADIUS = 1.02;
const CORE_RADIUS = 0.985;
const ATMOSPHERE_RADIUS = 1.16;
const SCENE_FOV = 42;

const ATMOSPHERE_BASE_INTENSITY = 0.9;
const LABEL_VISIBILITY_EPSILON = 0.015;

const MOBILE_SCALE_CONTENT = 0.5;
const MOBILE_SCALE_PROMINENT = 0.66;
const MOBILE_OFFSET_X_CONTENT = 0.5;
const MOBILE_OFFSET_X_PROMINENT = 0.8;
const MOBILE_DIM_CONTENT = 0.68;
const MOBILE_DIM_PROMINENT = 0.9;
const MOBILE_BLOOM_CONTENT = 0.5;
const MOBILE_BLOOM_PROMINENT = 0.75;
const MOBILE_ARC = 0.7;

const GLOBE_VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uFocal;
  varying vec3 vColor;
  varying float vFacing;

  void main() {
    vColor = aColor;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normalize(position));
    vFacing = dot(worldNormal, normalize(cameraPosition - worldPosition.xyz));
    vec4 viewPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * uFocal / max(0.001, -viewPosition.z), 1.0, 56.0);
  }
`;

const GLOBE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vFacing;

  void main() {
    vec2 delta = gl_PointCoord - vec2(0.5);
    float alpha = smoothstep(0.5, 0.3, length(delta));
    alpha *= smoothstep(0.0, 0.5, vFacing);
    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalView;
  varying vec3 vViewDirection;

  void main() {
    float facing = abs(dot(normalize(vNormalView), normalize(vViewDirection)));
    float glow = pow(clamp(1.0 - facing, 0.0, 1.0), 2.4) * uIntensity;
    if (glow <= 0.002) discard;
    gl_FragColor = vec4(uColor * glow, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const LABEL_STYLE: CSSProperties = {
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transform: 'translate(12px, -50%)',
  padding: '3px 9px 4px',
  borderRadius: '999px',
  border: '1px solid rgba(47, 230, 200, 0.38)',
  background: 'rgba(5, 7, 10, 0.6)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#EAFBF7',
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  lineHeight: 1.1,
  textTransform: 'uppercase',
  boxShadow: '0 0 16px rgba(47, 230, 200, 0.28)',
  opacity: 1,
  visibility: 'visible',
};

type NodeData = {
  id: string;
  hub: boolean;
  direction: THREE.Vector3;
  position: THREE.Vector3;
};

type ArcData = {
  key: string;
  points: THREE.Vector3[];
  samples: Float32Array;
  phase: number;
  speed: number;
};

type ArcLineHandle = {
  material: { opacity: number };
};

type StarData = {
  geometry: THREE.BufferGeometry;
};

function buildNodes(): NodeData[] {
  return NETWORK_NODES.map((node) => {
    const [x, y, z] = latLngToVector3(node.lat, node.lng, 1);
    const direction = new THREE.Vector3(x, y, z).normalize();
    return {
      id: node.id,
      hub: node.hub,
      direction,
      position: direction.clone().multiplyScalar(NODE_RADIUS),
    };
  });
}

function buildArcs(nodeById: Map<string, NodeData>, limit: number): ArcData[] {
  const random = mulberry32(ARC_SEED);
  const arcs: ArcData[] = [];
  const routeCount = Math.min(limit, ARC_ROUTES.length);
  for (let index = 0; index < routeCount; index += 1) {
    const [fromId, toId] = ARC_ROUTES[index];
    const from = nodeById.get(fromId);
    const to = nodeById.get(toId);
    if (!from || !to) continue;
    const distance = from.position.distanceTo(to.position);
    const midpoint = from.position
      .clone()
      .add(to.position)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(1.24 + distance * 0.3);
    const curve = new THREE.QuadraticBezierCurve3(from.position, midpoint, to.position);
    const points = curve.getPoints(ARC_SAMPLE_COUNT - 1);
    const samples = new Float32Array(ARC_SAMPLE_COUNT * 3);
    for (let i = 0; i < ARC_SAMPLE_COUNT; i += 1) {
      samples[i * 3] = points[i].x;
      samples[i * 3 + 1] = points[i].y;
      samples[i * 3 + 2] = points[i].z;
    }
    arcs.push({
      key: `${fromId}-${toId}`,
      points,
      samples,
      phase: random(),
      speed: 0.14 + random() * 0.18,
    });
  }
  return arcs;
}

function buildGlobeGeometry(count: number): THREE.BufferGeometry {
  const random = mulberry32(GLOBE_POINT_SEED);
  const land = new THREE.Color(HEX.globeLand);
  const city = new THREE.Color(PALETTE.aqua);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * ringRadius;
    const z = Math.sin(theta) * ringRadius;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const isCity = random() < 0.075;
    const tint = isCity ? 1 : 0.7 + random() * 0.55;
    const source = isCity ? city : land;
    colors[i * 3] = source.r * tint;
    colors[i * 3 + 1] = source.g * tint;
    colors[i * 3 + 2] = source.b * tint;
    sizes[i] = isCity ? 0.016 : 0.0092;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.05);
  return geometry;
}

function buildStars(count: number): StarData {
  const random = mulberry32(STAR_SEED);
  const tone = new THREE.Color(HEX.stars);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 25 + random() * 15;
    const vertical = random() * 2 - 1;
    const azimuth = random() * Math.PI * 2;
    const ring = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    positions[i * 3] = radius * ring * Math.cos(azimuth);
    positions[i * 3 + 1] = radius * vertical;
    positions[i * 3 + 2] = radius * ring * Math.sin(azimuth);
    const brightness = 0.3 + random() * 0.75;
    colors[i * 3] = tone.r * brightness;
    colors[i * 3 + 1] = tone.g * brightness;
    colors[i * 3 + 2] = tone.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 42);
  return { geometry };
}

function buildHaloTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const half = size / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(47, 230, 200, 0.95)');
    gradient.addColorStop(0.28, 'rgba(47, 230, 200, 0.42)');
    gradient.addColorStop(0.62, 'rgba(47, 230, 200, 0.12)');
    gradient.addColorStop(1, 'rgba(47, 230, 200, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function applyNodeMatrices(
  nodes: NodeData[],
  mesh: THREE.InstancedMesh,
  dummy: THREE.Object3D,
): void {
  for (let i = 0; i < nodes.length; i += 1) {
    dummy.position.copy(nodes[i].position);
    dummy.rotation.set(0, Math.PI / 5, 0);
    dummy.scale.setScalar(nodes[i].hub ? 1.75 : 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function applyFlowMatrices(
  arcs: ArcData[],
  mesh: THREE.InstancedMesh,
  time: number,
  scale: number,
  dummy: THREE.Object3D,
): void {
  const last = ARC_SAMPLE_COUNT - 1;
  for (let i = 0; i < arcs.length; i += 1) {
    const arc = arcs[i];
    const u = (arc.phase + time * arc.speed) % 1;
    const cursor = u * last;
    const from = Math.floor(cursor);
    const to = Math.min(from + 1, last);
    const mix = cursor - from;
    const data = arc.samples;
    dummy.position.set(
      data[from * 3] + (data[to * 3] - data[from * 3]) * mix,
      data[from * 3 + 1] + (data[to * 3 + 1] - data[from * 3 + 1]) * mix,
      data[from * 3 + 2] + (data[to * 3 + 2] - data[from * 3 + 2]) * mix,
    );
    const pulse = 0.78 + 0.32 * Math.sin((u + i * 0.17) * Math.PI * 2);
    dummy.scale.setScalar(scale * pulse);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function applyLabelOpacity(element: HTMLDivElement, opacity: number): void {
  const hidden = opacity <= LABEL_VISIBILITY_EPSILON;
  const nextOpacity = hidden ? '0' : opacity.toFixed(3);
  if (element.style.opacity !== nextOpacity) element.style.opacity = nextOpacity;
  const nextVisibility = hidden ? 'hidden' : 'visible';
  if (element.style.visibility !== nextVisibility) element.style.visibility = nextVisibility;
}

function applyAtmosphereIntensity(mesh: THREE.Mesh | null, dim: number): void {
  const material = mesh?.material as THREE.ShaderMaterial | undefined;
  if (!material || !material.uniforms.uIntensity) return;
  material.uniforms.uIntensity.value = ATMOSPHERE_BASE_INTENSITY * (0.3 + 0.7 * dim);
}

function GlobePointField({ count }: { count: number }) {
  const viewportHeight = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);

  const geometry = useMemo(() => buildGlobeGeometry(count), [count]);
  const uniforms = useMemo(
    () => ({
      uFocal: {
        value: (0.5 * viewportHeight * dpr) / Math.tan((SCENE_FOV * Math.PI) / 360),
      },
    }),
    [viewportHeight, dpr],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        key={`${viewportHeight}-${dpr}`}
        vertexShader={GLOBE_VERTEX_SHADER}
        fragmentShader={GLOBE_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest
      />
    </points>
  );
}

function SceneContents() {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const small = useMemo(() => isSmallViewport(), []);

  const globeGroupRef = useRef<THREE.Group>(null);
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const flowMeshRef = useRef<THREE.InstancedMesh>(null);
  const bloomRef = useRef<BloomEffect | null>(null);
  const lineRefs = useRef<Array<ArcLineHandle | null>>([]);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const starMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh>(null);

  const nodes = useMemo<NodeData[]>(() => buildNodes(), []);
  const hubNodes = useMemo(() => nodes.filter((node) => node.hub), [nodes]);
  const labels = useMemo(() => nodes.filter((node) => LABEL_IDS.includes(node.id)), [nodes]);
  const nodeById = useMemo(() => {
    const map = new Map<string, NodeData>();
    for (const node of nodes) map.set(node.id, node);
    return map;
  }, [nodes]);
  const arcs = useMemo<ArcData[]>(() => buildArcs(nodeById, small ? 9 : ARC_ROUTES.length), [
    nodeById,
    small,
  ]);
  const globePointCount = small ? 5200 : 9000;
  const stars = useMemo<StarData>(() => buildStars(small ? 320 : 620), [small]);
  const haloTexture = useMemo(() => buildHaloTexture(), []);
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX_SHADER,
        fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
        uniforms: {
          uColor: { value: new THREE.Color(PALETTE.aqua) },
          uIntensity: { value: ATMOSPHERE_BASE_INTENSITY },
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const rig = useRef({
    progress: 0,
    time: 0,
    lastDim: -1,
    state: createStageState(),
    currentTarget: new THREE.Vector3(0, 0, 0),
  });

  const work = useRef({
    plainPosition: new THREE.Vector3(),
    plainTarget: new THREE.Vector3(),
    focusPosition: new THREE.Vector3(),
    focusTarget: new THREE.Vector3(),
    desiredPosition: new THREE.Vector3(),
    desiredTarget: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    side: new THREE.Vector3(),
    viewDirection: new THREE.Vector3(),
    cameraRight: new THREE.Vector3(),
    labelWorld: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    dummy: new THREE.Object3D(),
  });

  useLayoutEffect(() => {
    const mesh = nodeMeshRef.current;
    if (mesh) applyNodeMatrices(nodes, mesh, work.current.dummy);
    const flow = flowMeshRef.current;
    if (flow) applyFlowMatrices(arcs, flow, 0, 0.013, work.current.dummy);
  }, [nodes, arcs, work]);

  useEffect(() => {
    return () => {
      stars.geometry.dispose();
    };
  }, [stars]);

  useEffect(() => {
    return () => {
      haloTexture.dispose();
    };
  }, [haloTexture]);

  useEffect(() => {
    return () => {
      atmosphereMaterial.dispose();
    };
  }, [atmosphereMaterial]);

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 0.1);
    const camera = frameState.camera as THREE.PerspectiveCamera;
    const gl = frameState.gl;
    const globeGroup = globeGroupRef.current;
    const state = rig.current;
    const scratch = work.current;

    state.progress = reduced
      ? getStageProgress()
      : THREE.MathUtils.damp(state.progress, getStageProgress(), 4.5, dt);
    if (!reduced) state.time += dt;
    const stage = writeStageState(state.progress, state.state);

    // Mobile safety net: the copy owns the screen, the globe is a side glow.
    const prominence = prominentStageWeight(state.progress);
    if (small) {
      const scaleMix =
        MOBILE_SCALE_CONTENT + (MOBILE_SCALE_PROMINENT - MOBILE_SCALE_CONTENT) * prominence;
      const offsetMix =
        MOBILE_OFFSET_X_CONTENT + (MOBILE_OFFSET_X_PROMINENT - MOBILE_OFFSET_X_CONTENT) * prominence;
      const dimMix =
        MOBILE_DIM_CONTENT + (MOBILE_DIM_PROMINENT - MOBILE_DIM_CONTENT) * prominence;
      const bloomMix =
        MOBILE_BLOOM_CONTENT + (MOBILE_BLOOM_PROMINENT - MOBILE_BLOOM_CONTENT) * prominence;
      stage.globeScale *= scaleMix;
      stage.globePosition[0] *= offsetMix;
      stage.dim *= dimMix;
      stage.bloomIntensity *= bloomMix;
      stage.arcIntensity *= MOBILE_ARC;
    }

    if (globeGroup) {
      globeGroup.position.set(
        stage.globePosition[0],
        stage.globePosition[1],
        stage.globePosition[2],
      );
      const nextScale = reduced
        ? stage.globeScale
        : THREE.MathUtils.damp(globeGroup.scale.x, stage.globeScale, 5, dt);
      globeGroup.scale.setScalar(nextScale);
      if (!reduced) globeGroup.rotation.y += stage.rotationSpeed * dt;
    }

    const scale = globeGroup ? globeGroup.scale.x : stage.globeScale;
    scratch.plainPosition.set(stage.camera[0], stage.camera[1], stage.camera[2]);
    scratch.plainTarget.set(stage.target[0], stage.target[1], stage.target[2]);
    scratch.focusPosition.copy(scratch.plainPosition);
    scratch.focusTarget.copy(scratch.plainTarget);

    let focusWeight = stage.focusWeight;
    if (globeGroup && stage.focusNodeId && focusWeight > 0.0001) {
      const focusNode = nodeById.get(stage.focusNodeId);
      if (focusNode) {
        scratch.direction.copy(focusNode.direction).applyQuaternion(globeGroup.quaternion);
        scratch.viewDirection.copy(camera.position).sub(globeGroup.position);
        const globeDistance = scratch.viewDirection.length();
        if (globeDistance > 1e-6) scratch.viewDirection.divideScalar(globeDistance);
        // Never chase a node on the far hemisphere: the disc would swing back
        // over the copy. Fade the focus out as the node turns away.
        focusWeight *= smoothstep(-0.05, 0.4, scratch.direction.dot(scratch.viewDirection));
        scratch.side.copy(scratch.direction).cross(scratch.up);
        if (scratch.side.lengthSq() > 1e-6) {
          scratch.side.normalize();
        } else {
          scratch.side.set(1, 0, 0);
        }
        scratch.focusTarget
          .copy(scratch.direction)
          .multiplyScalar(NODE_RADIUS * scale)
          .add(globeGroup.position);
        scratch.focusPosition
          .copy(scratch.direction)
          .multiplyScalar((NODE_RADIUS + stage.focusDistance) * scale)
          .addScaledVector(scratch.side, 0.3 * scale)
          .add(globeGroup.position);
      }
    }

    scratch.desiredPosition.copy(scratch.plainPosition).lerp(scratch.focusPosition, focusWeight);
    scratch.desiredTarget.copy(scratch.plainTarget).lerp(scratch.focusTarget, focusWeight);

    const cameraLambda = reduced ? 20 : 4;
    camera.position.set(
      THREE.MathUtils.damp(camera.position.x, scratch.desiredPosition.x, cameraLambda, dt),
      THREE.MathUtils.damp(camera.position.y, scratch.desiredPosition.y, cameraLambda, dt),
      THREE.MathUtils.damp(camera.position.z, scratch.desiredPosition.z, cameraLambda, dt),
    );
    state.currentTarget.set(
      THREE.MathUtils.damp(state.currentTarget.x, scratch.desiredTarget.x, cameraLambda + 1, dt),
      THREE.MathUtils.damp(state.currentTarget.y, scratch.desiredTarget.y, cameraLambda + 1, dt),
      THREE.MathUtils.damp(state.currentTarget.z, scratch.desiredTarget.z, cameraLambda + 1, dt),
    );
    camera.lookAt(state.currentTarget);

    const intensity = stage.arcIntensity;
    const trailOpacity = Math.min(0.85, 0.1 + 0.34 * intensity);
    for (let i = 0; i < arcs.length; i += 1) {
      const line = lineRefs.current[i];
      if (line) line.material.opacity = trailOpacity;
    }

    const flow = flowMeshRef.current;
    if (flow) {
      applyFlowMatrices(arcs, flow, state.time, 0.012 * (0.6 + 0.55 * intensity), scratch.dummy);
    }

    if (globeGroup) {
      scratch.viewDirection.copy(camera.position).sub(globeGroup.position);
      if (scratch.viewDirection.lengthSq() > 1e-8) scratch.viewDirection.normalize();
      const cameraMatrix = camera.matrixWorld.elements;
      scratch.cameraRight.set(cameraMatrix[0], cameraMatrix[1], cameraMatrix[2]);
      // City pills belong to the hero and the final CTA only; everywhere else
      // they fade out completely so they never sit on top of the copy. On
      // phones the globe sits behind the headline, so pills are dropped.
      const labelWeight = small ? 0 : prominence;
      const heroPhase = state.progress < 0.7;
      for (let i = 0; i < labels.length; i += 1) {
        const element = labelRefs.current[i];
        if (!element) continue;
        scratch.direction.copy(labels[i].direction).applyQuaternion(globeGroup.quaternion);
        const facing = smoothstep(0.04, 0.3, scratch.direction.dot(scratch.viewDirection));
        let opacity = facing * labelWeight;
        if (opacity > LABEL_VISIBILITY_EPSILON && heroPhase) {
          // In the hero keep pills on the right hemisphere so they never
          // collide with the headline on the left.
          scratch.labelWorld
            .copy(scratch.direction)
            .multiplyScalar(NODE_RADIUS * scale)
            .add(globeGroup.position)
            .sub(camera.position);
          const nodeRight = scratch.labelWorld.dot(scratch.cameraRight);
          scratch.labelWorld.copy(globeGroup.position).sub(camera.position);
          const globeRight = scratch.labelWorld.dot(scratch.cameraRight);
          if (nodeRight < globeRight + 0.08 * scale) opacity = 0;
        }
        applyLabelOpacity(element, opacity);
      }
    }

    const dim = stage.dim;
    if (bloomRef.current) {
      bloomRef.current.intensity = stage.bloomIntensity * (0.45 + 0.55 * dim);
    }
    applyAtmosphereIntensity(atmosphereMeshRef.current, dim);
    if (starMaterialRef.current) {
      starMaterialRef.current.opacity = 0.25 + 0.75 * dim;
    }

    if (Math.abs(dim - state.lastDim) > 0.002) {
      state.lastDim = dim;
      gl.domElement.style.opacity = dim.toFixed(3);
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} color={PALETTE.gray300} />
      <directionalLight position={[4.5, 2.6, 3.4]} intensity={2.1} color={PALETTE.gray100} />
      <pointLight
        position={[-3.2, 1.4, -3.8]}
        intensity={16}
        distance={16}
        decay={2}
        color={PALETTE.aqua}
      />

      <points geometry={stars.geometry} frustumCulled={false}>
        <pointsMaterial
          ref={starMaterialRef}
          size={2.6}
          sizeAttenuation={false}
          vertexColors
          transparent
          depthWrite={false}
        />
      </points>

      <group ref={globeGroupRef} rotation={[INITIAL_GLOBE_TILT, INITIAL_GLOBE_YAW, 0.04]}>
        <mesh>
          <sphereGeometry args={[CORE_RADIUS, 64, 48]} />
          <meshStandardMaterial
            color={HEX.globeBase}
            roughness={0.82}
            metalness={0.18}
            emissive={HEX.atmosphere}
            emissiveIntensity={0.07}
          />
        </mesh>

        <GlobePointField count={globePointCount} />

        <instancedMesh
          ref={nodeMeshRef}
          args={[undefined, undefined, nodes.length]}
          frustumCulled={false}
        >
          <octahedronGeometry args={[0.016, 0]} />
          <meshBasicMaterial color={PALETTE.aqua} toneMapped={false} />
        </instancedMesh>

        {hubNodes.map((node) => (
          <sprite
            key={`halo-${node.id}`}
            position={[node.position.x, node.position.y, node.position.z]}
            scale={[0.2, 0.2, 0.2]}
          >
            <spriteMaterial
              map={haloTexture}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              opacity={0.8}
            />
          </sprite>
        ))}

        {arcs.map((arc, index) => (
          <Line
            key={arc.key}
            ref={(element) => {
              lineRefs.current[index] = element;
            }}
            points={arc.points}
            color={HEX.route}
            lineWidth={1.6}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        ))}

        <instancedMesh
          ref={flowMeshRef}
          args={[undefined, undefined, arcs.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={PALETTE.aqua} toneMapped={false} />
        </instancedMesh>

        <mesh
          ref={atmosphereMeshRef}
          material={atmosphereMaterial}
          frustumCulled={false}
        >
          <sphereGeometry args={[ATMOSPHERE_RADIUS, 48, 32]} />
        </mesh>

        {labels.map((node, index) => (
          <Html
            key={`label-${node.id}`}
            position={[node.position.x, node.position.y, node.position.z]}
            zIndexRange={[4, 0]}
            pointerEvents="none"
            occlude={false}
          >
            <div
              ref={(element) => {
                labelRefs.current[index] = element;
              }}
              style={LABEL_STYLE}
            >
              {LABEL_TEXT[node.id] ?? node.id}
            </div>
          </Html>
        ))}
      </group>

      <EffectComposer multisampling={small ? 0 : 4}>
        <Bloom
          ref={bloomRef}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </>
  );
}

function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop="always"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <SceneContents />
    </Canvas>
  );
}

export default function GlobeExperience() {
  return <SceneCanvas />;
}
