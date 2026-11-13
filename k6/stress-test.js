// k6 stress test against JSONPlaceholder (public demo API).
// Ramps up in stages to find where response time and errors start to grow.
// Kept light on purpose: this is a shared public demo API, not a load target
// owned by this project. Run: k6 run k6/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 25 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.10'],
    checks: ['rate>0.90'],
  },
};

const BASE = __ENV.REST_BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  const res = http.get(`${BASE}/posts/1`);
  check(res, {
    'GET /posts/1 is 200': (r) => r.status === 200,
    'response under 1.5s': (r) => r.timings.duration < 1500,
  });
  sleep(1);
}
