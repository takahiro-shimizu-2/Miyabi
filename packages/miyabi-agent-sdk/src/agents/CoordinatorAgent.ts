/**
 * CoordinatorAgent - 最上位意思決定 Agent
 *
 * タスク分解 → DAG生成 → Critical Path特定 → 並列実行制御
 */

interface TaskNode {
  id: string;
  description: string;
  agent: string;
  estimatedTime: number;
  dependencies: string[];
}

interface TaskEdge {
  from: string;
  to: string;
}

interface TaskDAG {
  nodes: TaskNode[];
  edges: TaskEdge[];
}

export interface CoordinatorInput {
  issueNumber: number;
  owner: string;
  repository: string;
  complexity?: string;
}

export interface CoordinatorOutput {
  success: boolean;
  data?: {
    taskGraph: TaskDAG;
    criticalPath: string[];
    parallelGroups: string[][];
    estimatedDuration: number;
  };
  error?: string;
}

export class CoordinatorAgent {
  private maxConcurrency = 3;

  async execute(input: CoordinatorInput): Promise<CoordinatorOutput> {
    try {
      const issueData = await this.analyzeIssue(input);
      const taskGraph = this.generateDAG(issueData);
      this.validateDAG(taskGraph);
      const criticalPath = this.findCriticalPath(taskGraph);
      const parallelGroups = this.groupParallelizable(taskGraph);
      const estimatedDuration = this.calculateDuration(taskGraph, criticalPath);

      return {
        success: true,
        data: { taskGraph, criticalPath, parallelGroups, estimatedDuration },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async analyzeIssue(input: CoordinatorInput): Promise<{
    number: number;
    complexity: string;
  }> {
    return {
      number: input.issueNumber,
      complexity: input.complexity || "medium",
    };
  }

  private generateDAG(issueData: { complexity: string }): TaskDAG {
    const nodes: TaskNode[] = [];
    const edges: TaskEdge[] = [];

    switch (issueData.complexity) {
      case "small":
        nodes.push(
          { id: "task-1", description: "Issue調査・要件整理", agent: "IssueAgent", estimatedTime: 15, dependencies: [] },
          { id: "task-2", description: "コード実装", agent: "CodeGenAgent", estimatedTime: 30, dependencies: ["task-1"] },
          { id: "task-3", description: "コードレビュー", agent: "ReviewAgent", estimatedTime: 15, dependencies: ["task-2"] },
          { id: "task-4", description: "PR作成", agent: "PRAgent", estimatedTime: 10, dependencies: ["task-3"] }
        );
        edges.push(
          { from: "task-1", to: "task-2" },
          { from: "task-2", to: "task-3" },
          { from: "task-3", to: "task-4" }
        );
        break;

      case "medium":
        nodes.push(
          { id: "task-1", description: "Issue調査・要件整理", agent: "IssueAgent", estimatedTime: 30, dependencies: [] },
          { id: "task-2", description: "コア機能実装", agent: "CodeGenAgent", estimatedTime: 60, dependencies: ["task-1"] },
          { id: "task-3", description: "テストコード実装", agent: "CodeGenAgent", estimatedTime: 45, dependencies: ["task-1"] },
          { id: "task-4", description: "コードレビュー", agent: "ReviewAgent", estimatedTime: 30, dependencies: ["task-2", "task-3"] },
          { id: "task-5", description: "PR作成", agent: "PRAgent", estimatedTime: 10, dependencies: ["task-4"] }
        );
        edges.push(
          { from: "task-1", to: "task-2" },
          { from: "task-1", to: "task-3" },
          { from: "task-2", to: "task-4" },
          { from: "task-3", to: "task-4" },
          { from: "task-4", to: "task-5" }
        );
        break;

      case "large":
      case "xlarge":
        nodes.push(
          { id: "task-1", description: "Issue調査・設計", agent: "IssueAgent", estimatedTime: 60, dependencies: [] },
          { id: "task-2", description: "モジュールA実装", agent: "CodeGenAgent", estimatedTime: 120, dependencies: ["task-1"] },
          { id: "task-3", description: "モジュールB実装", agent: "CodeGenAgent", estimatedTime: 120, dependencies: ["task-1"] },
          { id: "task-4", description: "モジュールC実装", agent: "CodeGenAgent", estimatedTime: 120, dependencies: ["task-1"] },
          { id: "task-5", description: "統合テスト", agent: "TestAgent", estimatedTime: 45, dependencies: ["task-2", "task-3", "task-4"] },
          { id: "task-6", description: "コードレビュー", agent: "ReviewAgent", estimatedTime: 60, dependencies: ["task-5"] },
          { id: "task-7", description: "PR作成", agent: "PRAgent", estimatedTime: 15, dependencies: ["task-6"] }
        );
        edges.push(
          { from: "task-1", to: "task-2" },
          { from: "task-1", to: "task-3" },
          { from: "task-1", to: "task-4" },
          { from: "task-2", to: "task-5" },
          { from: "task-3", to: "task-5" },
          { from: "task-4", to: "task-5" },
          { from: "task-5", to: "task-6" },
          { from: "task-6", to: "task-7" }
        );
        break;
    }

    return { nodes, edges };
  }

  private validateDAG(dag: TaskDAG): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const outgoingEdges = dag.edges.filter((e) => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          if (hasCycle(edge.to)) return true;
        } else if (recursionStack.has(edge.to)) {
          return true;
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of dag.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          throw new Error(
            `Circular dependency detected in DAG at node: ${node.id}`
          );
        }
      }
    }
  }

  private findCriticalPath(dag: TaskDAG): string[] {
    const sorted = this.topologicalSort(dag);
    const maxDistance = new Map<string, number>();
    const predecessor = new Map<string, string | null>();

    for (const nodeId of sorted) {
      const node = dag.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      const incomingEdges = dag.edges.filter((e) => e.to === nodeId);
      if (incomingEdges.length === 0) {
        maxDistance.set(nodeId, node.estimatedTime);
        predecessor.set(nodeId, null);
      } else {
        let maxDist = 0;
        let maxPred: string | null = null;
        for (const edge of incomingEdges) {
          const parentDist = maxDistance.get(edge.from) || 0;
          if (parentDist > maxDist) {
            maxDist = parentDist;
            maxPred = edge.from;
          }
        }
        maxDistance.set(nodeId, maxDist + node.estimatedTime);
        predecessor.set(nodeId, maxPred);
      }
    }

    let maxDist = 0;
    let endNode: string | null = null;
    for (const [nodeId, dist] of maxDistance.entries()) {
      if (dist > maxDist) {
        maxDist = dist;
        endNode = nodeId;
      }
    }

    if (!endNode) return [];
    const criticalPath: string[] = [];
    let current: string | null = endNode;
    while (current) {
      criticalPath.unshift(current);
      current = predecessor.get(current) || null;
    }
    return criticalPath;
  }

  private topologicalSort(dag: TaskDAG): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const node of dag.nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }
    for (const edge of dag.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      adjList.get(edge.from)?.push(edge.to);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);
      for (const neighbor of adjList.get(current) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== dag.nodes.length) {
      throw new Error("DAG contains a cycle (topological sort failed)");
    }
    return sorted;
  }

  private groupParallelizable(dag: TaskDAG): string[][] {
    const groups: string[][] = [];
    const completed = new Set<string>();
    const sorted = this.topologicalSort(dag);

    while (completed.size < dag.nodes.length) {
      const currentGroup: string[] = [];
      for (const nodeId of sorted) {
        if (completed.has(nodeId)) continue;
        const node = dag.nodes.find((n) => n.id === nodeId);
        if (!node) continue;
        const allDepsCompleted = node.dependencies.every((dep) =>
          completed.has(dep)
        );
        if (allDepsCompleted) {
          currentGroup.push(nodeId);
          if (currentGroup.length >= this.maxConcurrency) break;
        }
      }
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup.forEach((nodeId) => completed.add(nodeId));
      } else {
        break;
      }
    }
    return groups;
  }

  private calculateDuration(dag: TaskDAG, criticalPath: string[]): number {
    let totalTime = 0;
    for (const nodeId of criticalPath) {
      const node = dag.nodes.find((n) => n.id === nodeId);
      if (node) totalTime += node.estimatedTime;
    }
    return totalTime;
  }
}
