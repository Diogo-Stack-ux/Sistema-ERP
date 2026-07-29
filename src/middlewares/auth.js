const jwt = require("jsonwebtoken");

const { getAuth } = require("../lib/firebaseAdmin");
const prisma = require("../lib/prisma");

const SECRET = process.env.JWT_SECRET;

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token nao enviado",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token nao enviado",
    });
  }

  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      const firebaseUser = await getAuth().verifyIdToken(token);
      const email = firebaseUser.email;

      if (!email) {
        return res.status(401).json({
          error: "Token Firebase sem email",
        });
      }

      const usuario = await prisma.usuario.upsert({
        where: { email },
        update: {
          nome: firebaseUser.name || email,
        },
        create: {
          nome: firebaseUser.name || email,
          email,
          senha: `firebase:${firebaseUser.uid}`,
        },
      });

      req.usuarioId = usuario.id;
      req.usuarioEmail = usuario.email;
      req.firebaseUid = firebaseUser.uid;

      return next();
    }

    if (!SECRET) {
      return res.status(500).json({
        error: "JWT_SECRET nao configurado",
      });
    }

    const decoded = jwt.verify(token, SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });

    req.usuarioId = decoded.id;
    req.usuarioEmail = usuario?.email;

    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Token invalido",
      detail: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}

module.exports = auth;
