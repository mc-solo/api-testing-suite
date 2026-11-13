import { describe, it, expect } from 'vitest';
import { restClient } from '../../src/clients/restClient';
import { userSchema, commentSchema, todoSchema, albumSchema } from '../../src/schemas/restSchemas';

describe('REST - Users, comments, todos, albums', () => {
  it('GET /users returns 10 users with valid schemas', async () => {
    const res = await restClient.get('/users');
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(10);
    for (const u of res.data) expect(() => userSchema.parse(u)).not.toThrow();
  });

  it('GET /users/1 returns Leanne Graham with a valid email', async () => {
    const res = await restClient.get('/users/1');
    expect(res.status).toBe(200);
    expect(res.data.name).toBe('Leanne Graham');
    expect(res.data.email).toContain('@');
    expect(() => userSchema.parse(res.data)).not.toThrow();
  });

  it('GET /users/1 address and company are nested objects', async () => {
    const res = await restClient.get('/users/1');
    expect(res.data.address.city).toBe('Gwenborough');
    expect(typeof res.data.company.name).toBe('string');
  });

  it('GET /comments?postId=1 returns 5 comments, all for post 1, valid emails', async () => {
    const res = await restClient.get('/comments', { params: { postId: 1 } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(5);
    for (const c of res.data) {
      expect(c.postId).toBe(1);
      expect(() => commentSchema.parse(c)).not.toThrow();
    }
  });

  it('GET /todos?userId=1 returns 20 todos with boolean completed', async () => {
    const res = await restClient.get('/todos', { params: { userId: 1 } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(20);
    for (const t of res.data.slice(0, 5)) expect(() => todoSchema.parse(t)).not.toThrow();
  });

  it('GET /albums?userId=1 returns 10 albums with valid schema', async () => {
    const res = await restClient.get('/albums', { params: { userId: 1 } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(10);
    for (const a of res.data) expect(() => albumSchema.parse(a)).not.toThrow();
  });

  it('GET /posts/1/comments returns comments linked to that post', async () => {
    const res = await restClient.get('/posts/1/comments');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((c: any) => c.postId === 1)).toBe(true);
  });

  it('POST /users creates a user and returns 201', async () => {
    const res = await restClient.post('/users', { name: 'Test User', username: 'testuser', email: 'test@example.com' });
    expect(res.status).toBe(201);
    expect(res.data.name).toBe('Test User');
    expect(res.data.id).toBe(11);
  });
});
