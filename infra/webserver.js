function getOrigin() {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    return "http://localhost:3000";
  }

  return "https://clone-tabnews.vercel.app";
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
