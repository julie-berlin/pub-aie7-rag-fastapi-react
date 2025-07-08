import React from 'react';

interface ChatInputFormProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  apiKey: string;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({ prompt, setPrompt, onSubmit, isLoading, apiKey }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const syntheticEvent = {
        ...e,
        type: 'submit',
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        currentTarget: e.currentTarget.form!,
        target: e.currentTarget.form!,
      } as React.FormEvent<HTMLFormElement>;
      onSubmit(syntheticEvent);
    }
  };

  return (
    <form data-testid="chat-form" onSubmit={onSubmit} className="">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[50px] max-h-[120px] px-4 py-3 border-2 border-blue-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-50 text-primary placeholder-gray-400 resize-none transition-all duration-300"
            placeholder="Ask about leadership strategies, team management, or any topic from your documents..."
            disabled={isLoading}
            aria-label="Question input"
            rows={1}
            style={{ 
              height: 'auto',
              minHeight: '50px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || !apiKey.trim()}
          className="w-12 h-12 gradient-primary text-white rounded-xl btn-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          aria-label="Send question"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            '➤'
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInputForm;