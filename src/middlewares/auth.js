const jwt = require("jsonwebtoken");

const SECRET = "segredo_super_secreto";

function auth(req, res, next) {

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