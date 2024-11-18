const express = require("express");
const bodyParser = require("body-parser");
const admin = require("./firebase.js");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const { initializeApp } = require("firebase/app");

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const app = express();
app.use(bodyParser.json());

// Middlewares
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.tatus(403).json({ message: "Forbidden: Invalid or expired token" });
  }
};

// Routes
app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Firebase Auth",
  });
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      message: "Email and password are required",
    });

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    res.status(201).json({
      message: "User registered successfully",
      uid: userCredential.user.uid,
    });
  } catch (error) {
    res.status(400).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();
    res.status(200).json({ message: "Login successful", token: idToken });
  } catch (error) {
    res.status(400).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = [];
    let nextPageToken;

    do {
      const userRecords = await admin.auth().listUsers(1000, nextPageToken);
      userRecords.users.forEach((user) => {
        users.push({
          uid: user.uid,
          email: user.email,
        });
      });
    } while (nextPageToken);

    res.status(200).json({
      message: "Fetch all users successful",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Fetch all users failed",
      error: error.message,
    });
  }
});

const HOST = process.env.LOCALHOST || "localhost";
const PORT = process.env.PORT || 3000;

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
