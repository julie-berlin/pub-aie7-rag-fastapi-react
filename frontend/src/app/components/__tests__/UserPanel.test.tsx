import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserPanel from '../UserPanel';

describe('UserPanel', () => {
  const defaultProps = {
    onApiKeyChange: vi.fn(),
    onDocumentsChange: vi.fn(),
    onNotification: vi.fn(),
  };

  it('renders API key input', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByLabelText(/openai api key/i)).toBeInTheDocument();
  });

  it('renders upload area', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByLabelText(/drag and drop a file here/i)).toBeInTheDocument();
  });

  it('renders empty document state', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
  });

  it('renders clear documents button', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /clear all documents/i })).toBeInTheDocument();
  });
});