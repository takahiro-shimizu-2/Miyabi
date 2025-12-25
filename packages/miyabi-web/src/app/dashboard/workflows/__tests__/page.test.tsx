import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowsListPage from '../page';
import { workflowApi } from '@/lib/api-client';
import type { Workflow } from '@/lib/types';

// Mock the api-client
vi.mock('@/lib/api-client', () => ({
  workflowApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
global.confirm = mockConfirm;
global.alert = mockAlert;

const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    name: 'Test Workflow 1',
    description: 'First test workflow',
    nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: {} }],
    edges: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workflow-2',
    name: 'Test Workflow 2',
    nodes: [],
    edges: [],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('WorkflowsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should show loading state initially', () => {
    vi.mocked(workflowApi.list).mockImplementation(() => new Promise(() => {}));
    render(<WorkflowsListPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue([]);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });
  });

  it('should render create workflow link', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue([]);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('+ Create Workflow')).toBeInTheDocument();
    });
  });

  it('should show empty state when no workflows', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue([]);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('No workflows yet')).toBeInTheDocument();
    });
  });

  it('should show create first workflow link in empty state', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue([]);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Create your first workflow')).toBeInTheDocument();
    });
  });

  it('should display workflows list', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
      expect(screen.getByText('Test Workflow 2')).toBeInTheDocument();
    });
  });

  it('should display workflow description', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('First test workflow')).toBeInTheDocument();
    });
  });

  it('should display node and edge counts', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('1 nodes')).toBeInTheDocument();
      expect(screen.getByText('0 nodes')).toBeInTheDocument();
    });
  });

  it('should display edit links for each workflow', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      const editLinks = screen.getAllByText('Edit');
      expect(editLinks).toHaveLength(2);
    });
  });

  it('should display delete buttons for each workflow', async () => {
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    render(<WorkflowsListPage />);
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  it('should show error message when loading fails', async () => {
    vi.mocked(workflowApi.list).mockRejectedValue(new Error('API Error'));
    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should delete workflow when confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    vi.mocked(workflowApi.delete).mockResolvedValue();
    mockConfirm.mockReturnValue(true);

    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(workflowApi.delete).toHaveBeenCalledWith('workflow-1');
    });
  });

  it('should not delete workflow when cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    mockConfirm.mockReturnValue(false);

    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(workflowApi.delete).not.toHaveBeenCalled();
  });

  it('should show alert when delete fails', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.list).mockResolvedValue(mockWorkflows);
    vi.mocked(workflowApi.delete).mockRejectedValue(new Error('Delete failed'));
    mockConfirm.mockReturnValue(true);

    render(<WorkflowsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Delete failed');
    });
  });
});
