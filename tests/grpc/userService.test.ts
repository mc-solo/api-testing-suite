import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import { startTestServer } from '../../src/grpc/server';
import { createUserClient, promisify } from '../../src/grpc/client';

describe('gRPC - UserService (local sample service, see proto/user.proto)', () => {
  let server: grpc.Server;
  let client: any;
  let address: string;

  beforeAll(async () => {
    const started = await startTestServer();
    server = started.server;
    address = started.address;
    client = createUserClient(address);
  });

  afterAll(async () => {
    client?.close();
    await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));
  });

  it('GetUser returns the seeded user Ada Lovelace for id 1', async () => {
    const user = await promisify<any>((cb) => client.GetUser({ id: '1' }, cb));
    expect(user.id).toBe('1');
    expect(user.name).toBe('Ada Lovelace');
    expect(user.email).toBe('ada@example.com');
  });

  it('GetUser returns Alan Turing for id 2', async () => {
    const user = await promisify<any>((cb) => client.GetUser({ id: '2' }, cb));
    expect(user.name).toBe('Alan Turing');
  });

  it('CreateUser creates a user with a new id and it can then be fetched', async () => {
    const created = await promisify<any>((cb) => client.CreateUser({ name: 'Grace Hopper', email: 'grace@example.com' }, cb));
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Grace Hopper');
    const fetched = await promisify<any>((cb) => client.GetUser({ id: created.id }, cb));
    expect(fetched.email).toBe('grace@example.com');
  });

  it('CreateUser trims surrounding whitespace from name and email', async () => {
    const created = await promisify<any>((cb) => client.CreateUser({ name: '  Linus Torvalds  ', email: '  linus@example.com ' }, cb));
    expect(created.name).toBe('Linus Torvalds');
    expect(created.email).toBe('linus@example.com');
  });

  it('ListUsers returns the seeded users', async () => {
    const res = await promisify<any>((cb) => client.ListUsers({ limit: 0 }, cb));
    expect(res.users.length).toBeGreaterThanOrEqual(2);
    expect(res.users.map((u: any) => u.id)).toContain('1');
  });

  it('ListUsers with limit 1 returns exactly one user', async () => {
    const res = await promisify<any>((cb) => client.ListUsers({ limit: 1 }, cb));
    expect(res.users).toHaveLength(1);
  });

  it('GetUser for a missing id returns NOT_FOUND (code 5)', async () => {
    await expect(promisify<any>((cb) => client.GetUser({ id: '9999' }, cb))).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
    });
  });

  it('GetUser with an empty id returns INVALID_ARGUMENT (code 3)', async () => {
    await expect(promisify<any>((cb) => client.GetUser({ id: '' }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('CreateUser with an empty name returns INVALID_ARGUMENT', async () => {
    await expect(promisify<any>((cb) => client.CreateUser({ name: '', email: 'x@example.com' }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('CreateUser with a whitespace-only name returns INVALID_ARGUMENT', async () => {
    await expect(promisify<any>((cb) => client.CreateUser({ name: '   ', email: 'x@example.com' }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('CreateUser with an invalid email returns INVALID_ARGUMENT', async () => {
    await expect(promisify<any>((cb) => client.CreateUser({ name: 'Bad Email', email: 'not-an-email' }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('CreateUser with a missing email returns INVALID_ARGUMENT', async () => {
    await expect(promisify<any>((cb) => client.CreateUser({ name: 'No Email', email: '' }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('ListUsers with a negative limit returns INVALID_ARGUMENT', async () => {
    await expect(promisify<any>((cb) => client.ListUsers({ limit: -1 }, cb))).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
    });
  });

  it('calling an unknown method returns UNIMPLEMENTED (code 12)', async () => {
    // Call a method path that is not in the proto, via a generic client.
    const generic = new grpc.Client(address, grpc.credentials.createInsecure());
    const serialize = (v: unknown) => Buffer.from(JSON.stringify(v));
    const deserialize = (b: Buffer) => JSON.parse(b.toString());
    await expect(
      new Promise((_resolve, reject) => {
        generic.makeUnaryRequest(
          '/users.UserService/DeleteUser',
          serialize, deserialize, { id: '1' },
          (err: any, res: any) => (err ? reject(err) : _resolve(res)),
        );
      }),
    ).rejects.toMatchObject({ code: grpc.status.UNIMPLEMENTED });
    generic.close();
  });
});
