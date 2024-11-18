const admin = require("firebase-admin");

const serviceAccount = require("./auth-firebase-15c16-firebase-adminsdk-7mpxe-193eeedfc0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
