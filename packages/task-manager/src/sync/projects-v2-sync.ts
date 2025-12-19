/**
 * GitHub Projects V2 Sync
 * Synchronizes task state with GitHub Projects V2 custom fields
 */

import { graphql } from '@octokit/graphql';
import type {
  ManagedTask,
  TaskState,
  SyncResult,
  SyncItemResult,
  SyncConflict,
  SyncHandler,
  ProjectItemInfo,
  SyncConfig,
} from '../types/index.js';

/**
 * GraphQL client type
 */
type GraphQLClient = typeof graphql;

/**
 * Project field info
 */
interface ProjectField {
  id: string;
  name: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'ITERATION';
  options?: { id: string; name: string }[];
}

/**
 * Projects V2 Sync class
 */
export class ProjectsV2Sync {
  private graphqlClient: GraphQLClient;
  private owner: string;
  private repo: string;
  private projectNumber?: number;
  private handler?: SyncHandler;
  private projectId?: string;
  private fieldsCache: Map<string, ProjectField> = new Map();

  constructor(config: SyncConfig, handler?: SyncHandler) {
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${config.github.token}`,
      },
    });
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.projectNumber = config.github.projectNumber;
    this.handler = handler;
  }

  /**
   * Initialize project connection
   */
  async initialize(): Promise<void> {
    if (!this.projectNumber) {
      throw new Error('Project number is required for Projects V2 sync');
    }

    // Get project ID
    const result = await this.graphqlClient<{
      organization?: { projectV2: { id: string } };
      user?: { projectV2: { id: string } };
    }>(`
      query($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
          }
        }
        user(login: $owner) {
          projectV2(number: $number) {
            id
          }
        }
      }
    `, {
      owner: this.owner,
      number: this.projectNumber,
    });

    this.projectId = result.organization?.projectV2?.id || result.user?.projectV2?.id;

    if (!this.projectId) {
      throw new Error(`Project #${this.projectNumber} not found`);
    }

    // Cache project fields
    await this.cacheProjectFields();
  }

  /**
   * Cache project fields
   */
  private async cacheProjectFields(): Promise<void> {
    if (!this.projectId) return;

    const result = await this.graphqlClient<{
      node: {
        fields: {
          nodes: Array<{
            id: string;
            name: string;
            dataType: string;
            options?: { id: string; name: string }[];
          }>;
        };
      };
    }>(`
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 50) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `, {
      projectId: this.projectId,
    });

    this.fieldsCache.clear();
    for (const field of result.node.fields.nodes) {
      this.fieldsCache.set(field.name, {
        id: field.id,
        name: field.name,
        dataType: field.dataType as ProjectField['dataType'],
        options: field.options,
      });
    }
  }

  /**
   * Get project item for an issue
   */
  async getProjectItem(issueNumber: number): Promise<ProjectItemInfo | null> {
    if (!this.projectId) {
      await this.initialize();
    }

    const result = await this.graphqlClient<{
      repository: {
        issue: {
          projectItems: {
            nodes: Array<{
              id: string;
              fieldValues: {
                nodes: Array<{
                  field?: { name: string };
                  text?: string;
                  number?: number;
                  name?: string;
                }>;
              };
            }>;
          };
        };
      };
    }>(`
      query($owner: String!, $repo: String!, $issueNumber: Int!, $projectId: ID!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            projectItems(first: 10) {
              nodes {
                id
                project {
                  id
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      field { name }
                      text
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      field { name }
                      number
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field { name }
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, {
      owner: this.owner,
      repo: this.repo,
      issueNumber,
      projectId: this.projectId,
    });

    const items = result.repository.issue.projectItems.nodes;
    const projectItem = items.find(() => true); // Get first item in project

    if (!projectItem) {
      return null;
    }

    const fieldValues: Record<string, string | number | null> = {};
    for (const fv of projectItem.fieldValues.nodes) {
      if (fv.field?.name) {
        fieldValues[fv.field.name] = fv.text ?? fv.number ?? fv.name ?? null;
      }
    }

    return {
      id: projectItem.id,
      contentId: `issue-${issueNumber}`,
      fieldValues,
    };
  }

  /**
   * Add issue to project
   */
  async addIssueToProject(issueNumber: number): Promise<string> {
    if (!this.projectId) {
      await this.initialize();
    }

    // Get issue node ID
    const issueResult = await this.graphqlClient<{
      repository: { issue: { id: string } };
    }>(`
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            id
          }
        }
      }
    `, {
      owner: this.owner,
      repo: this.repo,
      issueNumber,
    });

    const issueId = issueResult.repository.issue.id;

    // Add to project
    const result = await this.graphqlClient<{
      addProjectV2ItemById: { item: { id: string } };
    }>(`
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
          item {
            id
          }
        }
      }
    `, {
      projectId: this.projectId,
      contentId: issueId,
    });

    return result.addProjectV2ItemById.item.id;
  }

  /**
   * Update a field value on a project item
   */
  async updateFieldValue(
    itemId: string,
    fieldName: string,
    value: string | number
  ): Promise<boolean> {
    if (!this.projectId) {
      await this.initialize();
    }

    const field = this.fieldsCache.get(fieldName);
    if (!field) {
      throw new Error(`Field "${fieldName}" not found in project`);
    }

    let updateValue: { text?: string; number?: number; singleSelectOptionId?: string };

    if (field.dataType === 'TEXT') {
      updateValue = { text: String(value) };
    } else if (field.dataType === 'NUMBER') {
      updateValue = { number: Number(value) };
    } else if (field.dataType === 'SINGLE_SELECT') {
      const option = field.options?.find(o => o.name === value);
      if (!option) {
        throw new Error(`Option "${value}" not found for field "${fieldName}"`);
      }
      updateValue = { singleSelectOptionId: option.id };
    } else {
      throw new Error(`Unsupported field type: ${field.dataType}`);
    }

    await this.graphqlClient(`
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: $value
        }) {
          projectV2Item {
            id
          }
        }
      }
    `, {
      projectId: this.projectId,
      itemId,
      fieldId: field.id,
      value: updateValue,
    });

    return true;
  }

  /**
   * Push task state to Projects V2
   */
  async pushState(task: ManagedTask, statusFieldName = 'Status'): Promise<SyncItemResult> {
    if (!task.githubIssueNumber) {
      return {
        taskId: task.id,
        success: false,
        operation: 'skip',
        error: 'Task has no associated GitHub issue',
      };
    }

    try {
      // Get or create project item
      let projectItem = await this.getProjectItem(task.githubIssueNumber);

      if (!projectItem) {
        const itemId = await this.addIssueToProject(task.githubIssueNumber);
        projectItem = {
          id: itemId,
          contentId: `issue-${task.githubIssueNumber}`,
          fieldValues: {},
        };
      }

      // Check for conflict
      const currentStatus = projectItem.fieldValues[statusFieldName];
      if (currentStatus && currentStatus !== task.currentState) {
        const conflict: SyncConflict = {
          taskId: task.id,
          field: 'status',
          localValue: task.currentState,
          githubValue: currentStatus,
        };

        if (this.handler?.onConflict) {
          const resolution = await this.handler.onConflict(conflict);
          if (resolution === 'github' || resolution === 'skip') {
            return {
              taskId: task.id,
              success: true,
              operation: 'skip',
              issueNumber: task.githubIssueNumber,
              projectItemId: projectItem.id,
            };
          }
        }
      }

      // Update status field
      await this.updateFieldValue(projectItem.id, statusFieldName, this.stateToStatus(task.currentState));

      return {
        taskId: task.id,
        success: true,
        operation: task.projectItemId ? 'update' : 'create',
        issueNumber: task.githubIssueNumber,
        projectItemId: projectItem.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handler?.onError?.(error instanceof Error ? error : new Error(errorMessage), task.id);
      return {
        taskId: task.id,
        success: false,
        operation: 'update',
        error: errorMessage,
      };
    }
  }

  /**
   * Pull state from Projects V2
   */
  async pullState(
    issueNumber: number,
    statusFieldName = 'Status'
  ): Promise<{ state: TaskState | null; fieldValues: Record<string, string | number | null> }> {
    const projectItem = await this.getProjectItem(issueNumber);

    if (!projectItem) {
      return { state: null, fieldValues: {} };
    }

    const statusValue = projectItem.fieldValues[statusFieldName];
    const state = statusValue ? this.statusToState(String(statusValue)) : null;

    return { state, fieldValues: projectItem.fieldValues };
  }

  /**
   * Sync multiple tasks
   */
  async syncTasks(tasks: ManagedTask[], direction: 'push' | 'pull'): Promise<SyncResult> {
    const startTime = Date.now();
    this.handler?.onSyncStart?.(direction);

    const items: SyncItemResult[] = [];
    const conflicts: SyncConflict[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    for (const task of tasks) {
      if (direction === 'push') {
        const result = await this.pushState(task);
        items.push(result);

        if (result.success) {
          if (result.operation === 'skip') {
            skipped++;
          } else {
            synced++;
          }
        } else {
          failed++;
        }
      } else {
        // Pull
        if (!task.githubIssueNumber) {
          items.push({
            taskId: task.id,
            success: false,
            operation: 'skip',
            error: 'No GitHub issue number',
          });
          skipped++;
          continue;
        }

        try {
          const { state } = await this.pullState(task.githubIssueNumber);
          if (state && state !== task.currentState) {
            conflicts.push({
              taskId: task.id,
              field: 'status',
              localValue: task.currentState,
              githubValue: state,
            });
          }
          items.push({
            taskId: task.id,
            success: true,
            operation: 'update',
            issueNumber: task.githubIssueNumber,
          });
          synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          items.push({
            taskId: task.id,
            success: false,
            operation: 'update',
            error: errorMessage,
          });
          failed++;
        }
      }
    }

    const result: SyncResult = {
      success: failed === 0,
      direction,
      synced,
      failed,
      skipped,
      items,
      conflicts,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    this.handler?.onSyncComplete?.(result);
    return result;
  }

  /**
   * Convert TaskState to Project Status display name
   */
  private stateToStatus(state: TaskState): string {
    const mapping: Record<TaskState, string> = {
      draft: 'Draft',
      pending: 'Todo',
      analyzing: 'Analyzing',
      implementing: 'In Progress',
      reviewing: 'In Review',
      deploying: 'Deploying',
      done: 'Done',
      blocked: 'Blocked',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return mapping[state] || state;
  }

  /**
   * Convert Project Status display name to TaskState
   */
  private statusToState(status: string): TaskState | null {
    const mapping: Record<string, TaskState> = {
      'Draft': 'draft',
      'Todo': 'pending',
      'Backlog': 'pending',
      'Analyzing': 'analyzing',
      'In Progress': 'implementing',
      'In Review': 'reviewing',
      'Deploying': 'deploying',
      'Done': 'done',
      'Blocked': 'blocked',
      'Failed': 'failed',
      'Cancelled': 'cancelled',
    };
    return mapping[status] || null;
  }

  /**
   * Get project fields
   */
  getFields(): Map<string, ProjectField> {
    return new Map(this.fieldsCache);
  }

  /**
   * Get project ID
   */
  getProjectId(): string | undefined {
    return this.projectId;
  }
}
