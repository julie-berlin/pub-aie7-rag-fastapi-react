import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import ChatHistory from '../ChatHistory';

describe('ChatHistory', () => {
  it('renders empty state', () => {
    render(<ChatHistory messages={[]} isLoading={false} />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it('renders messages', () => {
    const messages = [
      { id: '1', content: 'Hello', role: 'user', timestamp: new Date() },
      { id: '2', content: 'Hi there!', role: 'assistant', timestamp: new Date() },
    ] as const;
    render(<ChatHistory messages={[...messages]} isLoading={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const messages = [
      { id: '1', content: 'Hello', role: 'user', timestamp: new Date() },
    ] as const;
    render(<ChatHistory messages={[...messages]} isLoading={true} />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });
});