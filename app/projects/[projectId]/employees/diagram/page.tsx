"use client";

import {useEffect, useState} from "react";
import ReactFlow, {
    Background,
    Connection,
    Controls,
    Edge,
    EdgeMouseHandler,
    Handle,
    MiniMap,
    Node,
    NodeMouseHandler,
    Position,
    useEdgesState,
    useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {useParams} from "next/navigation";
import {instance} from "@/app/api/instance";
import {EdgeResponse, NodeResponse} from "@/app/types";

type EmployeeNodeData = {
    id: string;
    name: string;
    role: string;
    borderColor: string;
};

type EmployeeNodeProps = {
    data: EmployeeNodeData;
};

function EmployeeNode({ data }: EmployeeNodeProps) {
    const sourceStyle = {
        background: "#22c55e",
        width: 8,
        height: 8,
    };

    const targetStyle = {
        background: "#ef4444",
        width: 8,
        height: 8,
    };

    return (
        <div
            className="relative bg-gray-800 text-white border rounded-lg px-3 py-6 shadow-md min-w-[150px] text-center"
            style={{
                border: `2px solid ${data.borderColor || "#6366f1"}`
            }}
        >
            {/* LEFT side: separated source & target */}
            <Handle
                id="left-source"
                type="source"
                position={Position.Left}
                style={{ top: "35%", ...sourceStyle }}
            />

            <Handle
                id="left-target"
                type="target"
                position={Position.Left}
                style={{ top: "65%", ...targetStyle }}
            />

            {/* RIGHT side */}
            <Handle
                id="right-source"
                type="source"
                position={Position.Right}
                style={{ top: "35%", ...sourceStyle }}
            />

            <Handle
                id="right-target"
                type="target"
                position={Position.Right}
                style={{ top: "65%", ...targetStyle }}
            />

            {/* TOP */}
            <Handle
                id="top-source"
                type="source"
                position={Position.Top}
                style={{ left: "40%", ...sourceStyle }}
            />
            <Handle
                id="top-target"
                type="target"
                position={Position.Top}
                style={{ left: "60%", ...targetStyle }}
            />

            {/* BOTTOM */}
            <Handle
                id="bottom-source"
                type="source"
                position={Position.Bottom}
                style={{ left: "40%", ...sourceStyle }}
            />
            <Handle
                id="bottom-target"
                type="target"
                position={Position.Bottom}
                style={{ left: "60%", ...targetStyle }}
            />

            {/* CONTENT */}
            <div className="font-semibold">{data.name}</div>
            <div className="text-sm text-gray-400">{data.role}</div>
        </div>
    );
}
const nodeTypes = {
    employee: EmployeeNode,
};
export default function EmployeeHierarchyPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [newNodeColor, setNewNodeColor] = useState("#6366f1");
    const params = useParams();
    const projectId = Array.isArray(params.projectId)
        ? params.projectId[0]
        : params.projectId;
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const onNodeClick: NodeMouseHandler = (_event, node) => {
        setSelectedNode(node);
    };
    const onEdgeClick: EdgeMouseHandler = (_event, edge) => {
        setSelectedEdge(edge);
    };
    const onPaneClick = () => {
        setSelectedNode(null);
        setSelectedEdge(null);
    };
    const fetchGraph = async () => {
        const [nodesRes, edgesRes] = await Promise.all([
            instance.get<NodeResponse[]>(`/graph/${projectId}/nodes`),
            instance.get<EdgeResponse[]>(`/graph/${projectId}/edges`),
        ]);

        const rfNodes = nodesRes.data.map((n) => ({
            id: n.id.toString(),
            type: n.type,
            position: {x: n.x, y: n.y},
            data: {
                id: n.id.toString(),
                name: n.name,
                role: n.role,
                borderColor: n.color || "#6366f1", // default
            },
        }));

        const rfEdges = edgesRes.data.map((e) => ({
            id: e.id.toString(),
            source: e.source.toString(),
            target: e.target.toString(),
            sourceHandle: e.source_handle,
            targetHandle: e.target_handle,
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
    };
    useEffect(() => {
        if (!projectId) return;

        fetchGraph();
    }, [projectId]);

    const addNode = async () => {
        if (!name || !role) return;

        const payload = {
            type: "employee",
            name,
            role,
            color: newNodeColor,
            x: Math.random() * 400,
            y: Math.random() * 400,
        };

        const res = await instance.post(`/graph/${projectId}/nodes`, payload);
        const created = res.data;

        setNodes((nds) => [
            ...nds,
            {
                id: created.id.toString(),
                type: created.type,
                position: {x: created.x, y: created.y},
                data: {
                    name: created.name,
                    role: created.role,
                    borderColor: created.color
                },
            },
        ]);

        setName("");
        setRole("");
    };

    // =====================
    // Create Edge
    // =====================
    const onConnect = async (params: Connection) => {
        debugger;
        const payload = {
            source: Number(params.source),
            target: Number(params.target),
            source_handle: params.sourceHandle,
            target_handle: params.targetHandle,
        };

        await instance.post(`/graph/${projectId}/edges`, payload);
        fetchGraph();
    };

    const onNodeDragStop: NodeMouseHandler = async (
        _event,
        node: Node<EmployeeNodeData>
    ) => {
        await instance.put(`/graph/nodes/${node.id}`, {
            x: node.position.x,
            y: node.position.y,
            color: node.data.borderColor,
        });
    };

    return (
        <div className="min-h-screen bg-gray-850 text-white">
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-6 text-center">
                    Команда
                </h1>

                {/* Form */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                    <input
                        type="text"
                        placeholder="Ім'я"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-indigo-600 bg-transparent rounded px-3 py-2 text-white focus:outline-none"
                        autoComplete="off"
                    />

                    <input
                        type="text"
                        placeholder="Роль"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="border border-indigo-600 bg-transparent rounded px-3 py-2 text-white focus:outline-none"
                        autoComplete="off"
                    />
                    <input
                        type="color"
                        value={newNodeColor}
                        onChange={async (e) => {
                            if (selectedNode) {
                                await instance.put(`/graph/nodes/${selectedNode.id}`, {
                                    x: selectedNode.position?.x,
                                    y: selectedNode.position?.y,
                                    color: e.target.value,
                                });

                                fetchGraph();
                            } else {
                                setNewNodeColor(e.target.value)
                            }
                        }
                        }
                        className="w-10 h-10 p-0 border-none bg-transparent"
                    />
                    <button
                        onClick={addNode}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition"
                    >
                        Створити
                    </button>
                    <button
                        disabled={!selectedNode && !selectedEdge}
                        onClick={() => setIsDeleteModalOpen(true)}
                        className={`px-4 py-2 rounded transition ${
                            selectedNode || selectedEdge
                                ? "bg-red-600 hover:bg-red-500"
                                : "bg-gray-700 text-gray-600 cursor-not-allowed"
                        }`}
                    >
                        Видалити
                    </button>
                </div>
                {/* Diagram */}
                <div className="h-[70vh] border border-gray-700 rounded">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDragStop={onNodeDragStop}
                        fitView
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        onPaneClick={onPaneClick}   // 👈 add this
                    >
                        <MiniMap
                            nodeColor={() => "#6366f1"}
                            maskColor="rgba(17, 24, 39, 0.6)"
                        />
                        <Controls/>
                        <Background/>
                    </ReactFlow>
                </div>
            </div>
            {isDeleteModalOpen && selectedNode && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                    <div className="bg-gray-800 p-6 rounded shadow-lg w-[300px] text-center">
                        <h2 className="text-lg mb-4">
                            Видалить ноду <b>{selectedNode.data.name}</b>?
                        </h2>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-600 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    await instance.delete(`/graph/nodes/${selectedNode.id}`);

                                    fetchGraph();

                                    setIsDeleteModalOpen(false);
                                    setSelectedNode(null);
                                }}
                                className="px-4 py-2 bg-red-600 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isDeleteModalOpen && selectedEdge && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                    <div className="bg-gray-800 p-6 rounded shadow-lg w-[300px] text-center">
                        <h2 className="text-lg mb-4">
                            Видалить цей зв&#39;язок?
                        </h2>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-600 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    await instance.delete(`/graph/edges/${selectedEdge.id}`);

                                    fetchGraph();

                                    setIsDeleteModalOpen(false);
                                    setSelectedEdge(null);
                                }}
                                className="px-4 py-2 bg-red-600 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}