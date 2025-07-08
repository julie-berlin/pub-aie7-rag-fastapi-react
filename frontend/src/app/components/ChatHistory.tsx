import React from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading }) => (
  <div className="p-6 h-96 overflow-y-auto custom-scrollbar" role="log" aria-live="polite" aria-label="Chat messages">
    {messages.length === 0 ? (
      <div className="text-center py-12 text-secondary">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-lg font-semibold text-primary mb-2">Welcome to CoachCatalyst!</h3>
        <p className="text-sm mb-6">Ask questions about your leadership documents and get instant insights backed by your personal library.</p>
        
        <div className="space-y-3 max-w-md mx-auto">
          <button 
            className="w-full p-3 bg-blue-50 bg-opacity-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-opacity-70 transition-all duration-300 text-left text-sm"
            onClick={() => {
              const event = new CustomEvent('suggestionClick', { detail: 'What are the key traits of effective leaders?' });
              window.dispatchEvent(event);
            }}
          >
            What are the key traits of effective leaders?
          </button>
          <button 
            className="w-full p-3 bg-blue-50 bg-opacity-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-opacity-70 transition-all duration-300 text-left text-sm"
            onClick={() => {
              const event = new CustomEvent('suggestionClick', { detail: 'How can I improve my team communication?' });
              window.dispatchEvent(event);
            }}
          >
            How can I improve my team communication?
          </button>
          <button 
            className="w-full p-3 bg-blue-50 bg-opacity-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-opacity-70 transition-all duration-300 text-left text-sm"
            onClick={() => {
              const event = new CustomEvent('suggestionClick', { detail: 'What strategies help with conflict resolution?' });
              window.dispatchEvent(event);
            }}
          >
            What strategies help with conflict resolution?
          </button>
        </div>
      </div>
    ) : (
      <div className="space-y-5">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-4xl px-5 py-4 rounded-2xl ${
              message.role === 'user'
                ? 'gradient-primary text-white'
                : 'bg-gray-50 bg-opacity-70 text-primary border border-gray-200'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
              
              {/* Source Citations for Assistant Messages */}
              {message.role === 'assistant' && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    Leadership Fundamentals.pdf
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    Team Building Strategies.doc
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-50 bg-opacity-70 text-primary border border-gray-200 px-5 py-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-secondary">Analyzing your leadership library...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

export default ChatHistory;