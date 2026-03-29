// Shared helpers for K6 load tests
import http, { type RefinedResponse, type ResponseType } from "k6/http";
import type {
  User,
  Channel,
  Message,
  Workspace,
} from "@enzyme/api-client";

// Base URL — override with K6_BASE_URL env var
export const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:8080";
const API = `${BASE_URL}/api`;

// Seed users (all have password "password")
export const SEED_USERS = [
  { email: "alice@example.com", name: "Alice Chen" },
  { email: "bob@example.com", name: "Bob Martinez" },
  { email: "carol@example.com", name: "Carol Williams" },
  { email: "dave@example.com", name: "Dave Johnson" },
  { email: "eve@example.com", name: "Eve Kim" },
  { email: "frank@example.com", name: "Frank O'Brien" },
  { email: "grace@example.com", name: "Grace Patel" },
  { email: "hank@example.com", name: "Hank Nguyen" },
] as const;

const PASSWORD = "password";

export interface UserContext {
  email: string;
  name: string;
  token: string;
  workspaceId: string;
  channels: string[];
}

// JSON request helper
export function jsonHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return { headers };
}

// Login and return token
export function login(email: string): string | null {
  const res = http.post(
    `${API}/auth/login`,
    JSON.stringify({ email, password: PASSWORD }),
    jsonHeaders()
  );
  if (res.status !== 200) {
    console.error(`Login failed for ${email}: ${res.status} ${res.body}`);
    return null;
  }
  return (res.json() as { token: string }).token;
}

// Register a unique user and return token
export function registerUser(suffix: string) {
  const email = `loadtest-${suffix}-${Date.now()}@example.com`;
  const res = http.post(
    `${API}/auth/register`,
    JSON.stringify({
      email,
      password: PASSWORD,
      display_name: `LoadTest ${suffix}`,
    }),
    jsonHeaders()
  );
  if (res.status !== 200) {
    console.error(`Register failed: ${res.status} ${res.body}`);
    return { token: null as string | null, email };
  }
  return { token: (res.json() as { token: string }).token, email };
}

// Login all seed users once and resolve their workspace/channel context.
// Call this from setup() so tokens are reused across VUs without hitting rate limits.
export function loginAllUsers(): UserContext[] {
  const users: UserContext[] = [];
  for (const user of SEED_USERS) {
    const token = login(user.email);
    if (!token) continue;

    const meRes = http.get(`${API}/auth/me`, jsonHeaders(token));
    if (meRes.status !== 200) continue;

    const me = meRes.json() as { workspaces: Array<{ id: string }> };
    if (me.workspaces.length === 0) continue;

    const workspaceId = me.workspaces[0].id;

    const chRes = http.post(
      `${API}/workspaces/${workspaceId}/channels/list`,
      null,
      jsonHeaders(token)
    );
    let channels: string[] = [];
    if (chRes.status === 200) {
      const data = chRes.json() as {
        channels: Array<{ id: string; type: string }>;
      };
      channels = data.channels
        .filter((c) => c.type === "public")
        .map((c) => c.id);
    }

    users.push({
      email: user.email,
      name: user.name,
      token,
      workspaceId,
      channels,
    });
  }
  return users;
}

// Pick a user context from the setup data based on VU number
export function pickUser(setupData: UserContext[]): UserContext {
  return setupData[__VU % setupData.length];
}

// Get current user
export function getMe(token: string) {
  return http.get(`${API}/auth/me`, jsonHeaders(token));
}

// List channels in a workspace
export function listChannels(token: string, workspaceId: string) {
  return http.post(
    `${API}/workspaces/${workspaceId}/channels/list`,
    null,
    jsonHeaders(token)
  );
}

// Send a message
export function sendMessage(
  token: string,
  channelId: string,
  content: string
) {
  return http.post(
    `${API}/channels/${channelId}/messages/send`,
    JSON.stringify({ content }),
    jsonHeaders(token)
  );
}

// List messages
export function listMessages(
  token: string,
  channelId: string,
  limit = 50
) {
  return http.post(
    `${API}/channels/${channelId}/messages/list`,
    JSON.stringify({ limit }),
    jsonHeaders(token)
  );
}

// Add reaction
export function addReaction(
  token: string,
  messageId: string,
  emoji: string
) {
  return http.post(
    `${API}/messages/${messageId}/reactions/add`,
    JSON.stringify({ emoji }),
    jsonHeaders(token)
  );
}

// Typing indicator
export function startTyping(
  token: string,
  workspaceId: string,
  channelId: string
) {
  return http.post(
    `${API}/workspaces/${workspaceId}/typing/start`,
    JSON.stringify({ channel_id: channelId }),
    jsonHeaders(token)
  );
}

// Search messages
export function searchMessages(
  token: string,
  workspaceId: string,
  query: string
) {
  return http.post(
    `${API}/workspaces/${workspaceId}/messages/search`,
    JSON.stringify({ query }),
    jsonHeaders(token)
  );
}

// Standard thresholds used across tests
export const STANDARD_THRESHOLDS = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500", "p(99)<1000"],
};

// Stricter thresholds for read-heavy endpoints
export const READ_THRESHOLDS = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<300", "p(99)<500"],
};
