"use client";

import { useCallback, useMemo, useEffect } from "react";
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
  useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import MindMapNode from "./MindMapNode";

// --- ALGORITHME DE MISE EN PAGE (DAGRE) ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 200 });

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

// --- COMPOSANT INTERNE (FLOW) ---
function MindmapFlow({ 
  initialNodes, 
  initialEdges, 
  onDataChange 
}: { 
  initialNodes: Node[], 
  initialEdges: Edge[], 
  onDataChange: (nodes: Node[], edges: Edge[]) => void 
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), []);

  // IMPORTANT : On notifie le parent dès que les nodes ou edges changent localement
  useEffect(() => {
    onDataChange(nodes, edges);
  }, [nodes, edges, onDataChange]);

  // Fonction de réorganisation
  const onLayout = useCallback((currNodes = nodes, currEdges = edges) => {
    const layouted = getLayoutedElements(currNodes, currEdges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [nodes, edges, setNodes, setEdges]);

  // --- LOGIQUE MAGNETIQUE (RE-PARENTAGE AU VOL) ---
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      if (draggedNode.data.isRoot) return;

      const draggedNodeCenter = {
        x: draggedNode.position.x + 90,
        y: draggedNode.position.y + 30,
      };

      let closestNode: Node | null = null;
      let minDistance = 5000;
      const MAGNET_DISTANCE = 150; 

      nodes.forEach((n) => {
        if (n.id === draggedNode.id) return;
        const nodeCenter = { x: n.position.x + 90, y: n.position.y + 30 };
        const dx = nodeCenter.x - draggedNodeCenter.x;
        const dy = nodeCenter.y - draggedNodeCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance < MAGNET_DISTANCE) {
          minDistance = distance;
          closestNode = n;
        }
      });

      if (closestNode) {
        const parentId = (closestNode as Node).id;
        const filteredEdges = edges.filter((e) => e.target !== draggedNode.id);
        const newEdge: Edge = {
          id: `e-${parentId}-${draggedNode.id}`,
          source: parentId,
          target: draggedNode.id,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        const newEdges = addEdge(newEdge, filteredEdges);
        setEdges(newEdges);
        
        // On relance le layout pour aligner proprement après le magnétisme
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
        
        const newNode: Node = {
          id: newNodeId,
          type: "mindmap",
          data: { label: "Nouvelle idée" },
          position: { x: 0, y: 0 },
          selected: true,
        };

        const newEdge: Edge = {
          id: `e-${selectedNode.id}-${newNodeId}`,
          source: selectedNode.id,
          target: newNodeId,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        // --- FIX ICI : On utilise le spread et on caste explicitement ---
        const nextNodes: Node[] = [
          ...nodes.map(n => ({ ...n, selected: false })), 
          newNode
        ];
        const nextEdges: Edge[] = [...edges, newEdge];
        
        onLayout(nextNodes, nextEdges);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const parentEdge = edges.find((e) => e.target === selectedNode.id);
        if (!parentEdge) return;

        const newNodeId = `node-${Date.now()}`;
        const newNode: Node = {
          id: newNodeId,
          type: "mindmap",
          data: { label: "Idée sœur" },
          position: { x: 0, y: 0 },
          selected: true,
        };

        const newEdge: Edge = {
          id: `e-${parentEdge.source}-${newNodeId}`,
          source: parentEdge.source,
          target: newNodeId,
          type: "smoothstep",
          style: { stroke: '#555' }
        };

        // --- FIX ICI AUSSI ---
        const nextNodes: Node[] = [
          ...nodes.map(n => ({ ...n, selected: false })), 
          newNode
        ];
        const nextEdges: Edge[] = [...edges, newEdge];
        
        onLayout(nextNodes, nextEdges);
      }
    },
    [nodes, edges, onLayout]
  );





















  return (
    <div 
      className="h-full w-full bg-neutral-950 outline-none" 
      onKeyDown={onKeyDown} 
      tabIndex={0} 
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Controls className="bg-neutral-800 border-neutral-700 [&>button]:fill-white" />
        <Background color="#333" gap={20} size={1} />
        
        <Panel position="top-right">
          <button
            onClick={() => onLayout()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition text-sm font-medium"
          >
            Réorganiser ⚡️
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}















// --- WRAPPER PUBLIC ---
export default function MindmapCanvas({ initialNodes, initialEdges, onDataChange }: any) {
  // On définit une racine par défaut si les données sont vides
  const defaultNodes = initialNodes?.length > 0 ? initialNodes : [
    {
      id: "root",
      type: "mindmap",
      data: { label: "Cœur du Sujet", isRoot: true },
      position: { x: 0, y: 0 },
    },
  ];
  const defaultEdges = initialEdges || [];

  return (
    <ReactFlowProvider>
      <MindmapFlow 
        initialNodes={defaultNodes} 
        initialEdges={defaultEdges} 
        onDataChange={onDataChange} 
      />
    </ReactFlowProvider>
  );
}