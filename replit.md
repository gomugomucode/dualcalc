# Overview

This is a React-based Android-style calculator application that provides three distinct modes: simple calculator, scientific calculator, and currency converter. The app features a modern UI built with Tailwind CSS, AI-powered explanations using Google's Gemini API, and is packaged for Android deployment using Capacitor. It provides calculation history, undo/redo functionality, and real-time currency conversion with live exchange rates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS (via CDN) for utility-first responsive design
- **State Management**: React hooks (useState, useEffect) for local component state
- **Type Safety**: TypeScript with strict configuration for compile-time type checking

**Component Structure**:
- `App.tsx` - Main component managing all calculator state and business logic
- `Display.tsx` - Expression and result display with copy/paste functionality and context menu
- `CalculatorButton.tsx` - Reusable button component with haptic feedback
- `HistoryPanel.tsx` - Slide-up panel showing calculation history
- `AIResponsePanel.tsx` - Modal dialog for AI-generated explanations

**State Management Strategy**:
- All state centralized in App component (expression, display value, mode, history, undo/redo stacks)
- Undo/redo implemented using snapshot-based stacks storing calculator state
- History persisted in memory array (no database persistence currently)

**Mobile Considerations**:
- Capacitor framework for Android native packaging
- Touch-optimized UI with haptic feedback via `navigator.vibrate()`
- Viewport locked to prevent scaling (`user-scalable=no`)
- Overscroll behavior disabled for native app feel

## Calculator Modes & Features

**Three Operating Modes**:
1. **Simple Mode**: Basic arithmetic operations (+, -, ×, ÷, %)
2. **Scientific Mode**: Extended functions (trigonometry, logarithms, factorials, powers, roots)
3. **Currency Mode**: Real-time currency conversion between 10 major currencies

**Angle Mode Support**: Scientific mode supports both degrees and radians for trigonometric functions

**Expression Evaluation**:
- Custom expression parser in `utils/math.ts`
- Handles operator precedence, parentheses nesting
- Supports scientific functions (sin, cos, tan, log, ln, sqrt, etc.)
- Factorial calculation with iterative approach
- Decimal-to-fraction conversion using continued fraction algorithm

**History & Undo/Redo**:
- Snapshot-based undo/redo system capturing full calculator state
- Calculation history stored as formatted strings
- History panel with clear functionality and item reuse

## AI Integration

**Service**: Google Gemini API (via `@google/genai` package)
- API key injected via environment variable `GEMINI_API_KEY`
- Vite config defines `process.env.API_KEY` at build time

**Use Case**: Provides natural language explanations of calculation results
- User triggers AI explanation via dedicated button
- Loading states managed during API calls
- Responses displayed in modal overlay panel

**Architecture Decision**: AI feature is optional enhancement, not core functionality. Calculator remains fully functional if API key is missing or requests fail.

## Currency Conversion

**Data Source**: 
- Primary: Frankfurter API (free, open-source exchange rate API)
- Fallback: Hardcoded `DEFAULT_EXCHANGE_RATES` with 2024 approximate values

**Supported Currencies**: USD, EUR, GBP, JPY, INR, CAD, AUD, CNY, CHF, SGD

**Implementation**:
- Rates fetched on component mount
- Base currency: USD (all rates relative to USD)
- Conversion formula: `amount * (targetRate / sourceRate)`
- Graceful degradation to default rates if API fails

**Architecture Decision**: Client-side currency conversion chosen for simplicity. Rates refresh on app load, not continuously. For production, consider caching strategy or periodic refresh.

# External Dependencies

## Third-Party APIs

1. **Google Gemini API** (`@google/genai` v1.30.0)
   - Purpose: AI-powered calculation explanations
   - Authentication: API key via environment variable
   - Error Handling: Graceful degradation if unavailable

2. **Frankfurter Exchange Rate API** (https://api.frankfurter.app)
   - Purpose: Real-time currency exchange rates
   - Base Currency: USD
   - Fallback: Hardcoded default rates in application

## NPM Packages

**Core Dependencies**:
- `react` (^19.2.0) - UI framework
- `react-dom` (^19.2.0) - React rendering for web
- `@google/genai` (^1.30.0) - Google Gemini API client
- `@capacitor/core` (^7.4.4) - Cross-platform native runtime
- `@capacitor/android` (^7.4.4) - Android platform integration
- `@capacitor/cli` (^7.4.4) - Capacitor build tools

**Development Dependencies**:
- `vite` (^6.2.0) - Build tool and dev server
- `@vitejs/plugin-react` (^5.0.0) - React support for Vite
- `typescript` (~5.8.2) - Type system
- `@types/node` (^22.14.0) - Node.js type definitions

## Build & Deployment

**Development**: Vite dev server on port 5000 (host 0.0.0.0 for network access)

**Production**: 
- Build output to `dist/` directory
- Capacitor wraps web assets for Android APK
- Environment variables injected at build time via Vite's `define` config

**Platform Support**:
- Web browsers (primary)
- Android (via Capacitor native wrapper)

## CDN Resources

- Tailwind CSS loaded via CDN (`https://cdn.tailwindcss.com`)
- React loaded via import maps pointing to `aistudiocdn.com` (alternative to bundling)

**Architecture Decision**: CDN approach reduces bundle size but requires internet connectivity. For offline-first Android app, consider bundling Tailwind and React.