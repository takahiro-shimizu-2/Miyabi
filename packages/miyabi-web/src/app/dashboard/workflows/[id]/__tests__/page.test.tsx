import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReactFlow } from '@/test/test-utils';
import WorkflowEditPage from '../page';
import { workflowApi } from '@/lib/api-client';
import type { Workflow } from '@/lib/types';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the api-client
vi.mock('@/lib/api-client', () => ({
  workflowApi: {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
global.confirm = mockConfirm;
global.alert = mockAlert;

const mockWorkflow: Workflow = {
  id: 'test-workflow-id',
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [
    { id: 'node_0', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Agent', agentType: 'coordinator' } },
  ],
  edges: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('WorkflowEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should show loading state initially', () => {
    vi.mocked(workflowApi.get).mockImplementation(() => new Promise(() => {}));
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);
    expect(screen.getByText('Loading workflow...')).toBeInTheDocument();
  });

  it('should show error state when workflow not found', async () => {
    vi.mocked(workflowApi.get).mockRejectedValue(new Error('Workflow not found'));
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Workflow not found')).toBeInTheDocument();
    });
  });

  it('should show back link in error state', async () => {
    vi.mocked(workflowApi.get).mockRejectedValue(new Error('Error'));
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Back to workflows')).toBeInTheDocument();
    });
  });

  it('should render workflow name after loading', async () => {
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument();
    });
  });

  it('should render Save button', async () => {
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('should render Delete button', async () => {
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('should render Clear button', async () => {
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('should render Add Node button', async () => {
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Node')).toBeInTheDocument();
    });
  });

  it('should save workflow on Save click', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowApi.update).mockResolvedValue(mockWorkflow);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(workflowApi.update).toHaveBeenCalledWith('test-id', expect.any(Object));
    });
  });

  it('should show alert when save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowApi.update).mockRejectedValue(new Error('Save failed'));

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Save failed');
    });
  });

  it('should delete workflow and redirect', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowApi.delete).mockResolvedValue();
    mockConfirm.mockReturnValue(true);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(workflowApi.delete).toHaveBeenCalledWith('test-id');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/workflows');
    });
  });

  it('should not delete when cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    mockConfirm.mockReturnValue(false);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    expect(workflowApi.delete).not.toHaveBeenCalled();
  });

  it('should show alert when delete fails', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowApi.delete).mockRejectedValue(new Error('Delete failed'));
    mockConfirm.mockReturnValue(true);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Delete failed');
    });
  });

  it('should show add panel when clicking Add Node', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Node')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Node'));

    expect(screen.getByText('Agent Nodes')).toBeInTheDocument();
  });

  it('should allow editing workflow name', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.get).mockResolvedValue(mockWorkflow);

    renderWithReactFlow(<WorkflowEditPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('Test Workflow');
    await user.clear(input);
    await user.type(input, 'Updated Workflow');

    expect(screen.getByDisplayValue('Updated Workflow')).toBeInTheDocument();
  });
});
