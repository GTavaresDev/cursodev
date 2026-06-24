import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import activation from "models/activation.js";

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();
}

async function waitForWebServer() {
  return retry(fetchStatusPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchStatusPage() {
    const response = await fetch("http://localhost:3000/api/v1/status");

    if (response.status !== 200) {
      throw Error();
    }
  }
}

async function waitForEmailServer() {
  return retry(fetchEmailServerMessages, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchEmailServerMessages() {
    const response = await fetch("http://localhost:1080/messages");

    if (response.status !== 200) {
      throw Error();
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validpassword",
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function createActivation(userObject) {
  return await activation.create(userObject);
}

function extractUUID(text) {
  const uuidFound = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );

  return uuidFound?.[0];
}

const orchestrator = {
  waitForAllServices,
  waitForWebServer,
  waitForEmailServer,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  createActivation,
  extractUUID,
};

export default orchestrator;
