const mongoose = require("mongoose");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  picture: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ["password", "google", "github"],
    default: "password",
  },
  providerId: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  profile: {
    skills: [
      {
        type: String,
      },
    ],
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    experience: {
      type: String,
    },
    social: {
      linkedin: String,
      github: String,
      twitter: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({}).select(
      "email name authProvider emailVerified"
    );
    console.log("Users in database:");
    console.log(users);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkUsers();
