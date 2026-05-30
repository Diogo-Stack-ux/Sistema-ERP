const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = "segredo_super_secreto";

const gerarToken = (usuario) =>
  jwt.sign(
    {
      id: usuario.id,
    },
    SECRET,
    {
      expiresIn: "7d",
    }
  );

// REGISTER
router.post("/register", async (req, res) => {

  try {

    const { nome, email, senha } = req.body;

    const usuarioExiste =
      await prisma.usuario.findUnique({
        where: { email },
      });

    if (usuarioExiste) {
      return res
        .status(400)
        .json({
          error: "Usuário já existe",
        });
    }

    const senhaHash =
      await bcrypt.hash(senha, 10);

    const usuario =
      await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
        },
      });

    res.json(usuario);

  } catch (error) {

    res.status(500).json({
      error: error.message,
    });

  }
});


// LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, senha } = req.body;

    const usuario =
      await prisma.usuario.findUnique({
        where: { email },
      });

    if (!usuario) {
      return res
        .status(400)
        .json({
          error: "Usuário não encontrado",
        });
    }

    const senhaValida =
      await bcrypt.compare(
        senha,
        usuario.senha
      );

    if (!senhaValida) {
      return res
        .status(400)
        .json({
          error: "Senha inválida",
        });
    }

    const token = gerarToken(usuario);

    res.json({
      token,
      usuario,
    });

  } catch (error) {

    res.status(500).json({
      error: error.message,
    });

  }
});

// LOGIN COM GOOGLE
router.post("/google", async (req, res) => {

  try {

    const { credential } = req.body;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return res.status(500).json({
        error: "Login com Google nao configurado",
      });
    }

    if (!credential) {
      return res.status(400).json({
        error: "Credencial do Google nao enviada",
      });
    }

    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleResponse.ok) {
      return res.status(401).json({
        error: "Credencial do Google invalida",
      });
    }

    const googleUser = await googleResponse.json();

    if (
      googleUser.aud !== googleClientId ||
      !["true", true].includes(googleUser.email_verified)
    ) {
      return res.status(401).json({
        error: "Conta Google nao verificada",
      });
    }

    let usuario = await prisma.usuario.findUnique({
      where: { email: googleUser.email },
    });

    if (!usuario) {
      const senhaHash = await bcrypt.hash(
        `google:${googleUser.sub}`,
        10
      );

      usuario = await prisma.usuario.create({
        data: {
          nome: googleUser.name || googleUser.email,
          email: googleUser.email,
          senha: senhaHash,
        },
      });
    }

    const token = gerarToken(usuario);

    res.json({
      token,
      usuario,
    });

  } catch (error) {

    res.status(500).json({
      error: error.message,
    });

  }
});

module.exports = router;
