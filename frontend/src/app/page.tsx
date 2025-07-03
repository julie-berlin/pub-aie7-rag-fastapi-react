"use client";

import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf';
  content: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
      alert('Please upload only text or PDF files');
      return;
    }

    if (file.type === 'application/pdf') {
      // Handle PDF upload via backend
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload PDF');
        }

        const result = await response.json();
        alert(`Successfully uploaded ${file.name}. Created ${result.chunks_created} chunks.`);
        
        // Add to documents list for display only
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          type: 'pdf',
          content: `PDF uploaded and indexed (${result.chunks_created} chunks)`
        };
        setDocuments(prev => [...prev, newDoc]);
      } catch (error) {
        console.error('Error uploading PDF:', error);
        alert('Failed to upload PDF. Please try again.');
      }
    } else {
      // Handle text file
      const content = await file.text();
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: 'text',
        content
      };
      setDocuments(prev => [...prev, newDoc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !apiKey.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: prompt,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
      const context = selectedDocs.map(doc => `Document: ${doc.name}\n${doc.content}`).join('\n\n');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: `You are a helpful assistant. Use the following documents as context to answer questions: ${context}`,
          user_message: userMessage.content,
          api_key: apiKey
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: await response.text(),
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get response. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    setSelectedDocuments(prev => prev.filter(id => id !== docId));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white py-6">
            inform.me
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your OpenAI API key"
                aria-label="OpenAI API Key"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Document
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                aria-label="Upload text or PDF file"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documents ({documents.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <label className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments(prev => [...prev, doc.id]);
                          } else {
                            setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${doc.name}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.name}</span>
                    </label>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                      aria-label={`Delete ${doc.name}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
                )}
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label="Start new chat"
            >
              New Chat
            </button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
              </div>
              <div className="p-6 h-96 overflow-y-auto" role="log" aria-live="polite" aria-label="Chat messages">
                {messages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center">Start a conversation by asking a question below</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl px-4 py-2 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-300">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
          </div>
        </div>
      </main>
    </div>
  );
}
