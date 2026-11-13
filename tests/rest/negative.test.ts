import { describe, it, expect } from 'vitest';
import { restClient } from '../../src/clients/restClient';

describe('REST - Negative and auth cases', () => {
  it('GET an unknown route returns 404', async () => {
    const res = await restClient.get('/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });

  it('GET /posts/99999 returns 404 or an empty object (no such post)', async () => {
    const res = await restClient.get('/posts/99999');
    // JSONPlaceholder returns 404 for ids far out of range; accept either
    // documented behaviour, but assert it is NOT a real post.
    expect([404, 200]).toContain(res.status);
    if (res.status === 200) expect(res.data).toEqual({});
  });

  it('GET /posts/abc (non-numeric id) does not return a real post', async () => {
    const res = await restClient.get('/posts/abc');
    expect([404, 200]).toContain(res.status);
    if (res.status === 200) expect(res.data.id).toBeUndefined();
  });

  it('POST /posts with an empty body is rejected or echoed without a title', async () => {
    const res = await restClient.post('/posts', {});
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) expect(res.data.title).toBeUndefined();
  });

  it('GET /posts with an invalid query value returns 200 with no matching posts or all posts, never 500', async () => {
    const res = await restClient.get('/posts', { params: { userId: 99999 } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(0);
  });

  it('Auth: this public API needs no token - unauthenticated GET succeeds (documented, not assumed)', async () => {
    const res = await restClient.get('/posts/1');
    expect(res.status).toBe(200);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('Auth: a bogus Bearer token does not change the public response', async () => {
    const res = await restClient.get('/posts/1', { headers: { Authorization: 'Bearer invalid-token' } });
    expect(res.status).toBe(200);
  });

  it('Unsupported method: PUT to /posts without an id returns 404 or 500, never a silent success', async () => {
    const res = await restClient.put('/posts', { title: 'x' });
    expect([404, 500]).toContain(res.status);
  });
});
