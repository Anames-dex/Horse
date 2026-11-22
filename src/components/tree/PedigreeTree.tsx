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
  onEditHorse?: (horse: Horse) => void;
  onDeleteHorse?: (id: string) => void;
  onAddHorse?: () => void;
}

const nodeTypes = {
  horseNode: HorseTreeNode,
};

export const PedigreeTree: React.FC<PedigreeTreeProps> = ({
  horses,
  optimalSireId,
  optimalDamId,
  onEditHorse,
  onDeleteHorse,
  onAddHorse,
}) => {
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
      const totalWidth = count * 320;
      const startX = -totalWidth / 2 + 160;

      list.forEach((horse, idx) => {
        const xPos = startX + idx * 320;
        const yPos = gen * 220;

        nodesList.push({
          id: horse.id,
          type: 'horseNode',
          position: { x: xPos, y: yPos },
          data: {
            horse,
            isOptimalSire: horse.id === optimalSireId,
            isOptimalDam: horse.id === optimalDamId,
            onEditHorse,
            onDeleteHorse,
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
  }, [horses, optimalSireId, optimalDamId, onEditHorse, onDeleteHorse]);

  if (horses.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
        <div className="max-w-sm p-6 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-zinc-200">No Horses Registered</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            Add foundation horses by entering their in-game hearts, 100-block sprint time, and jump height.
          </p>
          {onAddHorse && (
            <button
              type="button"
              onClick={onAddHorse}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              Add First Horse
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        className="bg-zinc-950"
      >
        <Background color="#27272a" gap={24} size={1} />
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
