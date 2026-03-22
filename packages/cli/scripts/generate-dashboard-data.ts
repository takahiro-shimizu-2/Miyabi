/**
 * Generate Dashboard Data
 *
 * Fetches KPI data from Projects V2 and generates JSON for GitHub Pages dashboard
 */

import { ProjectsV2Client } from '../../coding-agents/github/projects-v2.ts';
import * as fs from 'fs';
import * as path from 'path';

interface DashboardData {
  generated: string;
  summary: {
    totalIssues: number;
    completedIssues: number;
    completionRate: number;
    avgDuration: number;
    totalCost: number;
    avgQualityScore: number;
  };
  trends: {
    date: string;
    completed: number;
    inProgress: number;
    cost: number;
  }[];
  agents: {
    name: string;
    tasksCompleted: number;
    avgDuration: number;
    avgCost: number;
    avgQuality: number;
  }[];
  meta: {
    source: 'project-v2' | 'fallback';
    owner: string;
    repo: string;
    projectNumber: number;
    warning?: string;
  };
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_PROJECT_TOKEN;
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'ShunsukeHayashi/Autonomous-Operations').split('/');
  const projectNumber = parseInt(process.env.GITHUB_PROJECT_NUMBER || '1');

  console.log('📊 Generating dashboard data...');
  console.log(`  Owner: ${owner}`);
  console.log(`  Repo: ${repo}`);
  console.log(`  Project: #${projectNumber}`);

  let source: DashboardData['meta']['source'] = 'fallback';
  let warning: string | undefined;
  let kpi = {
    totalIssues: 0,
    completedIssues: 0,
    avgDuration: 0,
    totalCost: 0,
    avgQualityScore: 0,
  };

  if (!token) {
    warning = 'GITHUB_TOKEN or GH_PROJECT_TOKEN is not configured. Generated fallback dashboard data.';
    console.warn(`Warning: ${warning}`);
  } else {
    try {
      const client = new ProjectsV2Client(token, {
        owner,
        repo,
        projectNumber,
      });

      await client.initialize();
      kpi = await client.generateKPIReport();
      source = 'project-v2';
    } catch (error) {
      warning = formatDashboardWarning(error);
      console.warn(`Warning: ${warning}`);
    }
  }

  // Calculate completion rate
  const completionRate = kpi.totalIssues > 0
    ? (kpi.completedIssues / kpi.totalIssues) * 100
    : 0;

  // Build dashboard data
  const dashboardData: DashboardData = {
    generated: new Date().toISOString(),
    summary: {
      totalIssues: kpi.totalIssues,
      completedIssues: kpi.completedIssues,
      completionRate: Math.round(completionRate * 10) / 10,
      avgDuration: Math.round(kpi.avgDuration * 10) / 10,
      totalCost: Math.round(kpi.totalCost * 100) / 100,
      avgQualityScore: Math.round(kpi.avgQualityScore * 10) / 10,
    },
    trends: source === 'project-v2' ? generateMockTrends() : generateFallbackTrends(),
    agents: source === 'project-v2' ? generateMockAgentData() : [],
    meta: {
      source,
      owner,
      repo,
      projectNumber,
      warning,
    },
  };

  // Ensure docs directory exists
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Write to docs/dashboard-data.json
  const outputPath = path.join(docsDir, 'dashboard-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));

  console.log(`\n✓ Dashboard data generated: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`  Total Issues: ${dashboardData.summary.totalIssues}`);
  console.log(`  Completed: ${dashboardData.summary.completedIssues} (${dashboardData.summary.completionRate}%)`);
  console.log(`  Avg Duration: ${dashboardData.summary.avgDuration} min`);
  console.log(`  Total Cost: $${dashboardData.summary.totalCost}`);
  console.log(`  Avg Quality: ${dashboardData.summary.avgQualityScore}/100`);
  console.log(`  Source: ${dashboardData.meta.source}`);
  if (dashboardData.meta.warning) {
    console.log(`  Warning: ${dashboardData.meta.warning}`);
  }
}

/**
 * Generate mock trend data (last 7 days)
 * TODO: Replace with real data from Projects V2 history
 */
function generateMockTrends() {
  const trends = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    trends.push({
      date: date.toISOString().split('T')[0],
      completed: Math.floor(Math.random() * 5) + 1,
      inProgress: Math.floor(Math.random() * 3) + 1,
      cost: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100,
    });
  }

  return trends;
}

function generateFallbackTrends() {
  const trends = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    trends.push({
      date: date.toISOString().split('T')[0],
      completed: 0,
      inProgress: 0,
      cost: 0,
    });
  }

  return trends;
}

/**
 * Generate mock agent performance data
 * TODO: Replace with real data from Projects V2 custom fields
 */
function generateMockAgentData() {
  return [
    {
      name: 'CodeGenAgent',
      tasksCompleted: 8,
      avgDuration: 7.2,
      avgCost: 0.12,
      avgQuality: 93.5,
    },
    {
      name: 'ReviewAgent',
      tasksCompleted: 5,
      avgDuration: 3.5,
      avgCost: 0.05,
      avgQuality: 96.2,
    },
    {
      name: 'DocsAgent',
      tasksCompleted: 3,
      avgDuration: 4.8,
      avgCost: 0.08,
      avgQuality: 91.7,
    },
    {
      name: 'DeploymentAgent',
      tasksCompleted: 2,
      avgDuration: 15.0,
      avgCost: 0.30,
      avgQuality: 98.5,
    },
  ];
}

function formatDashboardWarning(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('not been granted the required scopes')) {
    return 'GitHub token is missing Projects V2 scopes. Set GH_PROJECT_TOKEN with read:project access.';
  }

  if (message.includes('Could not resolve to a ProjectV2')) {
    return 'GitHub Project V2 was not found. Check GITHUB_PROJECT_NUMBER for this repository.';
  }

  if (message.includes('Bad credentials')) {
    return 'GitHub token could not authenticate. Generated fallback dashboard data.';
  }

  return `Failed to read Projects V2 data. Generated fallback dashboard data instead. Details: ${message}`;
}

main().catch((error) => {
  console.error('Error generating dashboard data:', error);
  process.exit(1);
});
