(async () => {
  try {
    const userService = (await import("./models/user.js")).default;
    const user = await userService.findOneByUsername("testuser");
    console.log("user:", user);
  } catch (err) {
    console.error("error calling findOneByUsername:", err);
  }
})();
