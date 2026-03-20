/**
 * GitHubClient - Agent SDK 用 GitHub API ラッパー
 *
 * Octokit を使用した GitHub API 統合。
 * IssueAgent, CodeGenAgent, PRAgent で共通使用。
 */
import { Octokit } from "@octokit/rest";

export interface GitHubIssueData {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
}

export interface PullRequestInfo {
  number: number;
  html_url: string;
  state: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    const authToken = token || process.env.GITHUB_TOKEN;
    if (!authToken) {
      throw new Error(
        "GITHUB_TOKEN is required. Set it as environment variable or pass to constructor."
      );
    }
    this.octokit = new Octokit({ auth: authToken });
  }

  /**
   * GitHub Issue を取得
   */
  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<GitHubIssueData> {
    const { data } = await this.octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return {
      number: data.number,
      title: data.title,
      body: data.body || null,
      state: data.state,
      labels: data.labels.map((l) =>
        typeof l === "string" ? { name: l } : { name: l.name || "" }
      ),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Issue にラベルを付与
   */
  async addLabels(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
  ): Promise<void> {
    await this.octokit.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels,
    });
  }

  /**
   * リポジトリからファイル内容を取得
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref = "main"
  ): Promise<GitHubFile | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      if (Array.isArray(data) || data.type !== "file") {
        return null;
      }
      const content = Buffer.from(
        (data as { content: string }).content,
        "base64"
      ).toString("utf-8");
      return {
        path: data.path,
        content,
        sha: data.sha,
      };
    } catch {
      return null;
    }
  }

  /**
   * ブランチを作成
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch = "main"
  ): Promise<void> {
    const { data: baseRef } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha,
    });
  }

  /**
   * Git Tree API を使ってファイルをコミット
   */
  async commitFiles(params: {
    owner: string;
    repo: string;
    branch: string;
    files: Array<{ path: string; content: string }>;
    message: string;
  }): Promise<string> {
    // 1. 現在のコミットSHA取得
    const { data: ref } = await this.octokit.git.getRef({
      owner: params.owner,
      repo: params.repo,
      ref: `heads/${params.branch}`,
    });
    const currentCommitSha = ref.object.sha;

    // 2. 現在のコミットのツリーを取得
    const { data: currentCommit } = await this.octokit.git.getCommit({
      owner: params.owner,
      repo: params.repo,
      commit_sha: currentCommitSha,
    });

    // 3. 各ファイルのblob作成
    const blobs = await Promise.all(
      params.files.map((file) =>
        this.octokit.git.createBlob({
          owner: params.owner,
          repo: params.repo,
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        })
      )
    );

    // 4. ツリー作成
    const { data: tree } = await this.octokit.git.createTree({
      owner: params.owner,
      repo: params.repo,
      tree: params.files.map((file, i) => ({
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobs[i].data.sha,
      })),
      base_tree: currentCommit.tree.sha,
    });

    // 5. コミット作成
    const { data: commit } = await this.octokit.git.createCommit({
      owner: params.owner,
      repo: params.repo,
      message: params.message,
      tree: tree.sha,
      parents: [currentCommitSha],
    });

    // 6. ref更新
    await this.octokit.git.updateRef({
      owner: params.owner,
      repo: params.repo,
      ref: `heads/${params.branch}`,
      sha: commit.sha,
    });

    return commit.sha;
  }

  /**
   * Pull Request 作成
   */
  async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<PullRequestInfo> {
    const { data } = await this.octokit.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base,
      draft: params.draft !== false,
    });
    return {
      number: data.number,
      html_url: data.html_url,
      state: data.state,
    };
  }

  /**
   * Issue/PR にコメント追加
   */
  async addComment(
    owner: string,
    repo: string,
    issueNumber: number,
    comment: string
  ): Promise<void> {
    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: comment,
    });
  }

  /**
   * Rate Limit 確認
   */
  async checkRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  }> {
    const { data } = await this.octokit.rateLimit.get();
    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      reset: new Date(data.rate.reset * 1000),
    };
  }
}
