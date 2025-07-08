"use client";

import React, { useState, useRef } from 'react';
import { chatRequest, uploadFileRequest } from '@/utils/api-client';

import UserPanel from './components/UserPanel';
import ChatHistory from './components/ChatHistory';
import ChatInputForm from './components/ChatInputForm';
import Notification from './components/Notification';


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
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

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
      showNotification('Please upload only text, markdown, PDF, or Word files', 'error');
      return;
    }

    // All supported files go to /api/upload
    try {
      const result = await uploadFileRequest(file, apiKey); // This function should POST to /api/upload
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
      showNotification(`Successfully uploaded ${file.name}. Created ${chunksCreated} chunks.`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Failed to upload file: ${errorMessage}`, 'error');
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
      const result = await chatRequest(
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
      showNotification('Failed to get response. Please check your API key and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    showNotification('Chat cleared successfully', 'success');
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      showNotification('No messages to export', 'info');
      return;
    }

    const chatData = {
      exported_at: new Date().toISOString(),
      application: 'CoachCatalyst',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))
    };

    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `coachcatalyst-chat-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Chat exported successfully', 'success');
  };

  const handleClearDocuments = () => {
    if (documents.length === 0) {
      showNotification('No documents to clear', 'info');
      return;
    }
    
    setDocuments([]);
    setSelectedDocuments([]);
    showNotification(`Cleared ${documents.length} documents`, 'success');
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    setSelectedDocuments(prev => prev.filter(id => id !== docId));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[350px_1fr] gap-6 mobile-stack lg:h-[700px]">
          {/* Sidebar */}
          <div className="order-2 lg:order-1 mobile-order-2 lg:h-full">
            <UserPanel
              apiKey={apiKey}
              setApiKey={setApiKey}
              documents={documents}
              selectedDocuments={selectedDocuments}
              setSelectedDocuments={setSelectedDocuments}
              handleFileUpload={handleFileUpload}
              handleFile={handleFile}
              handleClearDocuments={handleClearDocuments}
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
          <div className="order-1 lg:order-2 mobile-order-1 lg:h-full">
            <div className="glass-card rounded-2xl mt-4 flex flex-col mobile-mx-4 mobile-full-height lg:h-full" style={{ height: '700px' }}>
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
                  <button 
                    onClick={handleExportChat}
                    className="px-4 py-2 gradient-primary text-white rounded-lg btn-hover font-medium"
                  >
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
      
      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
