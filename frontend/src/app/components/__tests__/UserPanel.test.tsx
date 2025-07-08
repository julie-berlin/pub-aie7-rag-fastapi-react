import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserPanel from '../UserPanel';

describe('UserPanel', () => {
  const defaultProps = {
    apiKey: '',
    setApiKey: vi.fn(),
    documents: [
      { id: '1', name: 'Doc1.txt', type: 'text' as 'text', content: 'Content' },
      { id: '2', name: 'Doc2.pdf', type: 'pdf' as 'pdf', content: 'Content' },
    ],
    selectedDocuments: [],
    setSelectedDocuments: vi.fn(),
    handleFileUpload: vi.fn(),
    handleFile: vi.fn(),
    handleNewChat: vi.fn(),
    handleDeleteDocument: vi.fn(),
    fileInputRef: { current: null },
    isDragActive: false,
    setIsDragActive: vi.fn(),
    handleDrop: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
  };

  it('renders API key input', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByLabelText(/openai api key/i)).toBeInTheDocument();
  });

  it('renders upload area', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByLabelText(/drag and drop a file here/i)).toBeInTheDocument();
  });

  it('renders document list', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByText('Doc1.txt')).toBeInTheDocument();
    expect(screen.getByText('Doc2.pdf')).toBeInTheDocument();
  });

  it('renders new chat button', () => {
    render(<UserPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
  });
});