const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
  if (!SECRET) {
    return res.status(500).json({
      error: "JWT_SECRET não configurado",
    });
  }

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token não enviado",
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {

    const decoded =
      jwt.verify(token, SECRET);

    req.usuarioId = decoded.id;

    next();

  } catch (error) {

    return res.status(401).json({
      error: "Token inválido",
    });

  }
}

module.exports = auth;