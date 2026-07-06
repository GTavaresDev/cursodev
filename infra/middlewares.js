import { UnauthorizedError, ValidationError } from "infra/errors.js";
import authentication from "models/authentication.js";
import authorization from "models/authorization.js";
import session from "models/session.js";
import user from "models/user.js";

function requireBodyFields({ requiredFields, allowedFields, minimumFields }) {
  return async function validateRequestBody(request, response, next) {
    const requestBody = request.body;

    if (!isPlainObject(requestBody)) {
      throw new ValidationError({
        message: "O corpo da requisição é obrigatório.",
        action: "Envie um JSON válido com os campos esperados.",
      });
    }

    if (
      typeof minimumFields === "number" &&
      Object.keys(requestBody).length < minimumFields
    ) {
      throw new ValidationError({
        message: "O corpo da requisição deve conter pelo menos um campo.",
        action: "Envie os campos necessários para realizar esta operação.",
      });
    }

    for (const fieldName of requiredFields) {
      assertRequiredStringField(requestBody, fieldName);
    }

    for (const fieldName of Object.keys(requestBody)) {
      if (!allowedFields.includes(fieldName)) {
        throw new ValidationError({
          message: `O campo \"${fieldName}\" não é permitido.`,
          action: "Remova campos inesperados e envie apenas os campos suportados.",
        });
      }

      assertOptionalStringField(requestBody, fieldName);
    }

    return next();
  };
}

async function requireSession(request, response, next) {
  const sessionToken = request.cookies.session_id;

  if (!sessionToken) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa.",
      action: "Verifique se este usuário está logado e tente novamente.",
    });
  }

  request.session = await session.findOneValidByToken(sessionToken);

  return next();
}

function canSessionRequest(featureName) {
  return async function canSessionRequestByFeature(request, response, next) {
    const authenticatedUser =
      request.authenticatedUser ??
      (await user.findOneById(request.session.user_id));

    if (!authorization.can(authenticatedUser, featureName)) {
      throw new UnauthorizedError({
        message: `Usuário não possui a feature "${featureName}".`,
        action: "Solicite a liberação desta feature e tente novamente.",
      });
    }

    request.authenticatedUser = authenticatedUser;

    return next();
  };
}

function canRequest(featureName) {
  return async function canRequestByFeature(request, response, next) {
    const { email, password } = request.body;
    const authenticatedUser = await authentication.getAuthenticatedUser(
      email,
      password,
    );

    if (!authorization.can(authenticatedUser, featureName)) {
      throw new UnauthorizedError({
        message: `Usuário não possui a feature \"${featureName}\".`,
        action: "Solicite a liberação desta feature e tente novamente.",
      });
    }

    request.authenticatedUser = authenticatedUser;

    return next();
  };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRequiredStringField(requestBody, fieldName) {
  if (!(fieldName in requestBody)) {
    throw new ValidationError({
      message: `O campo \"${fieldName}\" é obrigatório.`,
      action: "Inclua todos os campos obrigatórios no corpo da requisição.",
    });
  }

  assertStringField(requestBody, fieldName);
}

function assertOptionalStringField(requestBody, fieldName) {
  if (requestBody[fieldName] === undefined) {
    return;
  }

  assertStringField(requestBody, fieldName);
}

function assertStringField(requestBody, fieldName) {
  const fieldValue = requestBody[fieldName];

  if (typeof fieldValue !== "string" || fieldValue.trim() === "") {
    throw new ValidationError({
      message: `O campo \"${fieldName}\" deve ser uma string não vazia.`,
      action: "Revise os dados enviados e tente novamente.",
    });
  }
}

const middlewares = {
  canRequest,
  canSessionRequest,
  requireBodyFields,
  requireSession,
};

export default middlewares;