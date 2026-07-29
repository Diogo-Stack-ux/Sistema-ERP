const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!getApps().length && projectId) {
  const options = {
    projectId,
  };

  if (clientEmail && privateKey) {
    options.credential = cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  initializeApp(options);
}

module.exports = {
  getAuth,
};
