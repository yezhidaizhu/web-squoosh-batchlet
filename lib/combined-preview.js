const http = require('http');
const net = require('net');
const handler = require('serve-handler');

const port = Number(process.env.PORT || 4175);
const seoPort = Number(process.env.SEO_PORT || 4321);
const seoPrefix = '/squoosh-batch-image-compressor';

const isSeoRequest = (url = '/') => {
  const pathname = new URL(url, 'http://localhost').pathname;
  return pathname === seoPrefix || pathname.startsWith(`${seoPrefix}/`);
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
  if (!isSeoRequest(request.url)) {
    return handler(request, response, { public: 'build' });
  }

  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: seoPort,
      path: request.url,
      method: request.method,
      headers: { ...request.headers, host: `localhost:${seoPort}` },
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
    response.end('SEO preview is not running on port 4321.');
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
