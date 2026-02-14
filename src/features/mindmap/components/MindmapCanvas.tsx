"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
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
    const linksCount = node.data?.links?.length || 0;
    const nodeHeight = 80 + linksCount * 16;
    dagreGraph.setNode(node.id, { width: 200, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const linksCount = node.data?.links?.length || 0;
    const nodeHeight = 80 + linksCount * 16;
    if (nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 200 / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
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
  onDataChange,
}: {
  initialNodes: Node[];
  initialEdges: Edge[];
  onDataChange: (nodes: Node[], edges: Edge[]) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), []);

  // Track drag start position to distinguish clicks from real drags
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      dragStartPos.current = { x: node.position.x, y: node.position.y };
    },
    []
  );

  // Stable callback for link changes - setNodes is stable from useNodesState
  const handleLinksChange = useCallback(
    (nodeId: string, updatedLinks: any[]) => {
      setNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, links: updatedLinks } }
            : n
        )
      );
    },
    [setNodes]
  );

  // Store in ref so node data callbacks always call latest version
  const linksChangeRef = useRef(handleLinksChange);
  linksChangeRef.current = handleLinksChange;

  // Inject onLinksChange callback into all nodes that don't have it
  useEffect(() => {
    const needsUpdate = nodes.some((n) => !n.data.onLinksChange);
    if (!needsUpdate) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.data.onLinksChange
          ? node
          : {
              ...node,
              data: {
                ...node.data,
                onLinksChange: (updatedLinks: any[]) => {
                  linksChangeRef.current(node.id, updatedLinks);
                },
              },
            }
      )
    );
  }, [nodes, setNodes]);

  // Notify parent when nodes or edges change
  useEffect(() => {
    // Strip out the callback functions before sending data to parent for serialization
    const cleanNodes = nodes.map((n) => ({
      ...n,
      data: { ...n.data, onLinksChange: undefined },
    }));
    onDataChange(cleanNodes, edges);
  }, [nodes, edges, onDataChange]);

  // Fonction de réorganisation
  const onLayout = useCallback(
    (currNodes = nodes, currEdges = edges) => {
      const layouted = getLayoutedElements(currNodes, currEdges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  // --- LOGIQUE MAGNETIQUE (RE-PARENTAGE AU VOL) ---
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      if (draggedNode.data.isRoot) return;

      // Ignore small movements (clicks) - minimum 20px drag distance
      if (dragStartPos.current) {
        const dx = draggedNode.position.x - dragStartPos.current.x;
        const dy = draggedNode.position.y - dragStartPos.current.y;
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        if (dragDistance < 20) {
          // Reset to original position - it was just a click
          setNodes((nds) =>
            nds.map((n) =>
              n.id === draggedNode.id
                ? { ...n, position: { ...dragStartPos.current! } }
                : n
            )
          );
          dragStartPos.current = null;
          return;
        }
      }
      dragStartPos.current = null;

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
          style: { stroke: "#555" },
        };

        const newEdges = addEdge(newEdge, filteredEdges);
        setEdges(newEdges);

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
          style: { stroke: "#555" },
        };

        const nextNodes: Node[] = [
          ...nodes.map((n) => ({ ...n, selected: false })),
          newNode,
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
          style: { stroke: "#555" },
        };

        const nextNodes: Node[] = [
          ...nodes.map((n) => ({ ...n, selected: false })),
          newNode,
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
        onNodeDragStart={onNodeDragStart}
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
            Réorganiser
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// --- WRAPPER PUBLIC ---
export default function MindmapCanvas({
  initialNodes,
  initialEdges,
  onDataChange,
}: any) {
  const defaultNodes =
    initialNodes?.length > 0
      ? initialNodes
      : [
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
