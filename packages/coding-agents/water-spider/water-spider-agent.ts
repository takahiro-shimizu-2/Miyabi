/**
 * WaterSpiderAgent - Auto-Continue Controller (Water Spider Pattern)
 *
 * トヨタ生産方式の「Water Spider (資材補充係)」を応用:
 * - ラインが止まらないように常に資材を補充
 * - 各工程の状態を監視
 * - 必要な時に必要なものを届ける (Just-In-Time)
 *
 * Miyabi適用:
 * - セッションが止まらないように常に継続信号を送る
 * - 各Worktreeセッションの状態を監視
 * - 必要な時に「continue」信号を送る (Auto-Continue)
 *
 * Ref: OpenAI Dev Day - Autonomous Development Patterns
 */

import { BaseAgent } from '../base-agent';
import type { AgentConfig, AgentResult, Task } from '../types/index';
import { SessionManager } from './session-manager';
import { WebhookClient } from './webhook-client';

export interface WaterSpiderConfig extends AgentConfig {
  monitorInterval?: number; // 監視間隔 (ms) default: 5000
  maxIdleTime?: number; // 最大アイドル時間 (ms) default: 30000
  autoRestart?: boolean; // 自動再起動 default: true
  webhookUrl?: string; // Webhook URL default: http://localhost:3002
}

export interface SessionStatus {
  sessionId: string;
  worktreePath: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  lastActivity: number;
  idleTime: number;
  needsContinue: boolean;
}

export class WaterSpiderAgent extends BaseAgent {
  private sessionManager: SessionManager;
  private webhookClient: WebhookClient;
  private monitorInterval: number;
  private maxIdleTime: number;
  private autoRestart: boolean;
  private isRunning: boolean = false;
  private monitorTimer?: NodeJS.Timeout;

  constructor(config: WaterSpiderConfig) {
    super('WaterSpiderAgent', config);
    this.monitorInterval = config.monitorInterval || 5000;
    this.maxIdleTime = config.maxIdleTime || 30000;
    this.autoRestart = config.autoRestart ?? true;

    this.sessionManager = new SessionManager(config);
    this.webhookClient = new WebhookClient(
      config.webhookUrl || 'http://localhost:3002'
    );
  }

  /**
   * Main execution: Start Water Spider monitoring
   */
  async execute(_task: Task): Promise<AgentResult> {
    this.log('🕷️  WaterSpiderAgent starting (Water Spider Pattern)');
    this.log(`   Monitor Interval: ${this.monitorInterval}ms`);
    this.log(`   Max Idle Time: ${this.maxIdleTime}ms`);
    this.log(`   Auto Restart: ${this.autoRestart}`);

    try {
      // 1. Initialize sessions from worktrees
      this.initializeSessions();

      // 2. Start monitoring loop
      await this.startMonitoring();

      return {
        status: 'success',
        data: {
          message: 'Water Spider monitoring started',
          sessions: this.sessionManager.getSessions(),
        },
      };
    } catch (error) {
      this.log(`❌ WaterSpiderAgent failed: ${(error as Error).message}`);
      return {
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Initialize sessions from existing worktrees
   */
  private initializeSessions(): void {
    this.log('📋 Initializing sessions from worktrees');
    this.sessionManager.discoverWorktrees();
    const sessions = this.sessionManager.getSessions();
    this.log(`   Found ${sessions.length} worktree sessions`);
    sessions.forEach((s) => {
      this.log(`   - ${s.sessionId}: ${s.worktreePath}`);
    });
  }

  /**
   * Start monitoring loop (Water Spider pattern)
   */
  private async startMonitoring(): Promise<void> {
    this.log('🔄 Starting monitoring loop (Just-In-Time Auto-Continue)');
    this.isRunning = true;

    const monitor = async () => {
      if (!this.isRunning) {return;}

      try {
        // Check all sessions
        const sessions = this.sessionManager.checkAllSessions();

        for (const session of sessions) {
          if (session.needsContinue) {
            this.log(
              `🚨 Session ${session.sessionId} needs continue (idle: ${session.idleTime}ms)`
            );
            await this.sendContinue(session);
          }
        }

        // Post status to webhook
        await this.webhookClient.postStatus(sessions);
      } catch (error) {
        this.log(`⚠️  Monitor error: ${(error as Error).message}`);
      }

      // Schedule next check
      this.monitorTimer = setTimeout(() => { void monitor(); }, this.monitorInterval);
    };

    // Start monitoring
    await monitor();
  }

  /**
   * Send continue signal to session
   */
  private async sendContinue(session: SessionStatus): Promise<void> {
    this.log(`📤 Sending continue signal to ${session.sessionId}`);

    try {
      // Send continue via session manager
      this.sessionManager.sendContinue(session.sessionId);

      // Notify webhook
      await this.webhookClient.notifyContinue(session.sessionId);

      this.log(`✅ Continue signal sent to ${session.sessionId}`);
    } catch (error) {
      this.log(`❌ Failed to send continue: ${(error as Error).message}`);

      if (this.autoRestart) {
        this.log(`🔄 Attempting auto-restart for ${session.sessionId}`);
        this.sessionManager.restartSession(session.sessionId);
      }
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.log('🛑 Stopping Water Spider monitoring');
    this.isRunning = false;

    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer);
      this.monitorTimer = undefined;
    }

    this.sessionManager.cleanup();
    this.log('✅ Water Spider stopped');
  }

  /**
   * Get current session statuses
   */
  getSessionStatuses(): SessionStatus[] {
    return this.sessionManager.getSessions();
  }

  /**
   * Manually trigger continue for specific session
   */
  async triggerContinue(sessionId: string): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.sendContinue(session);
  }
}
