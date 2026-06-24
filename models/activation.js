import email from "models/email.js";

const ACTIVATION_EMAIL_SUBJECT = "Ative sua conta no TabNews";

async function create(userObject) {
  return await email.send({
    to: `${userObject.username} <${userObject.email}>`,
    subject: ACTIVATION_EMAIL_SUBJECT,
    text: `Olá ${userObject.username}, recebemos seu cadastro. Este é seu email de ativação.`,
  });
}

const activation = {
  ACTIVATION_EMAIL_SUBJECT,
  create,
};

export default activation;
