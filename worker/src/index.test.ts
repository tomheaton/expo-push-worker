import type { UnstableDevWorker } from "wrangler";
import { unstable_dev } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Worker", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {}, { disableExperimentalWarning: true });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("should return 200 response", async () => {
    const req = new Request("http://falcon", { method: "GET" });
    // @ts-ignore TODO: fix this
    const resp = await worker.fetch(req);
    expect(resp.status).toBe(200);

    const text = await resp.text();
    expect(text).toBe("request method: GET");
  });
});
