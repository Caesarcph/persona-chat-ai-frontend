# PersonaChatAI Frontend

A React and TypeScript-based frontend for AI chat application with personalized AI character creation and conversation capabilities.

## Features

- 🤖 Personalized AI character creation and management
- 💬 Real-time chat conversation interface
- 🎨 Custom avatar generation
- 📱 Responsive design with mobile support
- ⚡ Performance optimized with message virtualization
- 🧠 Smart form validation with debounced input handling

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **Performance**: React Window virtualization
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

```bash
npm install
```

### Start Development Server

```bash
npm start
```

The application will start at http://localhost:3000

### Build for Production

```bash
npm run build
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:performance` - Run performance tests

## Project Structure

```
src/
├── components/     # Reusable components
├── hooks/         # Custom React Hooks
├── pages/         # Page components
├── routes/        # Router configuration
├── stores/        # Zustand state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── validation/    # Form validation rules
└── __tests__/     # Test files
```

## Performance Optimizations

The project implements several performance optimizations:

- Debounced form handling to reduce unnecessary re-renders
- Component lazy loading to reduce initial bundle size
- Message list virtualization for smooth scrolling with large datasets
- Memory cleanup mechanisms to prevent memory leaks
- Performance monitoring and debugging tools

For detailed information, see [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Contact

For questions or suggestions, please create an Issue or contact the project maintainers.