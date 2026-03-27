---
title: 'Mobile App'
description: 'Install and use the Enzyme mobile app on iOS and Android'
section: 'Getting Started'
order: 3
---

# Mobile App

Enzyme has a native mobile app for iOS and Android, built with React Native and Expo. It supports the same features as the web client: channels, threads, direct messages, reactions, file sharing, search, and real-time updates.

## Installation

The mobile app is available through the following channels:

- **iOS** — [App Store](https://apps.apple.com/app/enzyme/id0000000000) (requires iOS 16+)
- **Android** — [Google Play](https://play.google.com/store/apps/details?id=im.enzyme.mobile) (requires Android 10+)

## Connecting to Your Server

When you first open the app, you'll be asked for your server URL. Enter the public URL of your Enzyme instance (e.g., `https://chat.example.com`). The app stores this URL so you only need to enter it once.

If your server uses the default port (443 with TLS), just enter the domain. If it uses a custom port, include it in the URL (e.g., `https://chat.example.com:8443`).

## Supported Platforms

| Platform | Minimum Version |
| -------- | --------------- |
| iOS      | 16.0            |
| Android  | 10 (API 29)     |

## Push Notifications

Push notifications are delivered when you're away from the app. They work automatically when your server administrator has [push notifications enabled](/docs/configuration/#push-notifications).

No setup is required on your end — the app registers your device automatically when you sign in. You'll be prompted to allow notifications on first launch.

### Privacy

Push notifications are routed through a relay service (`push.enzyme.im`) that dispatches to Apple (APNs) and Google (FCM) on behalf of your server. By default, the relay receives:

- Sender name and channel name (metadata)
- A short message preview

Server administrators can set `include_preview: false` to omit the message preview. In that case, the relay receives only metadata, and the app fetches message content directly from your server when you tap the notification.

The relay does not store messages or notification content. It forwards the push payload and discards it.

## Self-Hosting Administrators

To support the mobile app on your self-hosted instance:

1. **Enable push notifications** in your server config:

   ```yaml
   push_notifications:
     enabled: true
   ```

2. The default relay (`push.enzyme.im`) works out of the box with the published app. No FCM/APNs credentials are needed on your end.

3. Optionally disable message previews for privacy:

   ```yaml
   push_notifications:
     enabled: true
     include_preview: false
   ```

See [Push Notifications configuration](/docs/configuration/#push-notifications) for all options and [Notifications](/docs/notifications/#push-notifications) for the full delivery pipeline.
