"use client";

import React, { useState, useRef } from 'react';
import { chatRequest, uploadPdfRequest } from '@/utils/api-client';

import UserPanel from './components/UserPanel';
import ChatHistory from './components/ChatHistory';
import ChatInputForm from './components/ChatInputForm';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'word';
  content: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle suggested questions
  React.useEffect(() => {
    const handleSuggestionClick = (event: CustomEvent) => {
      setPrompt(event.detail);
    };

    window.addEventListener('suggestionClick', handleSuggestionClick as EventListener);
    return () => {
      window.removeEventListener('suggestionClick', handleSuggestionClick as EventListener);
    };
  }, []);

  // Helper to handle a File object directly
  const handleFile = async (file: File) => {
    if (
      file.type !== 'text/plain' &&
      file.type !== 'application/pdf' &&
      file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      file.type !== 'application/msword' &&
      file.type !== 'text/markdown'
    ) {
      alert('Please upload only text, markdown, PDF, or Word files');
      return;
    }

    // All supported files go to /api/upload
    try {
      const result = await uploadPdfRequest(file, apiKey); // This function should POST to /api/upload
      if (!result.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      const chunksCreated = result.data?.chunks_created || 0;
      let docType: Document['type'] = 'text';
      if (file.type === 'application/pdf') docType = 'pdf';
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') docType = 'word';
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: docType,
        content: `${file.name} uploaded and indexed (${chunksCreated} chunks)`
      };
      setDocuments(prev => [...prev, newDoc]);
      alert(`Successfully uploaded ${file.name}. Created ${chunksCreated} chunks.`);
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload file: ${errorMessage}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
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

      const result = await chatRequest(
        `You are a helpful assistant. Use the following documents as context to answer questions: ${context}`,
        userMessage.content,
        apiKey
      );

      if (!result.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.data || 'No response received',
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[350px_1fr] gap-0 mobile-stack">
          {/* Sidebar */}
          <div className="order-2 lg:order-1 mobile-order-2">
            <UserPanel
              apiKey={apiKey}
              setApiKey={setApiKey}
              documents={documents}
              selectedDocuments={selectedDocuments}
              setSelectedDocuments={setSelectedDocuments}
              handleFileUpload={handleFileUpload}
              handleFile={handleFile}
              handleNewChat={handleNewChat}
              handleDeleteDocument={handleDeleteDocument}
              fileInputRef={fileInputRef}
              isDragActive={isDragActive}
              setIsDragActive={setIsDragActive}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
            />
          </div>
          
          {/* Main Chat Area */}
          <div className="order-1 lg:order-2 mobile-order-1">
            <div className="glass-card rounded-2xl mr-4 mt-4 flex flex-col mobile-mx-4 mobile-full-height" style={{ height: '700px' }}>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 border-opacity-50 flex justify-between items-center">
                <div className="text-xl font-semibold text-primary">Ask Your Leadership Library</div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleNewChat}
                    className="px-4 py-2 bg-blue-100 bg-opacity-50 text-blue-700 rounded-lg hover:bg-opacity-70 transition-all duration-300 font-medium"
                  >
                    Clear Chat
                  </button>
                  <button className="px-4 py-2 gradient-primary text-white rounded-lg btn-hover font-medium">
                    Export Chat
                  </button>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <ChatHistory messages={messages} isLoading={isLoading} />
              </div>
              
              {/* Chat Input */}
              <div className="p-6 border-t border-gray-200 border-opacity-50">
                <ChatInputForm
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  apiKey={apiKey}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
