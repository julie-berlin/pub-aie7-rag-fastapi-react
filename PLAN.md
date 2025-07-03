# Project Plan

This application is called "the information" as a bare bones way to get the information you need from your docs.

## Features

This application provides an easy way for a person to upload their own PDF files and ask questions about the content.

The user flow is:

- User provides their OpenAI API key
- User uploads a single PDF file
- User selects the documents from the input (can be multiple)
- User types a question into the input and sends
- User can clear the chat
- User can delete one or many documents

The backend flow is:

- PDF provided by user is indexed and passed to a simple RAG application that leverages the `aimakerspace` library
- Chat query history is saved until user deletes it

Constraints

- The OpenAI API key always comes from the user and not from environment variable
- CORS should only allow backend communication from localhost on local or vercel host on preview/production
- Adhere to WCAG 2.1 or above accessibility standards
- PDF size maximum is 10Mb
- Backend is served from `/api` via FastAPI
