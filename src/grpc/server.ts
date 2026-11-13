import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

export interface User { id: string; name: string; email: string; }

const PROTO_PATH = path.join(__dirname, '..', '..', 'proto', 'user.proto');

function loadProto() {
  const def = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  });
  return grpc.loadPackageDefinition(def) as any;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createServer(): { server: grpc.Server; users: Map<string, User> } {
  const users = new Map<string, User>([
    ['1', { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' }],
    ['2', { id: '2', name: 'Alan Turing', email: 'alan@example.com' }],
  ]);
  let nextId = 3;
  const proto = loadProto();

  const service = {
    GetUser: (call: any, callback: any) => {
      const id = String(call.request?.id ?? '').trim();
      if (!id) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'id is required' });
      }
      const user = users.get(id);
      if (!user) {
        return callback({ code: grpc.status.NOT_FOUND, details: `user ${id} not found` });
      }
      callback(null, user);
    },
    CreateUser: (call: any, callback: any) => {
      const name = String(call.request?.name ?? '').trim();
      const email = String(call.request?.email ?? '').trim();
      if (!name) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'name is required' });
      }
      if (!email || !isValidEmail(email)) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'email must be a valid email address' });
      }
      const user: User = { id: String(nextId++), name, email };
      users.set(user.id, user);
      callback(null, user);
    },
    ListUsers: (call: any, callback: any) => {
      const limit = Number(call.request?.limit ?? 0);
      if (limit < 0) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'limit must not be negative' });
      }
      const all = [...users.values()];
      callback(null, { users: limit > 0 ? all.slice(0, limit) : all });
    },
  };

  const server = new grpc.Server();
  server.addService(proto.users.UserService.service, service);
  return { server, users };
}

export async function startTestServer(port = '127.0.0.1:0'): Promise<{ server: grpc.Server; address: string }> {
  const { server } = createServer();
  const address = await new Promise<string>((resolve, reject) => {
    server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
      if (err) return reject(err);
      resolve(`127.0.0.1:${boundPort}`);
    });
  });
  return { server, address };
}

if (require.main === module) {
  const { server } = createServer();
  server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log('Local sample UserService listening on 127.0.0.1:50051');
  });
}
