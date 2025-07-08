import React from 'react';

interface ChatInputFormProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  apiKey: string;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({ prompt, setPrompt, onSubmit, isLoading, apiKey }) => (
  <form data-testid="chat-form" onSubmit={onSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Ask a question
    </label>
    <div className="flex space-x-4">
      <input
        id="prompt"
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="Enter your question here..."
        disabled={isLoading}
        aria-label="Question input"
      />
      <button
        type="submit"
        disabled={isLoading || !prompt.trim() || !apiKey.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Send question"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </form>
);

export default ChatInputForm;