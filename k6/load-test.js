// k6 load test against JSONPlaceholder (public demo API).
// Light, polite load: 10 virtual users for 30 seconds.
// Run: k6 run k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

const BASE = __ENV.REST_BASE_URL || 'https://jsonplaceholder.typicode.com';

export default function () {
  const posts = http.get(`${BASE}/posts`);
  check(posts, {
    'GET /posts is 200': (r) => r.status === 200,
    'GET /posts is fast (p95 target)': (r) => r.timings.duration < 800,
  });

  const post = http.get(`${BASE}/posts/1`);
  check(post, { 'GET /posts/1 is 200': (r) => r.status === 200 });

  const created = http.post(
    `${BASE}/posts`,
    JSON.stringify({ title: 'k6 test', body: 'load test', userId: 1 }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(created, { 'POST /posts is 201': (r) => r.status === 201 });

  sleep(1);
}
