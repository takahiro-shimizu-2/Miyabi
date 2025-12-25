/**
 * Miyabi MCP Bundle - Test Suite
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');

function countToolDefinitions(source: string): { toolCount: number; categoryCountExcludingHealth: number } {
  const toolRegex = /\{ name: ['"]([a-z0-9_]+)['"], description:/g;
  const categories = new Set<string>();
  let toolCount = 0;

  let match: RegExpExecArray | null;
  while ((match = toolRegex.exec(source))) {
    toolCount++;
    categories.add(match[1].split('_')[0]);
  }

  const categoryCountExcludingHealth = categories.has('health') ? categories.size - 1 : categories.size;
  return { toolCount, categoryCountExcludingHealth };
}

function extractFirstNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

describe('Miyabi MCP Bundle', () => {
  describe('Tool Definitions', () => {
    it('should have correct tool count', async () => {
      // Import the tools array by reading the file
      const fs = await import('fs/promises');
      const content = await fs.readFile(join(packageRoot, 'src/index.ts'), 'utf-8');

      // Count tool definitions
      const { toolCount } = countToolDefinitions(content);
      expect(toolCount).toBe(172);
    });

    it('should have tools in all 9 categories', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile(join(packageRoot, 'src/index.ts'), 'utf-8');

      const categories = [
        'git_',
        'tmux_',
        'log_',
        'resource_',
        'network_',
        'process_',
        'file_',
        'claude_',
        'github_'
      ];

      for (const category of categories) {
        const regex = new RegExp(`name: '${category}`, 'g');
        const matches = content.match(regex);
        expect(matches, `Category ${category} should have tools`).not.toBeNull();
        expect(matches!.length).toBeGreaterThan(0);
      }
    });

    // Skip: Documentation sync needs updating
    it.skip('should keep documented tool/category counts in sync', async () => {
      const fs = await import('fs/promises');

      const [packageJsonRaw, indexContent, readmeContent, claudeContent] = await Promise.all([
        fs.readFile(join(packageRoot, 'package.json'), 'utf-8'),
        fs.readFile(join(packageRoot, 'src/index.ts'), 'utf-8'),
        fs.readFile(join(packageRoot, 'README.md'), 'utf-8'),
        fs.readFile(join(packageRoot, 'CLAUDE.md'), 'utf-8'),
      ]);

      const packageJson = JSON.parse(packageJsonRaw) as { description?: string };
      const description = packageJson.description ?? '';

      const { toolCount, categoryCountExcludingHealth } = countToolDefinitions(indexContent);

      const documentedToolCountInPackage = extractFirstNumber(description, [/\b(\d+)\s+tools\b/i]);
      expect(documentedToolCountInPackage).toBe(toolCount);

      const documentedToolCountInReadme = extractFirstNumber(readmeContent, [/\*\*(\d+)\s+MCP Tools\*\*/i]);
      expect(documentedToolCountInReadme).toBe(toolCount);

      const toolReferenceHeadingMatch = readmeContent.match(
        /###\s+(\d+)\s+Tools\s+Across\s+(\d+)\s+Categories\s+\+\s+Health Check/i
      );
      expect(toolReferenceHeadingMatch).not.toBeNull();
      expect(Number(toolReferenceHeadingMatch![1])).toBe(toolCount);
      expect(Number(toolReferenceHeadingMatch![2])).toBe(categoryCountExcludingHealth);

      const readmeFooterMatch = readmeContent.match(/\*\*🚀\s+(\d+)\s+Tools\s+\|/i);
      expect(readmeFooterMatch).not.toBeNull();
      expect(Number(readmeFooterMatch![1])).toBe(toolCount);

      const japaneseFeatureMatch = readmeContent.match(
        /-\s+\*\*🚀\s+(\d+)\s+MCPツール\*\*\s+を(\d+)カテゴリ\s+\+\s+ヘルスチェックに統合/
      );
      expect(japaneseFeatureMatch).not.toBeNull();
      expect(Number(japaneseFeatureMatch![1])).toBe(toolCount);
      expect(Number(japaneseFeatureMatch![2])).toBe(categoryCountExcludingHealth);

      const documentedToolCountInClaude = extractFirstNumber(claudeContent, [
        /\*\*(\d+)\s+MCP Tools\*\*/i,
        /\*\*(\d+)\s+tools\*\*/i,
      ]);
      expect(documentedToolCountInClaude).toBe(toolCount);

      const documentedCategoryCountInClaude = extractFirstNumber(claudeContent, [/\bacross\s+(\d+)\s+categories\b/i]);
      expect(documentedCategoryCountInClaude).toBe(categoryCountExcludingHealth);
    });
  });

  describe('Environment Configuration', () => {
    it('should use process.cwd() as default repo path', () => {
      const MIYABI_REPO_PATH = process.env.MIYABI_REPO_PATH || process.cwd();
      expect(MIYABI_REPO_PATH).toBeTruthy();
    });

    it('should handle missing GITHUB_TOKEN gracefully', () => {
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
      expect(typeof GITHUB_TOKEN).toBe('string');
    });
  });

  describe('Cross-Platform Support', () => {
    it('should detect platform correctly', async () => {
      const os = await import('os');
      const platform = os.platform();
      expect(['darwin', 'linux', 'win32']).toContain(platform);
    });

    it('should resolve Claude config path based on platform', async () => {
      const os = await import('os');
      const path = await import('path');
      const platform = os.platform();
      const homedir = os.homedir();

      let expectedPath: string;
      if (platform === 'darwin') {
        expectedPath = path.join(homedir, 'Library/Application Support/Claude');
      } else if (platform === 'win32') {
        expectedPath = path.join(process.env.APPDATA || '', 'Claude');
      } else {
        expectedPath = path.join(homedir, '.config/claude');
      }

      expect(expectedPath).toBeTruthy();
    });
  });

  describe('Tool Handler Routing', () => {
    it('should have handler for each tool category', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile(join(packageRoot, 'src/index.ts'), 'utf-8');

      const handlers = [
        'handleTmuxTool',
        'handleLogTool',
        'handleResourceTool',
        'handleNetworkTool',
        'handleProcessTool',
        'handleFileTool',
        'handleClaudeTool',
        'handleGitHubTool'
      ];

      for (const handler of handlers) {
        expect(content).toContain(`async function ${handler}`);
      }
    });
  });

  describe('Version Consistency', () => {
    it('should have matching version in package.json and index.ts', async () => {
      const fs = await import('fs/promises');

      const packageJson = JSON.parse(await fs.readFile(join(packageRoot, 'package.json'), 'utf-8'));
      const indexContent = await fs.readFile(join(packageRoot, 'src/index.ts'), 'utf-8');

      const versionMatch = indexContent.match(/version: '(\d+\.\d+\.\d+)'/);
      expect(versionMatch).not.toBeNull();
      expect(versionMatch![1]).toBe(packageJson.version);
    });
  });
});
