# Claude Code Integration Prompt for CoachCatalyst

I need to integrate a new frontend interface for my document Q&A application called "CoachCatalyst" that targets leadership coaching. Please help me implement this interface and connect it to my existing backend.

## Current Application Structure
My application currently has:
- Document upload functionality that processes PDF, Word, text, and markdown files
- Document Q&A system that can answer questions based on uploaded content
- Backend API endpoints for file upload and question processing
- [Include any additional details about your current tech stack, database, authentication, etc.]

## New Interface Requirements

### 1. Frontend Implementation
Please integrate the provided HTML/CSS/JavaScript interface design with the following specifications:

**Key Components to Implement:**
- **Header**: Logo, branding, and user profile section
- **Sidebar**: Document library with upload zone, stats, and recent documents list
- **Main Chat Interface**: Question input, message history, and response display with source citations
- **File Upload**: Drag-and-drop functionality with visual feedback
- **Responsive Design**: Works on desktop and mobile devices

### 2. Backend Integration Needed

**File Upload Integration:**
- Connect the drag-and-drop upload zone to your existing file upload endpoint
- Display real-time upload progress
- Update document statistics and recent documents list after successful upload
- Handle file validation and error states
- Store document metadata (filename, upload date, file type) for the sidebar display

**Chat Functionality:**
- Connect the chat input to your existing Q&A API endpoint
- Display loading states while processing questions
- Show source citations by identifying which documents contributed to each answer
- Implement message persistence (store chat history)
- Add export chat functionality

**Document Management:**
- Implement document listing and filtering
- Add document deletion functionality
- Show document processing status
- Display document statistics (total count, insights generated)

### 3. Specific Features to Connect

**Real-time Updates:**
- Update document count when files are uploaded
- Refresh recent documents list
- Show processing status for uploaded documents

**Enhanced Q&A Features:**
- Implement the suggested questions functionality
- Add source highlighting (which documents provided each answer)
- Show confidence levels or relevance scores if available
- Add bookmark/save functionality for important insights

**User Experience Improvements:**
- Add proper error handling and user feedback
- Implement loading states and animations
- Add keyboard shortcuts (Enter to send, etc.)
- Include file type validation and size limits

### 4. Technical Implementation Details

**Framework Integration:**
- [Specify your framework: React, Vue, Flask, Django, etc.]
- Use the provided CSS animations and styling
- Maintain the glassmorphism design aesthetic
- Ensure all interactive elements are fully functional

**API Endpoints to Connect:**
- `POST /upload` - File upload endpoint
- `POST /question` - Question answering endpoint
- `GET /documents` - List user documents
- `DELETE /documents/:id` - Delete document
- `GET /chat-history` - Retrieve chat history (if implementing persistence)

**State Management:**
- Track uploaded documents
- Manage chat message history
- Handle loading and error states
- Maintain user session information

### 5. Additional Enhancements

**Performance Optimizations:**
- Implement lazy loading for large document lists
- Add pagination for chat history
- Optimize file upload with chunking for large files
- Add caching for frequently asked questions

**Security Considerations:**
- Validate file types and sizes on both frontend and backend
- Sanitize user inputs
- Implement proper authentication if not already present
- Add rate limiting for API calls

**Analytics Integration:**
- Track document upload metrics
- Monitor question types and patterns
- Measure user engagement with the interface

## Expected Deliverables

1. **Updated frontend** with the CoachCatalyst interface fully integrated
2. **Backend modifications** to support new frontend features
3. **API enhancements** for real-time updates and improved functionality
4. **Documentation** for the new interface and any API changes
5. **Testing** to ensure all features work correctly

## Technical Preferences

- Maintain clean, readable code with proper commenting
- Use modern JavaScript ES6+ features
- Implement proper error handling throughout
- Ensure mobile responsiveness
- Follow accessibility best practices
- Use semantic HTML and proper ARIA labels

Please analyze my current codebase and provide a step-by-step implementation plan, then proceed with integrating the CoachCatalyst interface while maintaining all existing functionality.

## Questions for You

Before starting implementation:
1. What's your current tech stack and project structure?
2. Are there any specific API endpoints or data formats I should be aware of?
3. Do you have user authentication implemented?
4. Are there any performance or scalability requirements?
5. Do you need any additional features beyond what's described?

Please proceed with the integration while asking clarifying questions as needed.