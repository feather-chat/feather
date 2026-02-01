import { useSyncExternalStore } from 'react';
import type { PresenceStatus, TypingEventData } from '@feather/api-client';

interface TypingUser {
  userId: string;
  displayName: string;
  expiresAt: number;
}

const TYPING_TIMEOUT = 5000; // 5 seconds

// Module-level state
let typingUsers = new Map<string, TypingUser[]>();
let userPresence = new Map<string, PresenceStatus>();
let listeners = new Set<() => void>();

// Notify all subscribers
function emitChange() {
  listeners.forEach((listener) => listener());
}

// Subscribe for useSyncExternalStore
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Snapshots for useSyncExternalStore
function getTypingSnapshot() {
  return typingUsers;
}

function getPresenceSnapshot() {
  return userPresence;
}

// Actions
export function addTypingUser(channelId: string, data: TypingEventData) {
  const newTyping = new Map(typingUsers);
  const channelTypers = newTyping.get(channelId) || [];

  // Remove existing entry for this user
  const filtered = channelTypers.filter((t) => t.userId !== data.user_id);

  // Add new entry with expiration
  filtered.push({
    userId: data.user_id,
    displayName: data.user_display_name || 'Someone',
    expiresAt: Date.now() + TYPING_TIMEOUT,
  });

  newTyping.set(channelId, filtered);
  typingUsers = newTyping;
  emitChange();
}

export function removeTypingUser(channelId: string, userId: string) {
  const newTyping = new Map(typingUsers);
  const channelTypers = newTyping.get(channelId) || [];
  const filtered = channelTypers.filter((t) => t.userId !== userId);

  if (filtered.length === 0) {
    newTyping.delete(channelId);
  } else {
    newTyping.set(channelId, filtered);
  }

  typingUsers = newTyping;
  emitChange();
}

export function setUserPresence(userId: string, status: PresenceStatus) {
  const newPresence = new Map(userPresence);
  newPresence.set(userId, status);
  userPresence = newPresence;
  emitChange();
}

function cleanupExpiredTyping() {
  const now = Date.now();
  let changed = false;
  const newTyping = new Map<string, TypingUser[]>();

  typingUsers.forEach((typers, channelId) => {
    const active = typers.filter((t) => t.expiresAt > now);
    if (active.length !== typers.length) {
      changed = true;
    }
    if (active.length > 0) {
      newTyping.set(channelId, active);
    }
  });

  if (changed) {
    typingUsers = newTyping;
    emitChange();
  }
}

// Cleanup expired typing indicators every second
setInterval(cleanupExpiredTyping, 1000);

// Hooks
export function useTypingUsers(channelId: string): TypingUser[] {
  const map = useSyncExternalStore(subscribe, getTypingSnapshot, getTypingSnapshot);
  const now = Date.now();
  const typers = map.get(channelId) || [];
  return typers.filter((t) => t.expiresAt > now);
}

export function useUserPresence(userId: string): PresenceStatus | undefined {
  const map = useSyncExternalStore(subscribe, getPresenceSnapshot, getPresenceSnapshot);
  return map.get(userId);
}
