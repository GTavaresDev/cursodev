const SESSION_COOKIE_NAME = "session_id";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 15;

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((cookiePart) => {
      const [key, ...valueParts] = cookiePart.trim().split("=");
      return [key, decodeURIComponent(valueParts.join("="))];
    }),
  );
}

function getSessionTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  );
}

export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  clearSessionCookie,
  getSessionTokenFromRequest,
  parseCookies,
  setSessionCookie,
};
