import assert from "node:assert/strict";
import http from "node:http";
import { startAppServer } from "../src/app-server-core.js";

const { server, port } = await startAppServer({ port: 0 });

try {
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
} finally {
  await closeServer(server);
}

const blocker = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("occupied");
});

await new Promise(resolve => blocker.listen(0, "127.0.0.1", resolve));

try {
  const address = blocker.address();
  const blockedPort = typeof address === "object" && address ? address.port : 0;
  const fallback = await startAppServer({
    port: blockedPort,
    fallbackToRandomPort: true
  });

  try {
    assert.notEqual(fallback.port, blockedPort);

    const response = await fetch(`http://127.0.0.1:${fallback.port}/api/health`);
    assert.equal(response.status, 200);
  } finally {
    await closeServer(fallback.server);
  }
} finally {
  await closeServer(blocker);
}

console.log("app server smoke test passed");

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
