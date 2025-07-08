# The Information Frontend

Welcome to the frontend of **The Information**! This is your friendly, modern, and modular React (Next.js) app for chatting with your own documents. 🚀

## 🧩 Modular Components

The UI is built from reusable, accessible components:
- **Header**: App title and navigation
- **Footer**: App footer and notes
- **UserPanel**: API key input, document upload (drag-and-drop or button), and document selection
- **ChatHistory**: Displays chat messages and loading state
- **ChatInputForm**: Input and send your questions

All state is managed at the top level and passed down, so everything stays in sync and easy to maintain.

## 🧪 Testing

We use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for fast, reliable component tests.

### Running Tests

From the `frontend` directory:

```sh
npm test
```

This will run all tests in `src/app/components/__tests__`. Watch mode is enabled by default, so you can keep coding and see results instantly!

### What’s Covered?
- Rendering and interaction for all major components
- Accessibility labels and usability
- Edge cases (empty states, loading, etc.)

## 🛠️ Development

- Modular, accessible, and fun UI
- Drag-and-drop or button upload for `.txt`, `.md`, `.pdf`, `.doc`, `.docx`
- Multi-document selection for chat context
- All state and logic is easy to follow and extend

## 💡 Pro Tips
- You can run tests in another terminal while developing for instant feedback
- All components are in `src/app/components/` and are easy to test and reuse

---

Have fun, and remember: LLMs can make mistakes, but your UI doesn’t have to! 😄
