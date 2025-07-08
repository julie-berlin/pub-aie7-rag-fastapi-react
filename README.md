# pub-aie7-rag-fastapi-react

This is an end-to-end RAG application that allows users to upload PDFs for addition to the knowlegebase.

## Business Case - CoachCatalyst

CoachCatalyst is your personalized leadership coach built from your own library of resources. The advice you need is already in your possession. Now you can access it with a chat conversation!

- **Problem:** - I've collected leadership tips and advice but I don't have it at my fingertips when I have a specific problem or question. I can't always afford or find time to meet with a coach.
- **Why** - I am learning to be a better technical leader but valuable information is scattered among documents in various formats. It's hard to find the right tips when I need them.
- **Success** - Success indicators would be user adoption and weekly users and NPS rating of satisfaction.
- **Audience** - People who are seeking to improve their leadership skills and need advice on situations that arise. They already have a library of good resources but need to find the tips.
- **Potential solution** Briefly describe data that you might use and the modeling techniques that you plan to leverage.
- **Sharing** - I think this would be valuable to share on LinkedIn because the focus is career development.

## Features

- User provides their OpenAI API key
- User uploads files to their library one at a time
- User types a question into the input and submits
- User can clear the chat
- User can delete one or many documents

## Technical

- Detailed structured logging for debugging
- API key passed to backend via header
- Handles commonly used document types such as PDF, Word, text and markdown
- Adheres to WCAG 2.1+ accessibility specs
- Does not save state between user sessions
