"use client";

import {useEffect, useState} from "react";
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    Controls,
    Handle,
    MiniMap,
    Node, NodeMouseHandler,
    Position,
    useEdgesState,
    useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {useParams} from "next/navigation";
import {instance} from "@/app/api/instance";
import {EdgeResponse, NodeResponse} from "@/app/types";

type EmployeeNodeData = {
    name: string;
    role: string;
};

type EmployeeNodeProps = {
    data: EmployeeNodeData;
};

/**
 * Custom Node Component
 */
function EmployeeNode({data}: EmployeeNodeProps) {
    return (
        <div
            className="bg-gray-800 text-white border border-indigo-600 rounded-lg px-3 py-2 shadow-md min-w-[150px] text-center">
            <Handle type="target" position={Position.Top}/>

            <div className="font-semibold">{data.name}</div>
            <div className="text-sm text-gray-400">{data.role}</div>

            <Handle type="source" position={Position.Bottom}/>
        </div>
    );
}

export default function EmployeeHierarchyPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const params = useParams();
    const projectId = Array.isArray(params.projectId)
        ? params.projectId[0]
        : params.projectId;

    const [name, setName] = useState("");
    const [role, setRole] = useState("");

    const nodeTypes = {
        employee: EmployeeNode,
    };

    // =====================
    // Load Graph
    // =====================
    useEffect(() => {
        if (!projectId) return;

        const fetchGraph = async () => {
            const [nodesRes, edgesRes] = await Promise.all([
                instance.get<NodeResponse[]>(`/graph/${projectId}/nodes`),
                instance.get<EdgeResponse[]>(`/graph/${projectId}/edges`),
            ]);

            const rfNodes = nodesRes.data.map((n) => ({
                id: n.id.toString(),
                type: n.type,
                position: {x: n.x, y: n.y},
                data: {name: n.name, role: n.role},
            }));

            const rfEdges = edgesRes.data.map((e) => ({
                id: e.id.toString(),
                source: e.source.toString(),
                target: e.target.toString(),
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
        };

        fetchGraph();
    }, [projectId]);

    // =====================
    // Create Node
    // =====================
    const addNode = async () => {
        if (!name || !role) return;

        const payload = {
            type: "employee",
            name,
            role,
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
        const payload = {
            source: Number(params.source),
            target: Number(params.target),
        };

        const res = await instance.post(`/graph/${projectId}/edges`, payload);
        const created = res.data;

        setEdges((eds) =>
            addEdge(
                {
                    id: created.id.toString(),
                    source: created.source.toString(),
                    target: created.target.toString(),
                },
                eds
            )
        );
    };

    const onNodeDragStop: NodeMouseHandler = async (
        _event,
        node: Node<EmployeeNodeData>
    ) => {
        await instance.put(`/graph/nodes/${node.id}`, {
            x: node.position.x,
            y: node.position.y,
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

                    <button
                        onClick={addNode}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition"
                    >
                        Створити
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
        </div>
    );
}