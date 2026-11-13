import axios from 'axios';
import { config } from '../config';

export interface GraphQLResponse<T = unknown> {
  data?: T | null;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  url: string = config.graphqlUrl,
): Promise<{ status: number; body: GraphQLResponse<T> }> {
  const res = await axios.post<GraphQLResponse<T>>(url, { query, variables }, {
    timeout: config.defaultTimeoutMs,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });
  return { status: res.status, body: res.data };
}
