import React from 'react';

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'word';
  content: string;
}

interface UserPanelProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  documents: Document[];
  selectedDocuments: string[];
  setSelectedDocuments: (ids: string[]) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFile: (file: File) => Promise<void>;
  handleNewChat: () => void;
  handleDeleteDocument: (docId: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement> | React.RefObject<HTMLInputElement | null>;
  isDragActive: boolean;
  setIsDragActive: (active: boolean) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  apiKey,
  setApiKey,
  documents,
  selectedDocuments,
  setSelectedDocuments,
  handleFileUpload,
  handleNewChat,
  handleDeleteDocument,
  fileInputRef,
  isDragActive,
  handleDrop,
  handleDragOver,
  handleDragLeave
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
    <div>
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
    <div>
      <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
        className={`flex items-center justify-center border-2 border-dashed rounded-md h-24 mb-4 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
        }`}
      >
        <span className="text-gray-500 dark:text-gray-300 text-sm">
          {isDragActive ? 'Drop the file here!' : 'Drag and drop a .txt, .md, .pdf, or .doc/.docx file here, or click to select'}
        </span>
      </div>
      <input
        id="file-upload"
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        aria-label="Upload text, markdown, PDF, or Word file"
        style={{ display: 'none' }}
      />
    </div>
    <div>
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
                    setSelectedDocuments([...selectedDocuments, doc.id]);
                  } else {
                    setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
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
);

export default UserPanel;