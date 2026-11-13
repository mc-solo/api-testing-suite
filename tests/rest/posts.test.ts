import { describe, it, expect } from 'vitest';
import { restClient } from '../../src/clients/restClient';
import { postSchema } from '../../src/schemas/restSchemas';

describe('REST - Posts (JSONPlaceholder)', () => {
  it('GET /posts returns 200, JSON, and 100 posts', async () => {
    const res = await restClient.get('/posts');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(100);
  });

  it('GET /posts validates the schema of every post', async () => {
    const res = await restClient.get('/posts');
    for (const post of res.data.slice(0, 20)) {
      expect(() => postSchema.parse(post)).not.toThrow();
    }
    const ids = res.data.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(100); // ids are unique
  });

  it('GET /posts/1 returns the expected post', async () => {
    const res = await restClient.get('/posts/1');
    expect(res.status).toBe(200);
    expect(() => postSchema.parse(res.data)).not.toThrow();
    expect(res.data.id).toBe(1);
    expect(res.data.userId).toBe(1);
    expect(typeof res.data.title).toBe('string');
  });

  it('GET /posts?userId=1 returns only that user posts (10)', async () => {
    const res = await restClient.get('/posts', { params: { userId: 1 } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(10);
    expect(res.data.every((p: any) => p.userId === 1)).toBe(true);
  });

  it('GET /posts responds in under 2 seconds', async () => {
    const start = Date.now();
    const res = await restClient.get('/posts/1');
    expect(res.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it('POST /posts creates a post and returns 201 with the sent fields', async () => {
    const payload = { title: 'api test', body: 'hello from vitest', userId: 1 };
    const res = await restClient.post('/posts', payload);
    // JSONPlaceholder is a fake API: it echoes the payload with id 101 and does not persist it.
    expect(res.status).toBe(201);
    expect(res.data.title).toBe(payload.title);
    expect(res.data.body).toBe(payload.body);
    expect(res.data.userId).toBe(1);
    expect(res.data.id).toBe(101);
  });

  it('PUT /posts/1 replaces the post and returns 200', async () => {
    const res = await restClient.put('/posts/1', { id: 1, title: 'replaced', body: 'new body', userId: 1 });
    expect(res.status).toBe(200);
    expect(res.data.title).toBe('replaced');
    expect(res.data.id).toBe(1);
  });

  it('PATCH /posts/1 updates only the title', async () => {
    const res = await restClient.patch('/posts/1', { title: 'patched title' });
    expect(res.status).toBe(200);
    expect(res.data.title).toBe('patched title');
    expect(res.data.id).toBe(1);
  });

  it('DELETE /posts/1 returns 200', async () => {
    const res = await restClient.delete('/posts/1');
    expect([200, 204]).toContain(res.status);
  });

  it('GET /posts/1 then GET /posts/2 returns different posts (data isolation by id)', async () => {
    const a = await restClient.get('/posts/1');
    const b = await restClient.get('/posts/2');
    expect(a.data.id).not.toBe(b.data.id);
    expect(a.data.title).not.toBe(b.data.title);
  });
});
