import { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useAppState } from '../context/AppContext';
import { PRESETS, RISK_HEX, RISK_EMISSIVE, RISK_SPECULAR } from '../data/presets';
import { VECTORS } from '../data/vectors';
import type { Rule } from '../data/types';

const TEAL_HEX = 0x2dd4bf;

// ── Position helpers ──
function getVectorPositions(): Record<string, THREE.Vector3> {
  const positions: Record<string, THREE.Vector3> = {};
  const vCount = VECTORS.length;
  if (vCount === 0) return positions;
  const vRadius = 100;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  VECTORS.forEach((v, i) => {
    const y = vCount === 1 ? 0 : 1 - (i / (vCount - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    positions[v.id] = new THREE.Vector3(
      vRadius * r * Math.cos(theta),
      vRadius * y,
      vRadius * r * Math.sin(theta),
    );
  });
  return positions;
}

function getClassifPositions(): Record<string, THREE.Vector3> {
  const positions: Record<string, THREE.Vector3> = {};
  const innerR = 32;
  const ringLayouts = [
    { i: 0, a: 0, y: 44, r: 0 },
    { i: 1, a: 0, y: 22, r: innerR },
    { i: 2, a: Math.PI * 2 / 3, y: 22, r: innerR },
    { i: 3, a: Math.PI * 4 / 3, y: 22, r: innerR },
    { i: 4, a: Math.PI / 3, y: -22, r: innerR },
    { i: 5, a: Math.PI, y: -22, r: innerR },
    { i: 6, a: Math.PI * 5 / 3, y: -22, r: innerR },
  ];
  PRESETS.forEach((p, i) => {
    const l = ringLayouts[i] || { a: (i / PRESETS.length) * Math.PI * 2, y: 0, r: innerR };
    positions[p.id] = new THREE.Vector3(l.r * Math.cos(l.a), l.y, l.r * Math.sin(l.a));
  });
  return positions;
}

// ── Edge lines (memoized to avoid leaks from undisposed Three.js objects) ──
function Edges({
  rules, selectedNodeId, vecPositions, classifPositions,
}: {
  rules: Rule[];
  selectedNodeId: string | null;
  vecPositions: Record<string, THREE.Vector3>;
  classifPositions: Record<string, THREE.Vector3>;
}) {
  // Build Three.js objects once per rules/selection change
  const lineObjects = useMemo(() => {
    const result: THREE.Line[] = [];

    PRESETS.forEach(p => {
      VECTORS.forEach(v => {
        const n = rules.filter(r => {
          const covers = r.classifIds ? r.classifIds.includes(p.id) : r.classifId === p.id;
          return covers && r.vectors.includes(v.id);
        }).length;
        const col = n === 0 ? 0xe85555 : n <= 1 ? 0xe8a43a : 0x3ecf8e;
        const baseOp = n === 0 ? 0.14 : n <= 1 ? 0.45 : 0.7;
        const isHL = selectedNodeId && (selectedNodeId === p.id || selectedNodeId === v.id);
        const op = selectedNodeId ? (isHL ? Math.min(baseOp * 2.2, 1) : baseOp * 0.08) : baseOp;

        const sp = classifPositions[p.id];
        const sv = vecPositions[v.id];
        const start = sp.clone();
        const end = sv.clone();
        const mid = new THREE.Vector3(
          (sp.x + sv.x) / 2,
          (sp.y + sv.y) / 2,
          (sp.z + sv.z) / 2,
        );
        const outward = mid.clone().normalize().multiplyScalar(18);
        mid.add(outward);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const pts = curve.getPoints(24);
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op });
        const line = new THREE.Line(geom, mat);
        line.name = `${p.id}-${v.id}`;
        result.push(line);
      });
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules, selectedNodeId]);

  // Update material opacity without recreating geometry
  useMemo(() => {
    lineObjects.forEach((line, i) => {
      const pIdx = Math.floor(i / VECTORS.length);
      const vIdx = i % VECTORS.length;
      const p = PRESETS[pIdx];
      const v = VECTORS[vIdx];
      const n = rules.filter(r => {
        const covers = r.classifIds ? r.classifIds.includes(p.id) : r.classifId === p.id;
        return covers && r.vectors.includes(v.id);
      }).length;
      const baseOp = n === 0 ? 0.14 : n <= 1 ? 0.45 : 0.7;
      const isHL = selectedNodeId && (selectedNodeId === p.id || selectedNodeId === v.id);
      const op = selectedNodeId ? (isHL ? Math.min(baseOp * 2.2, 1) : baseOp * 0.08) : baseOp;
      if (line.material instanceof THREE.LineBasicMaterial) {
        line.material.opacity = op;
      }
    });
  }, [rules, selectedNodeId, lineObjects]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      lineObjects.forEach(line => {
        line.geometry.dispose();
        if (Array.isArray(line.material)) {
          line.material.forEach(m => m.dispose());
        } else {
          line.material.dispose();
        }
      });
    };
  }, [lineObjects]);

  return (
    <group>
      {lineObjects.map((line, i) => (
        <primitive key={line.name || i} object={line} />
      ))}
    </group>
  );
}

// ── Vector nodes ──
function VectorNodes({
  positions, selectedNodeId, onSelect,
}: {
  positions: Record<string, THREE.Vector3>;
  selectedNodeId: string | null;
  onSelect: (id: string, type: 'vector') => void;
}) {
  return (
    <group>
      {VECTORS.map(v => {
        const pos = positions[v.id];
        const isHL = selectedNodeId === v.id;
        const r = isHL ? 15 : 10;

        return (
          <group key={v.id}>
            <mesh
              position={pos}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(v.id, 'vector'); }}
            >
              <sphereGeometry args={[r, 24, 24]} />
              <meshPhongMaterial
                color={TEAL_HEX}
                emissive={isHL ? TEAL_HEX : 0x082a28}
                emissiveIntensity={isHL ? 0.45 : 0.08}
                transparent
                opacity={selectedNodeId && !isHL ? 0.22 : 0.88}
                shininess={120}
                specular={new THREE.Color(0x88ffee)}
              />
            </mesh>
            {isHL && (
              <>
                <mesh position={pos}>
                  <sphereGeometry args={[r + 4, 24, 24]} />
                  <meshBasicMaterial color={TEAL_HEX} transparent opacity={0.18} side={THREE.BackSide} />
                </mesh>
                <mesh position={pos}>
                  <sphereGeometry args={[r + 9, 24, 24]} />
                  <meshBasicMaterial color={TEAL_HEX} transparent opacity={0.07} side={THREE.BackSide} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Deterministic rotation from node ID (avoids Math.random() in render)
const NODE_ROTATIONS: Record<string, [number, number, number]> = {};
function getNodeRotation(id: string): [number, number, number] {
  if (!NODE_ROTATIONS[id]) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    NODE_ROTATIONS[id] = [
      (Math.abs(hash * 7) % 100) / 100 * 0.5,
      (Math.abs(hash * 13) % 100) / 100 * 0.5,
      (Math.abs(hash * 17) % 100) / 100 * 0.5,
    ];
  }
  return NODE_ROTATIONS[id];
}

// ── Classification nodes ──
function ClassifNodes({
  positions, selectedNodeId, onSelect,
}: {
  positions: Record<string, THREE.Vector3>;
  selectedNodeId: string | null;
  onSelect: (id: string, type: 'classif') => void;
}) {
  const { riskOverrides } = useAppState();

  return (
    <group>
      {PRESETS.map(p => {
        const pos = positions[p.id];
        const risk = riskOverrides[p.id] || p.risk;
        const col = RISK_HEX[risk];
        const emissCol = RISK_EMISSIVE[risk];
        const specCol = RISK_SPECULAR[risk];
        const isHL = selectedNodeId === p.id;
        const r = isHL ? 18 : 13;
        const rot = getNodeRotation(p.id);

        return (
          <group key={p.id}>
            <mesh
              position={pos}
              rotation={rot}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(p.id, 'classif'); }}
            >
              <octahedronGeometry args={[r, 0]} />
              <meshPhongMaterial
                color={col}
                emissive={isHL ? col : emissCol}
                emissiveIntensity={isHL ? 0.5 : 0.12}
                transparent
                opacity={selectedNodeId && !isHL ? 0.25 : 0.92}
                shininess={90}
                flatShading
                specular={new THREE.Color(specCol)}
              />
            </mesh>
            {isHL && (
              <>
                <mesh position={pos}>
                  <sphereGeometry args={[r + 5, 16, 16]} />
                  <meshBasicMaterial color={col} transparent opacity={0.15} side={THREE.BackSide} />
                </mesh>
                <mesh position={pos}>
                  <sphereGeometry args={[r + 12, 16, 16]} />
                  <meshBasicMaterial color={col} transparent opacity={0.06} side={THREE.BackSide} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ── Decorative elements ──
function Decorations() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[112, 16, 12]} />
        <meshBasicMaterial color={0x1a2540} wireframe transparent opacity={0.12} />
      </mesh>
      <mesh>
        <torusGeometry args={[112, 0.5, 8, 64]} />
        <meshBasicMaterial color={0x2a3a60} transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[112, 0.4, 8, 64]} />
        <meshBasicMaterial color={0x1e2e50} transparent opacity={0.2} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[112, 0.4, 8, 64]} />
        <meshBasicMaterial color={0x1e2e50} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ── Inner scene ──
function Scene({
  onSelectNode,
  onHoverNode,
}: {
  onSelectNode: (id: string, type: 'classif' | 'vector') => void;
  onHoverNode: (data: { id: string; type: 'classif' | 'vector'; mouseX: number; mouseY: number } | null) => void;
}) {
  const { rules, selectedNodeId } = useAppState();
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const vecPositions = useMemo(() => getVectorPositions(), []);
  const classifPositions = useMemo(() => getClassifPositions(), []);

  // Smooth-zoom target: the node position we're animating toward (null = no target)
  const zoomTargetRef = useRef<THREE.Vector3 | null>(null);

  // Set or clear the zoom target when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) {
      zoomTargetRef.current = null;
      return;
    }
    const pos = vecPositions[selectedNodeId] || classifPositions[selectedNodeId];
    zoomTargetRef.current = pos ? pos.clone() : null;
  }, [selectedNodeId, vecPositions, classifPositions]);

  // Gentle auto-tumble + smooth zoom-to-node in the frame loop
  useFrame((_, delta) => {
    // Auto-rotate the group when no node zoom is active
    if (groupRef.current && !zoomTargetRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }

    // Smoothly animate camera toward the selected node
    if (zoomTargetRef.current && controlsRef.current) {
      const controls = controlsRef.current;
      const damping = 0.06; // matches original damped-rotation factor
      const targetDist = 168; // matches original zoomToNode distance

      // Lerp the OrbitControls lookAt target toward the node
      controls.target.lerp(zoomTargetRef.current, damping);

      // Smoothly adjust camera distance
      const camDir = camera.position.clone().sub(controls.target);
      const currentDist = camDir.length();
      const newDist = currentDist + (targetDist - currentDist) * damping;
      const dir = camDir.normalize();
      camera.position.copy(controls.target).addScaledVector(dir, newDist);

      // Flag that controls need an update next frame
      controls.update();
    }
  });

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.intersections?.[0]?.object?.userData) {
      const d = e.intersections[0].object.userData;
      if (d.id) {
        onHoverNode({ id: d.id, type: d.type, mouseX: e.nativeEvent.clientX, mouseY: e.nativeEvent.clientY });
        return;
      }
    }
    onHoverNode(null);
  }, [onHoverNode]);

  return (
    <group ref={groupRef} onPointerMove={handlePointerMove}>
      <Edges rules={rules} selectedNodeId={selectedNodeId} vecPositions={vecPositions} classifPositions={classifPositions} />
      <VectorNodes positions={vecPositions} selectedNodeId={selectedNodeId} onSelect={onSelectNode} />
      <ClassifNodes positions={classifPositions} selectedNodeId={selectedNodeId} onSelect={onSelectNode} />
      <Decorations />

      {/* OrbitControls inside Scene so we can access the ref */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.3}
        minDistance={80}
        maxDistance={700}
      />
    </group>
  );
}

// ── Exported component ──
interface ThreeGraphProps {
  onSelectNode: (id: string, type: 'classif' | 'vector') => void;
  onHoverNode: (data: { id: string; type: 'classif' | 'vector'; mouseX: number; mouseY: number } | null) => void;
  onBackgroundClick: () => void;
}

export function ThreeGraph({ onSelectNode, onHoverNode, onBackgroundClick }: ThreeGraphProps) {
  return (
    <div className="canvas-wrap" style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 294], fov: 45, near: 1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={onBackgroundClick}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[180, 280, 180]} intensity={1.0} />
        <directionalLight position={[-180, -100, -120]} intensity={0.4} color={0x3355cc} />
        <directionalLight position={[0, 200, -200]} intensity={0.15} color={0x00ffcc} />
        <Scene onSelectNode={onSelectNode} onHoverNode={onHoverNode} />
      </Canvas>
    </div>
  );
}
