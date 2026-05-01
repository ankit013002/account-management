import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const port = Number(process.env.TEST_PORT ?? 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const dbName = `account-management-test-${process.pid}-${Date.now()}`;
const mongoUri = process.env.TEST_MONGODB_URI ?? `mongodb://127.0.0.1:27017/${dbName}`;
const encryptionKey =
  process.env.TEST_ENCRYPTION_KEY ??
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let server;

function runMongosh(script) {
  const result = spawnSync("mongosh", [mongoUri, "--quiet", "--eval", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      MONGOSH_DISABLE_TELEMETRY: "1",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `mongosh failed:\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
  }

  return result.stdout.trim();
}

function readStoredAccount(id) {
  const output = runMongosh(
    `const doc = db.accounts.findOne({ id: ${JSON.stringify(id)} }, { _id: 0 }); print(JSON.stringify(doc));`,
  );
  return JSON.parse(output.split(/\r?\n/).at(-1));
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function waitForServer() {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < 45_000) {
    try {
      const res = await fetch(`${baseUrl}/api/accounts`);
      if (res.ok) return;
      lastError = new Error(`server returned ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }

  throw new Error(`Next dev server did not become ready: ${lastError}`);
}

test.before(async () => {
  runMongosh("db.dropDatabase();");

  const nextBin = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  server = spawn(
    process.execPath,
    [nextBin, "dev", "-p", String(port), "-H", "127.0.0.1"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
        ENCRYPTION_KEY: encryptionKey,
        OLLAMA_URL: "http://127.0.0.1:11434",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.setEncoding("utf8");
  server.stderr.setEncoding("utf8");
  server.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`Next dev server exited with code ${code}`);
    }
    if (signal) {
      console.error(`Next dev server exited with signal ${signal}`);
    }
  });

  await waitForServer();
});

test.after(async () => {
  try {
    runMongosh("db.dropDatabase();");
  } finally {
    if (server && !server.killed) {
      server.kill();
      await Promise.race([once(server, "exit"), delay(5_000)]);
    }
  }
});

test("rejects account creation without a name", async () => {
  const { response, body } = await request("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ username: "missing-name" }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "Account name is required");
});

test("rejects account creation with an invalid category", async () => {
  const { response, body } = await request("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ name: "Invalid Category", category: "travel" }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "Invalid category");
});

test("creates, reads, updates, and deletes an account using MongoDB", async () => {
  const plainPassword = "CorrectHorseBatteryStaple!42";

  const created = await request("/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      name: "GitHub",
      username: "octo-user",
      email: "octo@example.com",
      password: plainPassword,
      url: "https://github.com",
      category: "work",
      notes: "Test account",
      tags: ["critical", "developer"],
      recoveryEmail: "recover@example.com",
      backupCodes: "111111\n222222",
      twoFactorEnabled: true,
    }),
  });

  assert.equal(created.response.status, 201);
  assert.equal(created.body.name, "GitHub");
  assert.equal(created.body.hasPassword, true);
  assert.equal(created.body.password, undefined);
  assert.deepEqual(created.body.tags, ["critical", "developer"]);
  assert.equal(created.body.recoveryEmail, "recover@example.com");
  assert.equal(created.body.backupCodes, "111111\n222222");
  assert.equal(created.body.twoFactorEnabled, true);
  assert.equal(created.body.favorite, false);

  const stored = readStoredAccount(created.body.id);
  assert.equal(stored.name, "GitHub");
  assert.deepEqual(stored.tags, ["critical", "developer"]);
  assert.equal(stored.recoveryEmail, "recover@example.com");
  assert.equal(stored.twoFactorEnabled, true);
  assert.notEqual(stored.password, plainPassword);
  assert.match(stored.password, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

  const list = await request("/api/accounts");
  assert.equal(list.response.status, 200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].id, created.body.id);
  assert.equal(list.body[0].hasPassword, true);
  assert.equal(list.body[0].password, undefined);

  const detail = await request(`/api/accounts/${created.body.id}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.password, plainPassword);

  const updated = await request(`/api/accounts/${created.body.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "GitHub Enterprise",
      notes: "Updated without sending a password",
      favorite: true,
    }),
  });

  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.name, "GitHub Enterprise");
  assert.equal(updated.body.favorite, true);
  assert.equal(updated.body.password, undefined);

  const detailAfterUpdate = await request(`/api/accounts/${created.body.id}`);
  assert.equal(detailAfterUpdate.response.status, 200);
  assert.equal(detailAfterUpdate.body.password, plainPassword);
  assert.equal(detailAfterUpdate.body.notes, "Updated without sending a password");
  assert.equal(detailAfterUpdate.body.favorite, true);

  const backup = await request("/api/backup");
  assert.equal(backup.response.status, 200);
  assert.equal(backup.body.algorithm, "aes-256-gcm");
  assert.equal(typeof backup.body.data, "string");
  assert.equal(JSON.stringify(backup.body).includes(plainPassword), false);

  const deleted = await request(`/api/accounts/${created.body.id}`, {
    method: "DELETE",
  });
  assert.equal(deleted.response.status, 200);
  assert.deepEqual(deleted.body, { success: true });

  const missing = await request(`/api/accounts/${created.body.id}`);
  assert.equal(missing.response.status, 404);

  const remaining = runMongosh("print(db.accounts.countDocuments({}));");
  assert.equal(Number(remaining.split(/\r?\n/).at(-1)), 0);

  const restored = await request("/api/backup", {
    method: "POST",
    body: JSON.stringify(backup.body),
  });
  assert.equal(restored.response.status, 200);
  assert.equal(restored.body.imported, 1);

  const restoredDetail = await request(`/api/accounts/${created.body.id}`);
  assert.equal(restoredDetail.response.status, 200);
  assert.equal(restoredDetail.body.name, "GitHub Enterprise");
  assert.equal(restoredDetail.body.password, plainPassword);
  assert.equal(restoredDetail.body.favorite, true);

  const auditCount = runMongosh("print(db.audit_events.countDocuments({}));");
  assert.ok(Number(auditCount.split(/\r?\n/).at(-1)) >= 5);
});
