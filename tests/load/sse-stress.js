// SSE stress test — holds many concurrent SSE connections while generating
// realistic traffic (messages, reactions, typing) and measuring fan-out latency.
//
// Usage:
//   k6 run tests/load/sse-stress.js
//   k6 run tests/load/sse-stress.js --env SSE_CONNECTIONS=2000 --env SSE_DURATION=2m
//   k6 run tests/load/sse-stress.js --env K6_BASE_URL=https://chat.enzyme.im

import sse from "k6/x/sse";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";
import {
  BASE_URL,
  loginAllUsers,
  pickUser,
  sendMessage,
  addReaction,
  startTyping,
} from "./helpers.js";

// Custom metrics
const fanoutLatency = new Trend("sse_fanout_latency", true);
const sseEventsReceived = new Counter("sse_events_received");
const sseConnectionErrors = new Counter("sse_connection_errors");
const sseMsgSent = new Counter("sse_messages_sent");
const sseMsgErrors = new Counter("sse_message_errors");

// Configuration via env vars
const CONNECTIONS = parseInt(__ENV.SSE_CONNECTIONS || "100");
const DURATION = __ENV.SSE_DURATION || "2m";
const MSG_RATE = parseInt(__ENV.SSE_MSG_RATE || "5");
const RAMP = __ENV.SSE_RAMP || "30s";

export const options = {
  scenarios: {
    // Each VU holds one SSE connection for the duration of the test.
    // ramping-vus controls how many are open concurrently.
    sse_listeners: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: RAMP, target: CONNECTIONS },
        { duration: DURATION, target: CONNECTIONS },
        { duration: "10s", target: 0 },
      ],
      exec: "holdConnection",
      gracefulStop: "10s",
    },
    // Sends messages at a fixed rate while SSE connections are open.
    // Each message embeds a timestamp for fan-out latency measurement.
    activity: {
      executor: "constant-arrival-rate",
      rate: MSG_RATE,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 10,
      maxVUs: 20,
      exec: "generateActivity",
      startTime: RAMP,
    },
  },
  thresholds: {
    sse_connection_errors: ["count<50"],
    sse_message_errors: ["count<10"],
  },
};

export function setup() {
  return loginAllUsers();
}

export function holdConnection(data) {
  const user = pickUser(data);
  const url = `${BASE_URL}/api/workspaces/${user.workspaceId}/events`;

  const res = sse.open(
    url,
    {
      headers: { Authorization: `Bearer ${user.token}` },
    },
    function (client) {
      client.on("event", function (event) {
        sseEventsReceived.add(1);

        // Measure fan-out latency for messages with embedded timestamps.
        // Senders embed "t=<millis>" in message content; we compute the
        // difference between now and the send time.
        if (event.data && event.data.includes("t=")) {
          const match = event.data.match(/t=(\d+)/);
          if (match) {
            const sentMs = parseInt(match[1]);
            const latencyMs = Date.now() - sentMs;
            if (latencyMs > 0 && latencyMs < 30000) {
              fanoutLatency.add(latencyMs);
            }
          }
        }
      });

      client.on("error", function () {
        sseConnectionErrors.add(1);
      });
    }
  );

  check(res, {
    "SSE connection established": (r) => r.status === 200,
  });
}

const emojis = [
  "+1",
  "heart",
  "rocket",
  "eyes",
  "fire",
  "tada",
  "100",
  "wave",
];

export function generateActivity(data) {
  const user = pickUser(data);
  if (!user.channels || user.channels.length === 0) return;

  const channelId =
    user.channels[Math.floor(Math.random() * user.channels.length)];

  // Send message with embedded timestamp for latency measurement
  const res = sendMessage(
    user.token,
    channelId,
    `t=${Date.now()} Load test from ${user.email}`
  );

  if (res.status === 200) {
    sseMsgSent.add(1);

    // 30% chance: add reaction to our own message
    if (Math.random() < 0.3) {
      try {
        const msgId = res.json().message.id;
        if (msgId) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          addReaction(user.token, msgId, emoji);
        }
      } catch (_) {
        /* ignore parse errors */
      }
    }
  } else {
    sseMsgErrors.add(1);
  }

  // 20% chance: typing indicator
  if (Math.random() < 0.2) {
    startTyping(user.token, user.workspaceId, channelId);
  }
}
