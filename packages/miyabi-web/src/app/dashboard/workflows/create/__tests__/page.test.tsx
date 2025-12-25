import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReactFlow } from '@/test/test-utils';
import WorkflowCreatePage from '../page';
import { workflowApi } from '@/lib/api-client';

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
    create: vi.fn(),
  },
}));

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('WorkflowCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render workflow name input', () => {
    renderWithReactFlow(<WorkflowCreatePage />);
    const input = screen.getByDisplayValue('New Workflow');
    expect(input).toBeInTheDocument();
  });

  it('should render back link', () => {
    renderWithReactFlow(<WorkflowCreatePage />);
    const links = screen.getAllByRole('link');
    const backLink = links.find((link) => link.getAttribute('href') === '/dashboard/workflows');
    expect(backLink).toBeInTheDocument();
  });

  it('should render Add Node button', () => {
    renderWithReactFlow(<WorkflowCreatePage />);
    expect(screen.getByText('+ Add Node')).toBeInTheDocument();
  });

  it('should render Clear button', () => {
    renderWithReactFlow(<WorkflowCreatePage />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('should render Save button', () => {
    renderWithReactFlow(<WorkflowCreatePage />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should show add panel when clicking Add Node', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));

    expect(screen.getByText('Agent Nodes')).toBeInTheDocument();
    expect(screen.getByText('Issue Node')).toBeInTheDocument();
    expect(screen.getByText('Condition Node')).toBeInTheDocument();
  });

  it('should show agent type buttons in add panel', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));

    expect(screen.getByText('coordinator')).toBeInTheDocument();
    expect(screen.getByText('codegen')).toBeInTheDocument();
    expect(screen.getByText('review')).toBeInTheDocument();
  });

  it('should allow changing workflow name', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    const input = screen.getByDisplayValue('New Workflow');
    await user.clear(input);
    await user.type(input, 'My Custom Workflow');

    expect(screen.getByDisplayValue('My Custom Workflow')).toBeInTheDocument();
  });

  it('should save workflow and redirect on success', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.create).mockResolvedValue({
      id: 'new-workflow-id',
      name: 'New Workflow',
      nodes: [],
      edges: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(workflowApi.create).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/workflows/new-workflow-id');
    });
  });

  it('should show alert when save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.create).mockRejectedValue(new Error('Save failed'));

    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Save failed');
    });
  });

  it('should show Saving... when saving', async () => {
    const user = userEvent.setup();
    vi.mocked(workflowApi.create).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('Save'));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should close add panel after adding agent', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));
    expect(screen.getByText('Agent Nodes')).toBeInTheDocument();

    await user.click(screen.getByText('coordinator'));

    await waitFor(() => {
      expect(screen.queryByText('Agent Nodes')).not.toBeInTheDocument();
    });
  });

  it('should add condition node', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));
    await user.click(screen.getByText('Add Condition'));

    await waitFor(() => {
      expect(screen.queryByText('Agent Nodes')).not.toBeInTheDocument();
    });
  });

  it('should have issue number input', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));

    const issueInput = screen.getByPlaceholderText('Issue #');
    expect(issueInput).toBeInTheDocument();
  });

  it('should add issue node with valid number', async () => {
    const user = userEvent.setup();
    renderWithReactFlow(<WorkflowCreatePage />);

    await user.click(screen.getByText('+ Add Node'));

    const issueInput = screen.getByPlaceholderText('Issue #');
    await user.type(issueInput, '123');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.queryByText('Agent Nodes')).not.toBeInTheDocument();
    });
  });
});
