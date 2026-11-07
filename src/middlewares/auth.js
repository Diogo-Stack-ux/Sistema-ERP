
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");

const { getAuth } = require("../lib/firebaseAdmin");
const prisma = require("../lib/prisma");

const SECRET = process.env.JWT_SECRET;

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token nao enviado ou formato invalido",
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: "Token nao enviado",
    });
  }

  try {
    let usuario = null;
    let firebaseUid = null;

    // 1. Verifica se o token pertence ao Firebase
    if (process.env.FIREBASE_PROJECT_ID) {
      try {
        const firebaseUser = await getAuth().verifyIdToken(token);

        if (!firebaseUser.email || !firebaseUser.email_verified) {
          return res.status(401).json({
            error: "Conta Firebase sem email verificado",
          });
        }

        firebaseUid = firebaseUser.uid;

        usuario = await prisma.usuario.findUnique({
          where: { email: firebaseUser.email },
          include: { empresa: true },
        });

        if (!usuario || !usuario.empresa) {
          const nomeEmpresa =
            firebaseUser.name?.trim() || firebaseUser.email.split("@")[0];

          try {
            usuario = await prisma.$transaction(async (tx) => {
              const existente = await tx.usuario.findUnique({
                where: { email: firebaseUser.email },
                include: { empresa: true },
              });

              if (existente?.empresa) {
                return existente;
              }

              if (existente) {
                return tx.usuario.update({
                  where: { id: existente.id },
                  data: {
                    empresa: {
                      create: { nome: nomeEmpresa },
                    },
                  },
                  include: { empresa: true },
                });
              }

              const senha = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

              return tx.usuario.create({
                data: {
                  nome: firebaseUser.name || nomeEmpresa,
                  email: firebaseUser.email,
                  senha,
                  empresa: {
                    create: { nome: nomeEmpresa },
                  },
                },
                include: { empresa: true },
              });
            });
          } catch (error) {
            if (error.code !== "P2002") {
              throw error;
            }

            usuario = await prisma.usuario.findUnique({
              where: { email: firebaseUser.email },
              include: { empresa: true },
            });

            if (!usuario?.empresa) {
              throw error;
            }
          }
        }
      } catch (error) {
        // Se o Firebase rejeitar o token, tenta JWT local.
        // Erros de acesso apos validacao nao devem cair aqui.
        if (usuario || firebaseUid) {
          throw error;
        }
      }
    }

    // 2. Verifica JWT local
    if (!usuario) {
      if (!SECRET) {
        return res.status(500).json({
          error: "JWT_SECRET nao configurado",
        });
      }

      const decoded = jwt.verify(token, SECRET, {
        algorithms: ["HS256"],
      });

      usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        include: { empresa: true },
      });
    }

    if (!usuario) {
      return res.status(401).json({
        error: "Usuario nao encontrado",
      });
    }

    // 3. Verifica vinculo com empresa
    if (!usuario.empresaId || !usuario.empresa) {
      return res.status(403).json({
        error: "Usuario nao vinculado a uma empresa",
      });
    }

    if (!usuario.empresa.ativo) {
      return res.status(403).json({
        error: "Empresa desativada",
      });
    }

    // 4. Disponibiliza identidade autenticada
    req.usuarioId = usuario.id;
    req.usuarioEmail = usuario.email;
    req.empresaId = usuario.empresaId;

    if (firebaseUid) {
      req.firebaseUid = firebaseUid;
    }

    return next();
  } catch (error) {
    console.error("Falha na autenticacao:", error.message);

    return res.status(401).json({
      error: "Token invalido ou expirado",
    });
  }
}

module.exports = auth;
