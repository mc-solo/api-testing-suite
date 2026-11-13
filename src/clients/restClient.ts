import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';

export function createRestClient(baseURL: string = config.restBaseUrl): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: config.defaultTimeoutMs,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    // Let tests assert on error statuses instead of axios throwing first.
    validateStatus: () => true,
  });
}

export const restClient = createRestClient();
