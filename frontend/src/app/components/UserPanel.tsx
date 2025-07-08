import React, { useState, useRef } from 'react';
import { uploadFileRequest } from '@/utils/api-client';

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'word';
  content: string;
}

interface UserPanelProps {
  onApiKeyChange: (apiKey: string) => void;
  onDocumentsChange: (documents: Document[], selectedDocuments: string[]) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  onApiKeyChange,
  onDocumentsChange,
  onNotification
}) => {
  // Internal state
  const [apiKey, setApiKey] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of changes
  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  const handleDocumentsChange = (newDocuments: Document[], newSelectedDocuments: string[]) => {
    setDocuments(newDocuments);
    setSelectedDocuments(newSelectedDocuments);
    onDocumentsChange(newDocuments, newSelectedDocuments);
  };

  const handleSelectedDocumentsChange = (newSelectedDocuments: string[]) => {
    setSelectedDocuments(newSelectedDocuments);
    onDocumentsChange(documents, newSelectedDocuments);
  };

  // File handling
  const handleFile = async (file: File) => {
    if (
      file.type !== 'text/plain' &&
      file.type !== 'application/pdf' &&
      file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      file.type !== 'application/msword' &&
      file.type !== 'text/markdown'
    ) {
      onNotification('Please upload only text, markdown, PDF, or Word files', 'error');
      return;
    }

    try {
      const result = await uploadFileRequest(file, apiKey);
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

      const newDocuments = [...documents, newDoc];
      handleDocumentsChange(newDocuments, selectedDocuments);
      onNotification(`Successfully uploaded ${file.name}. Created ${chunksCreated} chunks.`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onNotification(`Failed to upload file: ${errorMessage}`, 'error');
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

  const handleClearDocuments = () => {
    if (documents.length === 0) {
      onNotification('No documents to clear', 'info');
      return;
    }

    const count = documents.length;
    handleDocumentsChange([], []);
    onNotification(`Cleared ${count} documents`, 'success');
  };

  const handleDeleteDocument = (docId: string) => {
    const newDocuments = documents.filter(doc => doc.id !== docId);
    const newSelectedDocuments = selectedDocuments.filter(id => id !== docId);
    handleDocumentsChange(newDocuments, newSelectedDocuments);
  };
  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return { bg: 'bg-red-500', text: 'PDF' };
      case 'word':
        return { bg: 'bg-blue-500', text: 'DOC' };
      case 'text':
        return { bg: 'bg-green-500', text: 'TXT' };
      default:
        return { bg: 'bg-purple-500', text: 'MD' };
    }
  };

  const calculateInsights = () => {
    return documents.reduce((acc, doc) => {
      const chunks = doc.content.match(/\d+/);
      return acc + (chunks ? parseInt(chunks[0]) : 1);
    }, 0);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 ml-4 mt-4 lg:h-full lg:mt-0 flex flex-col">
      <h3 className="text-lg font-semibold text-primary mb-5">Your Documents</h3>

      {/* Document Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="gradient-primary text-white p-4 rounded-xl text-center glass-card-hover">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-xs opacity-90">Documents</div>
        </div>
        <div className="gradient-primary text-white p-4 rounded-xl text-center glass-card-hover">
          <div className="text-2xl font-bold">{calculateInsights()}</div>
          <div className="text-xs opacity-90">Insights</div>
        </div>
      </div>

      {/* API Key */}
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-primary mb-2">
          OpenAI API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          className="w-full px-3 py-2 border-2 border-blue-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-50 text-primary placeholder-gray-400 transition-all duration-300"
          placeholder="Enter your OpenAI API key"
          aria-label="OpenAI API Key"
        />
      </div>

      {/* Upload Zone */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Upload Document
        </label>
        <div
          tabIndex={0}
          role="button"
          aria-label="Drag and drop a file here or click to select"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragLeave}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-24 mb-4 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 bg-opacity-70'
              : 'border-blue-300 bg-blue-50 bg-opacity-30 hover:bg-opacity-50'
          }`}
        >
          <div className="text-2xl mb-2">📁</div>
          <div className="text-sm text-center text-primary">
            {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
          </div>
          <div className="text-xs text-secondary mt-1">
            PDF, Word, Text, Markdown
          </div>
        </div>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload text, markdown, PDF, or Word file"
        />
      </div>

      {/* Recent Documents */}
      <div className="flex-1 flex flex-col min-h-0">
        <label className="block text-sm font-medium text-primary mb-3">
          Recent Documents
        </label>
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {documents.map(doc => {
            const icon = getDocumentIcon(doc.type);
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 hover:bg-opacity-50 transition-all duration-300">
                <div className={`w-8 h-8 ${icon.bg} rounded-md flex items-center justify-center text-white text-xs font-semibold`}>
                  {icon.text}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleSelectedDocumentsChange([...selectedDocuments, doc.id]);
                        } else {
                          handleSelectedDocumentsChange(selectedDocuments.filter(id => id !== doc.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select ${doc.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{doc.name}</div>
                      <div className="text-xs text-secondary">Just now</div>
                    </div>
                  </label>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors duration-200"
                  aria-label={`Delete ${doc.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
          {documents.length === 0 && (
            <div className="text-center py-8 text-secondary">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto">
        <button
          onClick={handleClearDocuments}
          className="w-full px-4 py-3 bg-red-100 bg-opacity-50 text-red-700 rounded-xl hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 font-medium"
          aria-label="Clear all documents"
        >
          Clear Documents
        </button>
      </div>
    </div>
  );
};

export default UserPanel;