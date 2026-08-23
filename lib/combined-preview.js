const http = require('http');
const net = require('net');

const port = Number(process.env.PORT || 4175);
const appPort = Number(process.env.APP_PORT || 3010);
const seoPort = Number(process.env.SEO_PORT || 4321);
const seoPrefix = '/app';
const seoDevPrefixes = [
  '/@fs/',
  '/@id/',
  '/@vite/',
  '/_astro/',
  '/node_modules/',
  '/src/',
];
const isSeoRequest = (url = '/') => {
  const pathname = new URL(url, 'http://localhost').pathname;
  return (
    pathname === seoPrefix ||
    pathname.startsWith(`${seoPrefix}/`) ||
    seoDevPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
};

const serveSeo404 = (response) => {
  http
    .get(
      {
        hostname: '127.0.0.1',
        port: seoPort,
        path: `${seoPrefix}/404.html`,
        headers: { host: `localhost:${seoPort}` },
      },
      (notFoundResponse) => {
        response.writeHead(404, notFoundResponse.headers);
        notFoundResponse.pipe(response);
      },
    )
    .on('error', () => {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Page not found.');
    });
};

const server = http.createServer((request, response) => {
  const upstreamPort = isSeoRequest(request.url) ? seoPort : appPort;

  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: upstreamPort,
      path: request.url,
      method: request.method,
      headers: { ...request.headers, host: `localhost:${upstreamPort}` },
    },
    (proxyResponse) => {
      if (
        proxyResponse.statusCode === 404 &&
        !request.url.startsWith(`${seoPrefix}/404`)
      ) {
        proxyResponse.resume();
        serveSeo404(response);
        return;
      }
      response.writeHead(
        proxyResponse.statusCode || 502,
        proxyResponse.headers,
      );
      proxyResponse.pipe(response);
    },
  );

  proxy.on('error', () => {
    response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`Preview upstream is not running on port ${upstreamPort}.`);
  });
  request.pipe(proxy);
});

server.on('upgrade', (request, socket, head) => {
  const upstream = net.connect(seoPort, '127.0.0.1', () => {
    const headers = Object.entries(request.headers)
      .map(([name, value]) => `${name}: ${value}`)
      .join('\r\n');
    upstream.write(
      `${request.method} ${request.url} HTTP/1.1\r\n${headers}\r\n\r\n`,
    );
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });

  upstream.on('error', () => socket.destroy());
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Combined preview: http://localhost:${port}`);
});
