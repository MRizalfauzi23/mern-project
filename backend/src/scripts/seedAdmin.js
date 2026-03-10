import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const adminName = process.env.ADMIN_NAME || "Admin";
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "password123";

async function seedAdmin() {
  await connectDB();

  let user = await User.findOne({ email: adminEmail }).select("+password");

  if (!user) {
    user = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    });
    await user.save();
    // eslint-disable-next-line no-console
    console.log(`Admin created: ${adminEmail}`);
    return;
  }

  user.name = adminName;
  user.role = "admin";
  user.password = adminPassword;
  user.refreshToken = null;
  await user.save();
  // eslint-disable-next-line no-console
  console.log(`Admin updated: ${adminEmail}`);
}

seedAdmin()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to seed admin:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });

