import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('should render the title', () => {
    render(<Home />);
    expect(screen.getByText('Miyabi')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Home />);
    expect(screen.getByText('Autonomous AI Development Platform')).toBeInTheDocument();
  });

  it('should render workflow editor link', () => {
    render(<Home />);
    expect(screen.getByText('Workflow Editor')).toBeInTheDocument();
  });

  it('should have link to workflow create page', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /workflow editor/i });
    expect(link).toHaveAttribute('href', '/dashboard/workflows/create');
  });

  it('should render workflow description', () => {
    render(<Home />);
    expect(screen.getByText('Create and edit workflow DAGs visually')).toBeInTheDocument();
  });
});
