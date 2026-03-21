/**
 * Cross-platform utilities for Miyabi CLI
 * Provides Windows/macOS/Linux compatibility
 */

import type { ExecSyncOptions, SpawnSyncOptions } from 'child_process';
import { execSync } from 'node:child_process';
import { platform } from 'os';

/**
 * Check if running on Windows
 */
export const isWindows = (): boolean => platform() === 'win32';

/**
 * Check if running on macOS
 */
export const isMacOS = (): boolean => platform() === 'darwin';

/**
 * Check if running on Linux
 */
export const isLinux = (): boolean => platform() === 'linux';

/**
 * Get the current platform name
 */
export const getPlatform = (): 'windows' | 'macos' | 'linux' | 'unknown' => {
  const p = platform();
  if (p === 'win32') {return 'windows';}
  if (p === 'darwin') {return 'macos';}
  if (p === 'linux') {return 'linux';}
  return 'unknown';
};

export interface ExecCommandOptions extends Omit<ExecSyncOptions, 'encoding'> {
  /** Suppress stderr output */
  silent?: boolean;
}

/**
 * Execute a shell command with cross-platform compatibility
 * Automatically adds shell: true on Windows for proper command execution
 */
export function execCommand(
  command: string,
  options: ExecCommandOptions = {}
): string {
  const { silent, ...execOptions } = options;

  const opts: ExecSyncOptions = {
    encoding: 'utf-8' as const,
    // Windows needs shell: true for commands to work properly
    shell: isWindows() ? 'cmd.exe' : undefined,
    stdio: silent ? ['pipe', 'pipe', 'ignore'] : execOptions.stdio,
    ...execOptions,
  };

  try {
    const result = execSync(command, opts);
    return result.toString().trim();
  } catch (error) {
    if (error instanceof Error && 'stdout' in error) {
      // Return stdout even on error (some commands return non-zero but have useful output)
      const stdout = (error as { stdout?: Buffer }).stdout;
      if (stdout) {
        return stdout.toString().trim();
      }
    }
    throw error;
  }
}

/**
 * Execute a command and return the result without throwing on error
 */
export function execCommandSafe(
  command: string,
  options: ExecCommandOptions = {}
): { success: boolean; output: string; error?: Error } {
  try {
    const output = execCommand(command, options);
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Check if a command is available on the system
 * Uses 'where' on Windows, 'command -v' on Unix
 */
export function isCommandAvailable(command: string): boolean {
  try {
    if (isWindows()) {
      execSync(`where ${command}`, { stdio: 'ignore', shell: 'cmd.exe' });
    } else {
      execSync(`command -v ${command}`, { stdio: 'ignore', shell: '/bin/sh' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the path to a command
 * Returns null if the command is not found
 */
export function getCommandPath(command: string): string | null {
  try {
    if (isWindows()) {
      const result = execSync(`where ${command}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        shell: 'cmd.exe',
      });
      // 'where' can return multiple paths; take the first one
      return result.split('\n')[0].trim() || null;
    } else {
      const result = execSync(`command -v ${command}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        shell: '/bin/sh',
      });
      return result.trim() || null;
    }
  } catch {
    return null;
  }
}

/**
 * Get the default shell for the current platform
 */
export function getDefaultShell(): string {
  if (isWindows()) {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
}

/**
 * Normalize a path for display (convert backslashes to forward slashes)
 */
export function normalizePathForDisplay(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Get spawn options with proper shell configuration
 */
export function getSpawnOptions(options: SpawnSyncOptions = {}): SpawnSyncOptions {
  return {
    shell: isWindows() ? 'cmd.exe' : undefined,
    ...options,
  };
}
