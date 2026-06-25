/**
 * wallet.test.js
 * Jest + Supertest integration tests for Demo-Credit API.
 *
 * Targets actual routes under /api/v1 as implemented in src/.
 */

/// <reference types="jest" />
import request from "supertest";
import axios from "axios";

import app from "./src/app";
import db from "./src/config/db";

jest.mock("axios");

// Helpers
const API_PREFIX = "/api/v1";
const mockAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

async function truncateTables() {
  // MySQL-safe order because of FK constraints.
  // transactions -> transfers -> idempotency_keys/users/wallets
  await db("transfers").del();
  await db("transactions").del();
  await db("idempotency_keys").del();
  await db("wallets").del();
  await db("users").del();
}

async function ensureSchema() {
  // Best-effort: if migrations aren’t run, tests will throw on first DB call.
}

beforeAll(async () => {
  await ensureSchema();
  await truncateTables();
});

afterEach(async () => {
  await truncateTables();
});

afterAll(async () => {
  await db.destroy();
});

describe("Auth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  });

  function mockKarmaNotBlacklisted() {
    mockAxiosGet.mockResolvedValue({ data: { isBlacklisted: false } });
  }

  it("POST /auth/register - positive: registers user and creates wallet", async () => {
    mockKarmaNotBlacklisted();

    const res = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "John",
        last_name: "Doe",
        email: `john-${Date.now()}@example.com`,
        password: "123456",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email");
    expect(res.body.user).not.toHaveProperty("password");

    // Wallet should be auto-created
    const me = await request(app)
      .get(`${API_PREFIX}/wallet/${res.body.user.id}`)
      .set("Authorization", `Bearer ${res.body.token}`);

    expect(me.status).toBe(200);
    expect(Number(me.body.wallet.balance)).toBeGreaterThanOrEqual(0);
  });

  it("POST /auth/register - negative: rejects duplicate email (409)", async () => {
    mockKarmaNotBlacklisted();

    const email = `dup-${Date.now()}@example.com`;

    const first = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({ first_name: "Ann", last_name: "Bob", email, password: "123456" });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "Cara",
        last_name: "Duke",
        email,
        password: "123456",
      });

    expect(second.status).toBe(409);
  });

  it("POST /auth/register - negative: rejects blacklisted user (403)", async () => {
    mockAxiosGet.mockResolvedValue({
      data: { isBlacklisted: true, reason: "blacklisted" },
    });

    const res = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "Jane",
        last_name: "Doe",
        email: `black-${Date.now()}@example.com`,
        password: "123456",
      });

    expect(res.status).toBe(403);
  });

  it("POST /auth/register - negative: missing required fields (400)", async () => {
    mockKarmaNotBlacklisted();

    const res = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "Jane",
        email: `missing-${Date.now()}@example.com`,
        password: "123456",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("POST /auth/register - negative: invalid email format (400)", async () => {
    mockKarmaNotBlacklisted();

    const res = await request(app).post(`${API_PREFIX}/auth/register`).send({
      first_name: "Jane",
      last_name: "Doe",
      email: "not-an-email",
      password: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("POST /auth/login - positive: login with valid credentials returns token", async () => {
    mockKarmaNotBlacklisted();

    const email = `login-${Date.now()}@example.com`;

    const register = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "John",
        last_name: "Doe",
        email,
        password: "123456",
      });

    expect(register.status).toBe(201);

    const res = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email, password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /auth/login - negative: wrong password (401)", async () => {
    mockKarmaNotBlacklisted();

    const email = `wrongpass-${Date.now()}@example.com`;

    await request(app).post(`${API_PREFIX}/auth/register`).send({
      first_name: "John",
      last_name: "Doe",
      email,
      password: "123456",
    });

    const res = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email, password: "wrong-pass" });

    expect(res.status).toBe(401);
  });

  it("POST /auth/login - negative: unknown email (404)", async () => {
    mockKarmaNotBlacklisted();

    const res = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email: `unknown-${Date.now()}@example.com`, password: "123456" });

    expect(res.status).toBe(404);
  });

  it("Protected endpoint - negative: without token and with invalid token (401)", async () => {
    mockKarmaNotBlacklisted();

    const email = `prot-${Date.now()}@example.com`;
    const register = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "John",
        last_name: "Doe",
        email,
        password: "123456",
      });

    const noToken = await request(app).get(
      `${API_PREFIX}/wallet/${register.body.user.id}`,
    );
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get(`${API_PREFIX}/wallet/${register.body.user.id}`)
      .set("Authorization", "Bearer invalid-token");

    expect(badToken.status).toBe(401);
  });
});

function makeUserRoutesHelpers() {
  function mockKarmaNotBlacklisted() {
    mockAxiosGet.mockResolvedValue({ data: { isBlacklisted: false } });
  }

  async function registerAndLogin({
    email,
    password = "123456",
  }: { email?: string; password?: string } = {}) {
    mockKarmaNotBlacklisted();

    const e =
      email ||
      `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    const register = await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({
        first_name: "User",
        last_name: "Test",
        email: e,
        password,
      });

    return {
      userId: register.body.user.id,
      token: register.body.token,
      email: e,
    };
  }

  return { registerAndLogin, mockKarmaNotBlacklisted };
}

describe("Wallet", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  });

  it("GET /wallet/:user_id - positive: returns wallet with balance", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    const res = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("wallet");
    expect(res.body.wallet).toHaveProperty("balance");
  });

  it("GET /wallet/:user_id - negative: wallet not found (404)", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    await db("wallets").where({ user_id: userId }).del();

    const res = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("POST /wallet/:user_id - fund positive: increases balance and creates FUND transaction", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    const before = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    const startBalance = Number(before.body.wallet.balance);

    const res = await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "fund-1")
      .send({ amount: 50.25 });

    expect(res.status).toBe(200);

    const after = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    const endBalance = Number(after.body.wallet.balance);
    expect(endBalance).toBeCloseTo(startBalance + 50.25, 2);

    const tx = await db("transactions")
      .where({ wallet_id: after.body.wallet.id, type: "FUND" })
      .first();

    expect(tx).toBeTruthy();
    expect(tx.type).toBe("FUND");
  });

  it("POST /wallet/:user_id - fund negative: rejects amount <= 0 (400) and invalid type (400)", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    const res1 = await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "fund-neg-1")
      .send({ amount: 0 });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "fund-neg-2")
      .send({ amount: "10" });
    expect(res2.status).toBe(400);
  });

  it("POST /wallet/:user_id - fund idempotency: duplicate key does not double-increment", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    const before = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    const startBalance = Number(before.body.wallet.balance);

    const key = "fund-idem";

    await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", key)
      .send({ amount: 20 });

    await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", key)
      .send({ amount: 20 });

    const after = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    const endBalance = Number(after.body.wallet.balance);
    expect(endBalance).toBeCloseTo(startBalance + 20, 2);

    const count = await db("transactions").where({
      wallet_id: after.body.wallet.id,
      type: "FUND",
    });
    expect(count.length).toBe(1);
  });

  it("POST /wallet/:user_id/withdraw positive: decreases balance and creates WITHDRAW transaction", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    await request(app)
      .post(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "fund-for-withdraw")
      .send({ amount: 100 });

    const before = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    const startBalance = Number(before.body.wallet.balance);

    const res = await request(app)
      .post(`${API_PREFIX}/wallet/${userId}/withdraw`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "wdr-1")
      .send({ amount: 30 });

    expect(res.status).toBe(200);

    const after = await request(app)
      .get(`${API_PREFIX}/wallet/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    const endBalance = Number(after.body.wallet.balance);
    expect(endBalance).toBeCloseTo(startBalance - 30, 2);

    const tx = await db("transactions")
      .where({ wallet_id: after.body.wallet.id, type: "WITHDRAW" })
      .first();
    expect(tx).toBeTruthy();
    expect(tx.type).toBe("WITHDRAW");
  });

  it("POST /wallet/:user_id/withdraw negative: insufficient balance (400)", async () => {
    const { registerAndLogin } = makeUserRoutesHelpers();
    const { userId, token } = await registerAndLogin();

    const res = await request(app)
      .post(`${API_PREFIX}/wallet/${userId}/withdraw`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "wdr-insuff")
      .send({ amount: 1 });

    expect(res.status).toBe(400);
  });
});

describe("Transfers", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    mockAxiosGet.mockResolvedValue({ data: { isBlacklisted: false } });
  });

  async function registerUser(emailSuffix: string) {
    const email = `tr-${emailSuffix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

    const reg = await request(app).post(`${API_PREFIX}/auth/register`).send({
      first_name: "Tom",
      last_name: "User",
      email,
      password: "123456",
    });

    return { userId: reg.body.user.id, token: reg.body.token, email };
  }

  it("POST /wallet/send positive: transfer updates balances and creates both transactions", async () => {
    const sender = await registerUser("sender");
    const receiver = await registerUser("receiver");

    await request(app)
      .post(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", "fund-sender-1")
      .send({ amount: 100 });

    const senderBefore = await request(app)
      .get(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`);
    const receiverBefore = await request(app)
      .get(`${API_PREFIX}/wallet/${receiver.userId}`)
      .set("Authorization", `Bearer ${receiver.token}`);

    const res = await request(app)
      .post(`${API_PREFIX}/wallet/send`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", "tr-1")
      .send({ receiverEmail: receiver.email, amount: 25.5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("reference");

    const senderAfter = await request(app)
      .get(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`);
    const receiverAfter = await request(app)
      .get(`${API_PREFIX}/wallet/${receiver.userId}`)
      .set("Authorization", `Bearer ${receiver.token}`);

    expect(Number(senderAfter.body.wallet.balance)).toBeCloseTo(
      Number(senderBefore.body.wallet.balance) - 25.5,
      2,
    );
    expect(Number(receiverAfter.body.wallet.balance)).toBeCloseTo(
      Number(receiverBefore.body.wallet.balance) + 25.5,
      2,
    );

    const senderTx = await db("transactions").where({
      wallet_id: senderAfter.body.wallet.id,
      type: "TRANSFER_OUT",
    });
    const receiverTx = await db("transactions").where({
      wallet_id: receiverAfter.body.wallet.id,
      type: "TRANSFER_IN",
    });

    expect(senderTx.length).toBeGreaterThanOrEqual(1);
    expect(receiverTx.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /wallet/send negative: insufficient balance (400)", async () => {
    const sender = await registerUser("sender-low");
    const receiver = await registerUser("receiver-low");

    const res = await request(app)
      .post(`${API_PREFIX}/wallet/send`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", "tr-insuff")
      .send({ receiverEmail: receiver.email, amount: 10 });

    expect(res.status).toBe(400);
  });

  it("POST /wallet/send - idempotency: duplicate key does not change balances twice", async () => {
    const sender = await registerUser("sender-idem");
    const receiver = await registerUser("receiver-idem");

    await request(app)
      .post(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", "fund-idem")
      .send({ amount: 50 });

    const senderBefore = await request(app)
      .get(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`);
    const receiverBefore = await request(app)
      .get(`${API_PREFIX}/wallet/${receiver.userId}`)
      .set("Authorization", `Bearer ${receiver.token}`);

    const key = "tr-idem";

    await request(app)
      .post(`${API_PREFIX}/wallet/send`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", key)
      .send({ receiverEmail: receiver.email, amount: 15 });

    const res2 = await request(app)
      .post(`${API_PREFIX}/wallet/send`)
      .set("Authorization", `Bearer ${sender.token}`)
      .set("Idempotency-Key", key)
      .send({ receiverEmail: receiver.email, amount: 15 });

    expect(res2.status).toBe(200);

    const senderAfter = await request(app)
      .get(`${API_PREFIX}/wallet/${sender.userId}`)
      .set("Authorization", `Bearer ${sender.token}`);
    const receiverAfter = await request(app)
      .get(`${API_PREFIX}/wallet/${receiver.userId}`)
      .set("Authorization", `Bearer ${receiver.token}`);

    expect(Number(senderAfter.body.wallet.balance)).toBeCloseTo(
      Number(senderBefore.body.wallet.balance) - 15,
      2,
    );
    expect(Number(receiverAfter.body.wallet.balance)).toBeCloseTo(
      Number(receiverBefore.body.wallet.balance) + 15,
      2,
    );

    const outTx = await db("transactions").where({
      wallet_id: senderAfter.body.wallet.id,
      type: "TRANSFER_OUT",
    });
    const inTx = await db("transactions").where({
      wallet_id: receiverAfter.body.wallet.id,
      type: "TRANSFER_IN",
    });

    expect(outTx.length).toBe(1);
    expect(inTx.length).toBe(1);
  });
});
