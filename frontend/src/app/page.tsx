"use client";

import { useState, useRef } from 'react';
import { chatRequest, uploadPdfRequest } from '@/utils/api-client';
import Header from './components/Header';
import Footer from './components/Footer';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
              </div>
              <ChatHistory messages={messages} isLoading={isLoading} />
            </div>
            <ChatInputForm
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              apiKey={apiKey}
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
