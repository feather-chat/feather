# @enzyme/mobile

React Native mobile client for Enzyme, built with Expo.

## Prerequisites

- Node.js 20+
- pnpm
- [Expo CLI](https://docs.expo.dev/get-started/set-up-your-environment/) (`npx expo`)
- iOS Simulator (macOS) or Android Emulator

## Development

From the monorepo root:

```bash
make dev MOBILE=1    # Starts API server, web client, and Expo dev server
```

Or run just the mobile dev server:

```bash
pnpm --filter @enzyme/mobile dev
```

Then press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go on a physical device.

## Architecture

- **Expo SDK 54** — Managed workflow with React Native 0.81
- **React Navigation** — Type-safe stack navigation (AuthStack + MainStack)
- **NativeWind** — Tailwind CSS for React Native styling
- **TanStack Query** — Server state via shared hooks from `@enzyme/shared`
- **Zustand** — Client state via shared stores from `@enzyme/shared`
- **react-native-sse** — Server-Sent Events for real-time updates
- **Expo SecureStore** — Secure token storage
- **Expo Notifications** — Push notifications via FCM/APNs

### Shared Code

The mobile app shares logic with the web client through `@enzyme/shared`:

- **Hooks**: All TanStack Query hooks (useMessages, useAuth, useChannels, etc.)
- **Stores**: Zustand stores for presence and message editing
- **SSE cache updaters**: Handlers that update React Query cache on real-time events
- **Utilities**: Query keys, emoji support, markdown parsing, mention handling

Mobile-specific code lives in `apps/mobile/src/` — navigation, screens, native components, and platform hooks (SSE lifecycle, push notifications, app state).

## Project Structure

```
src/
├── navigation/          # React Navigation stacks and types
│   ├── RootNavigator.tsx    # Auth state routing
│   ├── AuthStack.tsx        # Unauthenticated screens
│   ├── MainStack.tsx        # Authenticated screens
│   └── types.ts             # Navigation param types
├── screens/             # Screen components (13 screens)
├── components/          # UI components
│   └── ui/                  # Base primitives (Avatar, BottomSheet, etc.)
├── hooks/               # Mobile-specific hooks
│   ├── useSSE.ts            # SSE event dispatch
│   ├── useSSELifecycle.ts   # Connect/disconnect on app state
│   └── usePushNotifications.ts
└── lib/                 # Utilities and providers
    ├── sse.ts               # SSEConnection class
    ├── bootstrap.ts         # App initialization
    └── WorkspaceProvider.tsx # Active workspace context
```

## Testing

```bash
pnpm --filter @enzyme/mobile test:run    # Unit tests (vitest)
pnpm --filter @enzyme/mobile typecheck   # Type checking
pnpm --filter @enzyme/mobile lint        # Linting
```

## EAS Build

Builds are managed through [Expo Application Services](https://expo.dev/eas).

| Profile       | Purpose                | Distribution |
| ------------- | ---------------------- | ------------ |
| `development` | Dev client (simulator) | Internal     |
| `preview`     | Beta testing           | Internal     |
| `production`  | App store release      | Store        |

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for a specific profile
eas build --profile preview --platform ios
eas build --profile preview --platform android
eas build --profile production --platform all
```

Production builds auto-increment the build number. Code signing for OTA updates uses the certificate in `certs/`.

## Configuration

- **`app.json`** — Expo config (app name, bundle ID, splash screen, plugins)
- **`eas.json`** — EAS Build profiles and update channels
- **`tailwind.config.ts`** — NativeWind/Tailwind theme
- **`metro.config.js`** — Metro bundler config (monorepo symlinks, NativeWind)
