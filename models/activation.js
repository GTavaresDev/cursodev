import crypto from "node:crypto";

import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";
import webserver from "infra/webserver.js";
import email from "models/email.js";
import user from "models/user.js";

const ACTIVATION_EMAIL_SUBJECT = "Ative sua conta no TabNews";
const ACTIVATED_EMAIL_SUBJECT = "Sua conta foi ativada no TabNews";
const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 1000; // 24 hours

async function findOneValidById(activationTokenId) {
  const activationTokenFound = await runSelectQuery(activationTokenId);

  return activationTokenFound;

  async function runSelectQuery(activationTokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userObject) {
  const activationToken = await createToken(userObject.id);
  const activationUrl = buildActivationUrl(activationToken.id);

  return await email.send({
    to: `${userObject.username} <${userObject.email}>`,
    subject: ACTIVATION_EMAIL_SUBJECT,
    text: `Olá ${userObject.username}, recebemos seu cadastro. Para ativar sua conta, acesse: ${activationUrl}`,
  });
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, {
    activation: "active",
    "read:session": true,
  });

  return activatedUser;
}

async function sendActivatedEmail(userObject) {
  return await email.send({
    to: `${userObject.username} <${userObject.email}>`,
    subject: ACTIVATED_EMAIL_SUBJECT,
    text: `Olá ${userObject.username}, sua conta foi ativada e já está pronta para usar o sistema.`,
  });
}

async function createToken(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const results = await database.query({
    text: `
      INSERT INTO
        user_activation_tokens (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;`,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function markTokenAsUsed(activationTokenId) {
  const results = await database.query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [activationTokenId],
  });

  return results.rows[0];
}

function buildActivationUrl(tokenId) {
  const activationUrl = new URL(
    `/api/v1/activations/${tokenId}`,
    webserver.origin,
  );

  return activationUrl.toString();
}

const activation = {
  ACTIVATION_EMAIL_SUBJECT,
  ACTIVATED_EMAIL_SUBJECT,
  EXPIRATION_IN_MILLISECONDS,
  activateUserByUserId,
  buildActivationUrl,
  create,
  createToken,
  findOneValidById,
  markTokenAsUsed,
  sendActivatedEmail,
};

export default activation;
