const bcrypt = require("bcryptjs");

async function run() {
  const password = "Admin@123";
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
}

run();