"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow,
  useStoreApi, // Nécessaire pour accéder à l'état interne proprement
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import MindMapNode from "./MindMapNode";

// --- ALGORITHME DE MISE EN PAGE ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Augmentez ranksep pour espacer les colonnes (150 -> 180)
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 30, ranksep: 180 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 180 / 2,
          y: nodeWithPosition.y - 60 / 2,
        },
      };
    }
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

const initialNodes: Node[] = [
  {
    id: "root",
    type: "mindmap",
    data: { label: "Cœur du Sujet", isRoot: true },
    position: { x: 0, y: 0 },
  },
];

function MindmapFlow() {
  const store = useStoreApi(); // Accès direct au store ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), []);

  // Fonction de réorganisation
  const onLayout = useCallback((currNodes = nodes, currEdges = edges) => {
    const layouted = getLayoutedElements(currNodes, currEdges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [nodes, edges, setNodes, setEdges]);

  // --- NOUVELLE LOGIQUE MAGNETIQUE ---
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      // 1. On ne peut pas déplacer la racine
      if (draggedNode.data.isRoot) return;

      // 2. On récupère la position actuelle de la bulle lâchée
      // (ReactFlow met à jour node.position en interne pendant le drag)
      const draggedNodeCenter = {
        x: draggedNode.position.x + 90, // Largeur/2
        y: draggedNode.position.y + 30, // Hauteur/2
      };

      // 3. On cherche la bulle la plus proche
      let closestNode: Node | null = null;
      let minDistance = 5000; // Distance infinie au début
      const MAGNET_DISTANCE = 150; // Distance max pour "accrocher" (en pixels)

      nodes.forEach((n) => {
        // On ne se lie pas à soi-même
        if (n.id === draggedNode.id) return;

        const nodeCenter = {
          x: n.position.x + 90,
          y: n.position.y + 30,
        };

        const dx = nodeCenter.x - draggedNodeCenter.x;
        const dy = nodeCenter.y - draggedNodeCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance < MAGNET_DISTANCE) {
          minDistance = distance;
          closestNode = n;
        }
      });

      // 4. Si on a trouvé un nouveau parent proche
      if (closestNode) {
        // @ts-ignore
        const parentId = closestNode.id;

        // A. On supprime l'ancien lien (celui qui arrivait vers draggedNode)
        const filteredEdges = edges.filter((e) => e.target !== draggedNode.id);

        // B. On crée le nouveau lien
        const newEdge: Edge = {
          id: `e-${parentId}-${draggedNode.id}`,
          source: parentId,
          target: draggedNode.id,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        const newEdges = addEdge(newEdge, filteredEdges);

        // C. On met à jour et ON FORCE LE RANGEMENT
        setEdges(newEdges);
        
        // On appelle le layout avec les nouvelles données immédiatement
        const layouted = getLayoutedElements(nodes, newEdges);
        setNodes(layouted.nodes);
      }
    },
    [nodes, edges, setEdges, setNodes]
  );

  // --- GESTION CLAVIER (Tab/Entrée) ---
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const selectedNode = nodes.find((n) => n.selected);
      if (!selectedNode) return;

      if (event.key === "Tab") {
        event.preventDefault();
        const newNodeId = `node-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: "mindmap",
          data: { label: "Nouvelle idée" },
          position: { x: 0, y: 0 },
          selected: true,
        };
        const newEdge = {
          id: `e-${selectedNode.id}-${newNodeId}`,
          source: selectedNode.id,
          target: newNodeId,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        const nextNodes = nodes.map(n => ({...n, selected: false})).concat(newNode);
        const nextEdges = [...edges, newEdge];
        onLayout(nextNodes, nextEdges);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const parentEdge = edges.find((e) => e.target === selectedNode.id);
        if (!parentEdge) return;

        const newNodeId = `node-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: "mindmap",
          data: { label: "Idée sœur" },
          position: { x: 0, y: 0 },
          selected: true,
        };
        const newEdge = {
          id: `e-${parentEdge.source}-${newNodeId}`,
          source: parentEdge.source,
          target: newNodeId,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        const nextNodes = nodes.map(n => ({...n, selected: false})).concat(newNode);
        const nextEdges = [...edges, newEdge];
        onLayout(nextNodes, nextEdges);
      }
    },
    [nodes, edges, onLayout] // Dépendance simplifiée via onLayout
  );

  return (
    <div 
      className="h-full w-full bg-neutral-950 outline-none" 
      onKeyDown={onKeyDown} 
      tabIndex={0} 
      autoFocus
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop} // C'est ici que la magie opère
        nodeTypes={nodeTypes}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#666' }}
      >
        <Controls className="bg-neutral-800 border-neutral-700 [&>button]:fill-white" />
        <Background color="#333" gap={20} size={1} />
        
        <Panel position="top-right">
          <button
            onClick={() => onLayout(nodes, edges)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition text-sm font-medium"
          >
            Réorganiser ⚡️
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function MindmapCanvas(props: any) {
  return (
    <ReactFlowProvider>
      <MindmapFlow {...props} />
    </ReactFlowProvider>
  );
}