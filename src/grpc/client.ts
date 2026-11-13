import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '..', '..', 'proto', 'user.proto');

export function createUserClient(address: string): any {
  const def = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  });
  const proto: any = grpc.loadPackageDefinition(def);
  return new proto.users.UserService(address, grpc.credentials.createInsecure());
}

export function promisify<T>(fn: (cb: (err: any, res?: T) => void) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fn((err, res) => (err ? reject(err) : resolve(res as T)));
  });
}
