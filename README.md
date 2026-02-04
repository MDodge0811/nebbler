# Nebbler Mobile App

A React Native mobile application built with Expo and TypeScript.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- iOS Simulator (macOS only) - Xcode required
- Android Emulator - Android Studio with SDK required

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd nebbler
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

### Running on Simulators

**iOS (macOS only):**

```bash
npm run ios
```

**Android:**

```bash
npm run android
```

**Note:** For Android, ensure `ANDROID_HOME` environment variable is set:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── constants/      # App constants
└── types/          # TypeScript type definitions
```

## Available Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm start`            | Start Expo development server |
| `npm run ios`          | Start on iOS simulator        |
| `npm run android`      | Start on Android emulator     |
| `npm run web`          | Start in web browser          |
| `npm run lint`         | Run ESLint                    |
| `npm run lint:fix`     | Run ESLint with auto-fix      |
| `npm run format`       | Format code with Prettier     |
| `npm run format:check` | Check code formatting         |
| `npm run typecheck`    | Run TypeScript type checking  |

## Code Quality

This project enforces code quality through:

- **TypeScript** - Static type checking
- **ESLint** - Code linting with React Native rules
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks for linting

### Pre-commit Hooks

On every commit, the following checks run automatically:

- ESLint on staged `.ts` and `.tsx` files
- Prettier formatting on all staged files

## Navigation

The app uses React Navigation with:

- **Native Stack Navigator** - For screen transitions
- **Bottom Tab Navigator** - For main navigation tabs

### Current Screens

- Home - Main landing screen
- Settings - App settings
- Details - Example detail screen with route params

## Environment Setup

### iOS Development (macOS)

1. Install Xcode from the App Store
2. Install iOS simulators via Xcode preferences
3. Run `npm run ios`

### Android Development

1. Install Android Studio
2. Configure Android SDK (API level 33+)
3. Create an Android Virtual Device (AVD)
4. Set environment variables:

   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   ```

5. Run `npm run android`

## Path Aliases

The project uses path aliases for cleaner imports:

| Alias           | Path               |
| --------------- | ------------------ |
| `@/*`           | `src/*`            |
| `@components/*` | `src/components/*` |
| `@screens/*`    | `src/screens/*`    |
| `@navigation/*` | `src/navigation/*` |
| `@hooks/*`      | `src/hooks/*`      |
| `@utils/*`      | `src/utils/*`      |
| `@constants/*`  | `src/constants/*`  |
| `@types/*`      | `src/types/*`      |

## Troubleshooting

### Metro bundler issues

```bash
npx expo start --clear
```

### TypeScript errors with path aliases

Ensure both `tsconfig.json` and `babel.config.js` have matching alias configurations.

### iOS build issues

```bash
cd ios && pod install && cd ..
```

### Android build issues

Ensure ANDROID_HOME is properly configured and an emulator is running.

## License

MIT
