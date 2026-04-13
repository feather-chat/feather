---
title: 'Channels'
description: 'Create, join, and manage channels'
section: 'Using Enzyme'
order: 11
---

# Channels

Channels are where team conversations happen. They can be organized by project, topic, team, or anything else.

## Public vs Private Channels

| Type        | Visibility                       | Joining                   |
| ----------- | -------------------------------- | ------------------------- |
| **Public**  | Visible to all workspace members | Anyone can join           |
| **Private** | Visible only to members          | Must be added by a member |

Channel type can be changed between public and private by channel admins or workspace admins/owners. See [Administration](/docs/administration/#public-vs-private) for details.

## Creating a Channel

By default, members, admins, and owners can create channels. This is configurable by workspace admins via the **who can create channels** [permission setting](/docs/permissions/#configurable-permission-settings). To create a channel:

1. Open the command palette (**Cmd+K**) and type "Create channel", or click the **+** next to "Channels" in the sidebar.
2. Enter a channel name — lowercase letters, numbers, and hyphens only (e.g., `project-alpha`, `design-reviews`).
3. Choose **Public** or **Private**.
4. Optionally add a description.

## Joining and Leaving

- **Public channels** — Click any public channel in the sidebar to join it. You can also be added by another member.
- **Private channels** — You must be invited by an existing member.
- **Leaving** — Right-click a channel in the sidebar or use channel settings to leave. You cannot leave the #general channel.

## The #general Channel

Every workspace has a **#general** channel with special rules:

- All new members are automatically added when they join the workspace.
- It cannot be archived, deleted, or made private.

## Starring Channels

Star a channel to pin it to the top of your sidebar. Click the star icon in the channel header or right-click the channel in the sidebar. Starred channels appear in a separate "Starred" section.

## Channel Roles

Within a channel, members can have different roles:

| Role       | Can post | Can manage channel |
| ---------- | :------: | :----------------: |
| **Admin**  |   yes    |        yes         |
| **Poster** |   yes    |                    |
| **Viewer** |          |                    |

Channel roles are independent of workspace roles. A workspace member can be a viewer in one channel and an admin in another. See [Permissions & Roles](/docs/permissions/#channel-roles) for details.

## Voice Channels

Voice channels provide real-time audio communication. They appear in a separate "Voice Channels" section of the sidebar.

### Creating a Voice Channel

When creating a channel, choose **Voice** as the channel type. Voice channels require the server to have voice enabled (see [Configuration](/docs/configuration/)).

### Joining a Voice Call

Click a voice channel in the sidebar, then click **Join Voice**. Your browser will request microphone access. Once connected, you'll see other participants in a grid.

### Controls

- **Mute** — Toggle your microphone on/off.
- **Deafen** — Mute all incoming audio (also mutes your microphone).
- **Leave** — Disconnect from the voice channel.

### Server Mute

Workspace admins and owners can server-mute any participant. A server-muted user cannot unmute themselves — only an admin can remove the server mute.

### Limits

Voice channels have a configurable participant limit (default: 15). When a channel is full, new users cannot join until someone leaves.

## Archiving Channels

Workspace owners and admins can archive channels to make them read-only. Archived channels preserve their message history but no new messages can be sent. The #general channel and DM channels cannot be archived.

## Mark as Read

Right-click a channel in the sidebar to mark all messages as read. You can also mark all channels in the workspace as read at once from the sidebar menu.
