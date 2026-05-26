import { InternalServerError, MethodNotAllowedError } from "infra/erros.js";
function OnNoMatchHandler(req, res) {
  const publicErrorMessage = new MethodNotAllowedError();
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}

function onErrorHandler(err, req, res) {
  const publicErrorMessage = new InternalServerError({
    cause: err,
    statusCode: err.statusCode ?? undefined,
  });
  console.error(publicErrorMessage);
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}

const controller = {
  errorHandlers: {
    onNoMatch: OnNoMatchHandler,
    onError: onErrorHandler,
  },
};
export default controller;
