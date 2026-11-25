import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('Muse DELETE requires bearer auth and a scoped listing UUID', async (t) => {
  const originalServe = Deno.serve;
  const originalGet = Deno.env.get;
  const originalFetch = globalThis.fetch;
  let handler: ((req: Request) => Promise<Response>) | undefined;
  let databaseCalls = 0;
  let databaseResult: unknown = { id: '00000000-0000-4000-8000-000000000001' };
  let databaseStatus = 200;
  const id = '00000000-0000-4000-8000-000000000001';
  const secret = 'unit-test-only';
  try {
    // Capture the real deployed handler, while isolating database access.
    Deno.serve = ((callback: typeof handler) => { handler = callback; return {}; }) as typeof Deno.serve;
    Deno.env.get = (name: string) => ({
      MUSE_API_TOKEN: secret,
      SUPABASE_URL: 'https://database.example.test',
      SUPABASE_SERVICE_ROLE_KEY: 'unit-test-key',
    }[name]);
    globalThis.fetch = async (input, init) => {
      databaseCalls++;
      const url = new URL(String(input));
      assertEquals(url.pathname, '/rest/v1/listings');
      assertEquals(url.searchParams.get('id'), `eq.${id}`);
      assertEquals(url.searchParams.get('select'), 'id');
      assertEquals(init && 'method' in init ? init.method : undefined, 'DELETE');
      return new Response(JSON.stringify(databaseResult), {
        status: databaseStatus,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    await import('./index.ts');
    if (!handler) throw new Error('Handler was not registered');
    const request = (suffix: string, token?: string) => new Request(
      `https://function.example.test/functions/v1/muse-admin${suffix}`,
      { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    await t.step('missing and wrong tokens cannot delete', async () => {
      if (!handler) throw new Error('Missing handler');
      assertEquals((await handler(request(`/listings/${id}`))).status, 401);
      assertEquals((await handler(request(`/listings/${id}`, 'wrong'))).status, 401);
      assertEquals(databaseCalls, 0);
    });
    await t.step('collection and invalid IDs cannot delete', async () => {
      if (!handler) throw new Error('Missing handler');
      for (const suffix of ['/listings', '/listings?id=' + id, '/listings/not-a-uuid']) {
        assertEquals((await handler(request(suffix, secret))).status, 400);
      }
      assertEquals(databaseCalls, 0);
    });
    await t.step('authenticated deletion returns the deleted ID without a body', async () => {
      if (!handler) throw new Error('Missing handler');
      const response = await handler(request(`/listings/${id}`, secret));
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { deleted: true, id });
      assertEquals(databaseCalls, 1);
    });
    await t.step('missing listing returns 404', async () => {
      if (!handler) throw new Error('Missing handler');
      databaseResult = null;
      assertEquals((await handler(request(`/listings/${id}`, secret))).status, 404);
    });
    await t.step('database failure returns 500', async () => {
      if (!handler) throw new Error('Missing handler');
      databaseStatus = 400;
      databaseResult = { message: 'test failure', code: '23503' };
      assertEquals((await handler(request(`/listings/${id}`, secret))).status, 500);
    });
  } finally {
    Deno.serve = originalServe;
    Deno.env.get = originalGet;
    globalThis.fetch = originalFetch;
  }
});