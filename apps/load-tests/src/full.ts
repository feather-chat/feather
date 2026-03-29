// Load test: Full realistic workflow
//
// Simulates realistic user behavior: browse channels, read messages,
// send messages, react, search — all mixed together.
//
// Usage:
//   k6 run apps/load-tests/dist/full.js
//   k6 run apps/load-tests/dist/full.js --env K6_BASE_URL=https://chat.enzyme.im

import { check, sleep, group } from "k6";
import { Counter, Trend } from "k6/metrics";
import type { UserContext } from "./helpers.js";
import {
  loginAllUsers,
  pickUser,
  getMe,
  listChannels,
  sendMessage,
  listMessages,
  addReaction,
  searchMessages,
  startTyping,
  STANDARD_THRESHOLDS,
} from "./helpers.js";

const workflowDuration = new Trend("workflow_duration", true);
const workflowFailures = new Counter("workflow_failures");

export const options = {
  scenarios: {
    realistic_users: {
      executor: "ramping-vus" as const,
      startVUs: 0,
      stages: [
        { duration: "15s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "15s", target: 40 },
        { duration: "20s", target: 25 },
        { duration: "10s", target: 0 },
      ],
      exec: "userWorkflow",
    },
    passive_readers: {
      executor: "constant-vus" as const,
      vus: 10,
      duration: "80s",
      exec: "passiveReader",
      startTime: "5s",
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    workflow_duration: ["p(95)<5000"],
    workflow_failures: ["count<15"],
  },
};

export function setup() {
  return loginAllUsers();
}

export function userWorkflow(data: UserContext[]) {
  const user = pickUser(data);
  const workflowStart = Date.now();

  // 1. Check profile
  group("check profile", () => {
    const me = getMe(user.token);
    check(me, {
      "profile loaded": (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // 2. List channels
  let channels: Array<{ id: string; type: string }> = [];
  group("list channels", () => {
    const res = listChannels(user.token, user.workspaceId);
    check(res, {
      "channels loaded": (r) => r.status === 200,
    });
    channels =
      (res.json() as { channels?: Array<{ id: string; type: string }> })
        .channels || [];
  });

  if (channels.length === 0) {
    workflowFailures.add(1);
    sleep(2);
    return;
  }

  sleep(0.5);

  // 3. Read messages
  const publicChannels = channels.filter((c) => c.type === "public");
  const channel = publicChannels.length > 0 ? publicChannels[0] : channels[0];
  let messages: Array<{ id: string }> = [];
  group("read messages", () => {
    const res = listMessages(user.token, channel.id, 50);
    check(res, {
      "messages loaded": (r) => r.status === 200,
      "has messages": (r) =>
        ((r.json() as { messages?: unknown[] }).messages?.length ?? 0) > 0,
    });
    messages =
      (res.json() as { messages?: Array<{ id: string }> }).messages || [];
  });

  sleep(1 + Math.random());

  // 4. Send a message (70% chance)
  if (Math.random() < 0.7) {
    group("send message", () => {
      startTyping(user.token, user.workspaceId, channel.id);
      sleep(0.5 + Math.random());

      const res = sendMessage(
        user.token,
        channel.id,
        `Hey from ${user.name}! (load test ${__ITER})`
      );
      check(res, {
        "message sent": (r) => r.status === 200,
      });
    });
  }

  sleep(0.5);

  // 5. React to a message (40% chance)
  if (Math.random() < 0.4 && messages.length > 0) {
    group("add reaction", () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const emojis = ["+1", "heart", "rocket", "eyes", "tada"];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const res = addReaction(user.token, msg.id, emoji);
      check(res, {
        "reaction added": (r) => r.status === 200,
      });
    });
  }

  sleep(0.5);

  // 6. Search (20% of users)
  if (Math.random() < 0.2) {
    group("search", () => {
      const queries = ["hello", "meeting", "update", "help", "thanks"];
      const query = queries[Math.floor(Math.random() * queries.length)];
      const res = searchMessages(user.token, user.workspaceId, query);
      check(res, {
        "search returned": (r) => r.status === 200,
      });
    });
  }

  // 7. Browse another channel (30% chance)
  if (Math.random() < 0.3 && publicChannels.length > 1) {
    group("browse second channel", () => {
      const otherChannel = publicChannels[1];
      const res = listMessages(user.token, otherChannel.id, 25);
      check(res, {
        "second channel loaded": (r) => r.status === 200,
      });
    });
  }

  workflowDuration.add(Date.now() - workflowStart);
  sleep(1 + Math.random() * 2);
}

export function passiveReader(data: UserContext[]) {
  const user = pickUser(data);
  const channelId = user.channels[0];
  if (!channelId) {
    sleep(5);
    return;
  }

  const res = listMessages(user.token, channelId, 25);
  check(res, {
    "passive read ok": (r) => r.status === 200,
  });

  sleep(3 + Math.random() * 4);
}
