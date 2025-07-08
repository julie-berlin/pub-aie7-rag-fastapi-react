import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatInputForm from '../ChatInputForm';

describe('ChatInputForm', () => {
  const defaultProps = {
    prompt: '',
    setPrompt: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    apiKey: 'key',
  };

  it('renders input and button', () => {
    render(<ChatInputForm {...defaultProps} />);
    expect(screen.getByLabelText(/question input/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(<ChatInputForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('disables button when prompt or apiKey is empty', () => {
    render(<ChatInputForm {...defaultProps} prompt="" apiKey="" />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('calls onSubmit when form is submitted', () => {
    render(<ChatInputForm {...defaultProps} prompt="Hello" />);
    fireEvent.submit(screen.getByTestId('chat-form'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });
});