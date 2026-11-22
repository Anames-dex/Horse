import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Horse } from '../../engine/types';
import { HorseTreeNode } from './HorseTreeNode';

interface PedigreeTreeProps {
  horses: Horse[];
  optimalSireId?: string;
  optimalDamId?: string;
  selectedHorseId?: string | null;
  onSelectHorse?: (id: string) => void;
}

const nodeTypes = {
  horseNode: HorseTreeNode,
};

export const PedigreeTree: React.FC<PedigreeTreeProps> = ({
  horses,
  optimalSireId,
  optimalDamId,
  onSelectHorse,
}) => {
  // Compute positions and layout dynamically based on generations
  const { nodes, edges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    // Group horses by generation
    const byGen = new Map<number, Horse[]>();
    for (const h of horses) {
      const g = h.generation || 0;
      if (!byGen.has(g)) {
        byGen.set(g, []);
      }
      byGen.get(g)!.push(h);
    }

    const sortedGens = Array.from(byGen.keys()).sort((a, b) => a - b);

    // Compute layout
    sortedGens.forEach((gen) => {
      const list = byGen.get(gen)!;
      const count = list.length;
      const totalWidth = count * 290;
      const startX = -totalWidth / 2 + 145;

      list.forEach((horse, idx) => {
        const xPos = startX + idx * 290;
        const yPos = gen * 230;

        nodesList.push({
          id: horse.id,
          type: 'horseNode',
          position: { x: xPos, y: yPos },
          data: {
            horse,
            isOptimalSire: horse.id === optimalSireId,
            isOptimalDam: horse.id === optimalDamId,
            onSelectHorse,
          },
        });

        // Add parent edges
        if (horse.sireId) {
          edgesList.push({
            id: `e-sire-${horse.sireId}-${horse.id}`,
            source: horse.sireId,
            target: horse.id,
            label: 'Sire',
            type: 'smoothstep',
            animated: horse.id === optimalSireId || horse.sireId === optimalSireId,
            style: {
              stroke: '#38bdf8',
              strokeWidth: 2,
            },
            labelStyle: { fill: '#7dd3fc', fontSize: 10, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#09090b', fillOpacity: 0.8 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#38bdf8',
            },
          });
        }

        if (horse.damId) {
          edgesList.push({
            id: `e-dam-${horse.damId}-${horse.id}`,
            source: horse.damId,
            target: horse.id,
            label: 'Dam',
            type: 'smoothstep',
            animated: horse.id === optimalDamId || horse.damId === optimalDamId,
            style: {
              stroke: '#f43f5e',
              strokeWidth: 2,
            },
            labelStyle: { fill: '#fda4af', fontSize: 10, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#09090b', fillOpacity: 0.8 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#f43f5e',
            },
          });
        }
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [horses, optimalSireId, optimalDamId, onSelectHorse]);

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.5}
        className="bg-zinc-950"
      >
        <Background color="#27272a" gap={20} size={1} />
        <Controls className="!bg-zinc-900 !border-zinc-800" />
        <MiniMap
          nodeColor={(n) => {
            if (n.id === optimalSireId || n.id === optimalDamId) return '#10b981';
            return '#3f3f46';
          }}
          maskColor="rgba(9, 9, 11, 0.75)"
          className="!bg-zinc-950 !border-zinc-800 !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
};
