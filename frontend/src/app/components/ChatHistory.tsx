import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  citations?: string[];
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
              {message.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom components for styling that match the app design
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <pre className="bg-blue-50 bg-opacity-60 border border-blue-200 rounded-lg p-3 overflow-x-auto my-3 text-sm">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-blue-50 bg-opacity-60 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-3 bg-blue-50 bg-opacity-30 rounded-r-lg italic text-secondary">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-3 mt-4 text-primary">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mb-2 mt-3 text-primary">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-md font-medium mb-2 mt-2 text-primary">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 ml-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 ml-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-primary leading-relaxed">{children}</li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0 text-primary leading-relaxed">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-primary">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-secondary">{children}</em>
                      ),
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-colors duration-200" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3">
                          <table className="min-w-full border-collapse border border-gray-300 bg-white bg-opacity-50 rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 px-3 py-2 bg-blue-50 bg-opacity-70 font-semibold text-primary text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 px-3 py-2 text-primary">
                          {children}
                        </td>
                      ),
                      hr: () => (
                        <hr className="my-4 border-gray-300 border-opacity-60" />
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              <p className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
              
              {/* Source Citations for Assistant Messages */}
              {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {message.citations.map((citation, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                      {citation}
                    </span>
                  ))}
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