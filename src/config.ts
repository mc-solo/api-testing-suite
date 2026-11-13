export const config = {
  restBaseUrl: process.env.REST_BASE_URL ?? 'https://jsonplaceholder.typicode.com',
  graphqlUrl: process.env.GRAPHQL_URL ?? 'https://countries.trevorblades.com',
  grpcAddress: process.env.GRPC_ADDRESS ?? '127.0.0.1:50051',
  defaultTimeoutMs: 30000,
} as const;
