// Load test: SSE connections (concurrent subscribers + event delivery)
//
// Ramps up SSE connections while generating events, verifying that
// connections establish successfully and events are delivered.
// This is a lighter-weight test than sse-stress.js — good for CI.
//
// Usage:
//   k6 run tests/load/sse.js
//   k6 run tests/load/sse.js --env K6_BASE_URL=https://chat.enzyme.im

import sse from "k6/x/sse";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";
import {
  BASE_URL,
  loginAllUsers,
  pickUser,
  sendMessage,
  STANDARD_THRESHOLDS,
} from "./helpers.js";

// Custom metrics
const sseEventsReceived = new Counter("sse_events_received");
const sseConnectionErrors = new Counter("sse_connection_errors");
const eventTriggerDuration = new Trend("event_trigger_duration", true);

export const options = {
  scenarios: {
    // Ramp up SSE connections to test concurrency
    sse_connections: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 25 },
        { duration: "20s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "10s", target: 0 },
      ],
      exec: "sseConnection",
    },
    // Generate events while SSE connections are open
    event_generator: {
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 10,
      exec: "generateEvents",
      startTime: "10s",
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    sse_connection_errors: ["count<10"],
  },
};

export function setup() {
  return loginAllUsers();
}

export function sseConnection(data) {
  const user = pickUser(data);
  const url = `${BASE_URL}/api/workspaces/${user.workspaceId}/events`;

  const res = sse.open(
    url,
    {
      headers: { Authorization: `Bearer ${user.token}` },
    },
    function (client) {
      client.on("event", function () {
        sseEventsReceived.add(1);
      });

      client.on("error", function () {
        sseConnectionErrors.add(1);
      });
    }
  );

  check(res, {
    "SSE connection established": (r) => r.status === 200,
  });

  sleep(1 + Math.random() * 2);
}

export function generateEvents(data) {
  const user = pickUser(data);
  const channelId = user.channels[0];
  if (!channelId) return;

  const start = Date.now();
  const res = sendMessage(
    user.token,
    channelId,
    `SSE load test event ${Date.now()}`
  );
  eventTriggerDuration.add(Date.now() - start);

  check(res, {
    "event message sent": (r) => r.status === 200,
  });
}
