interface PagesFunctionContext {
  request: Request;
}

export async function onRequest(context: PagesFunctionContext) {
  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    'http://realskyguard.runasp.net'
  );

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  return fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.body,
    redirect: 'manual',
  });
}
