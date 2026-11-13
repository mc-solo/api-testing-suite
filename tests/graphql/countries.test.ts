import { describe, it, expect } from 'vitest';
import { graphqlRequest } from '../../src/clients/graphqlClient';
import { countrySchema, continentSchema } from '../../src/schemas/graphqlSchemas';

describe('GraphQL - Countries API (https://countries.trevorblades.com)', () => {
  it('query country by code returns Ethiopia (ET)', async () => {
    const { status, body } = await graphqlRequest<{ country: any }>(
      `query { country(code: "ET") { code name capital currency } }`,
    );
    expect(status).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.country.name).toBe('Ethiopia');
    expect(body.data?.country.capital).toBe('Addis Ababa');
    expect(body.data?.country.code).toBe('ET');
  });

  it('query country validates the full schema including continent and languages', async () => {
    const { status, body } = await graphqlRequest<{ country: any }>(
      `query { country(code: "ET") { code name capital currency continent { code name } languages { code name } } }`,
    );
    expect(status).toBe(200);
    expect(() => countrySchema.parse(body.data?.country)).not.toThrow();
    expect(body.data?.country.continent.code).toBe('AF');
  });

  it('query with variables returns the requested country', async () => {
    const { status, body } = await graphqlRequest<{ country: any }>(
      `query GetCountry($code: ID!) { country(code: $code) { code name capital } }`,
      { code: 'US' },
    );
    expect(status).toBe(200);
    expect(body.data?.country.name).toBe('United States');
    expect(body.data?.country.capital).toBe('Washington D.C.');
  });

  it('query with variables for GB returns United Kingdom', async () => {
    const { body } = await graphqlRequest<{ country: any }>(
      `query GetCountry($code: ID!) { country(code: $code) { code name } }`,
      { code: 'GB' },
    );
    expect(body.data?.country.name).toBe('United Kingdom');
  });

  it('query countries filtered by continent AF returns only African countries', async () => {
    const { status, body } = await graphqlRequest<{ countries: any[] }>(
      `query { countries(filter: { continent: { eq: "AF" } }) { code name continent { code } } }`,
    );
    expect(status).toBe(200);
    expect(body.data?.countries.length).toBeGreaterThan(40);
    expect(body.data?.countries.every((c) => c.continent.code === 'AF')).toBe(true);
    expect(body.data?.countries.some((c) => c.code === 'ET')).toBe(true);
  });

  it('query continents returns a list with valid schemas', async () => {
    const { status, body } = await graphqlRequest<{ continents: any[] }>(
      `query { continents { code name } }`,
    );
    expect(status).toBe(200);
    expect(body.data?.continents.length).toBeGreaterThanOrEqual(7);
    for (const c of body.data!.continents) expect(() => continentSchema.parse(c)).not.toThrow();
    expect(body.data?.continents.some((c) => c.code === 'AF')).toBe(true);
  });

  it('query languages returns entries with code and name', async () => {
    const { status, body } = await graphqlRequest<{ languages: any[] }>(
      `query { languages { code name } }`,
    );
    expect(status).toBe(200);
    expect(body.data?.languages.length).toBeGreaterThan(50);
    expect(body.data?.languages.every((l) => typeof l.code === 'string' && typeof l.name === 'string')).toBe(true);
  });

  it('field-level check: country capital and currency are strings or null, never numbers', async () => {
    const { body } = await graphqlRequest<{ country: any }>(
      `query { country(code: "JP") { name capital currency } }`,
    );
    expect(body.data?.country.name).toBe('Japan');
    expect(typeof body.data?.country.capital === 'string' || body.data?.country.capital === null).toBe(true);
    expect(typeof body.data?.country.currency === 'string' || body.data?.country.currency === null).toBe(true);
  });

  it('query for an unknown country code returns null data, not an error', async () => {
    const { status, body } = await graphqlRequest<{ country: any }>(
      `query { country(code: "XX") { code name } }`,
    );
    expect(status).toBe(200);
    expect(body.data?.country).toBeNull();
  });

  it('malformed query returns a GraphQL errors array', async () => {
    const { status, body } = await graphqlRequest(`query { country(code: "ET") { `);
    expect(status).toBe(400);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors![0].message.length).toBeGreaterThan(0);
  });

  it('query for a non-existent field returns errors', async () => {
    const { body } = await graphqlRequest(`query { country(code: "ET") { doesNotExist } }`);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors![0].message).toContain('doesNotExist');
  });

  it('query missing a required variable returns errors', async () => {
    const { body } = await graphqlRequest(
      `query GetCountry($code: ID!) { country(code: $code) { name } }`,
      {},
    );
    expect(Array.isArray(body.errors)).toBe(true);
  });

  it('query with a wrong variable type returns errors', async () => {
    const { body } = await graphqlRequest<{ country: any }>(
      `query GetCountry($code: ID!) { country(code: $code) { name } }`,
      { code: 12345 },
    );
    // The API coerces some scalars; accept either a clean error or a null result, never a crash.
    if (!body.errors) expect(body.data?.country).toBeNull();
    else expect(Array.isArray(body.errors)).toBe(true);
  });

  it('empty query body returns errors', async () => {
    const { body } = await graphqlRequest('');
    expect(Array.isArray(body.errors)).toBe(true);
  });
});
