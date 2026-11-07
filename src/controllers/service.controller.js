const prisma = require("../lib/prisma");

exports.create = async (req, res) => {
  try {
    const service = await prisma.service.create({
      data: {
        ...req.body,
        empresaId: req.empresaId,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { empresaId: req.empresaId },
      orderBy: {
        nome: "asc",
      },
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.findById = async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: {
        id: Number(req.params.id),
        empresaId: req.empresaId,
      },
    });

    res.json(service);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { nome, descricao, categoria, valor, garantia, duracao, ativo } =
      req.body;

    const service = await prisma.service.update({
      where: {
        id: Number(req.params.id),
        empresaId: req.empresaId,
      },
      data: { nome, descricao, categoria, valor, garantia, duracao, ativo },
    });

    res.json(service);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.service.delete({
      where: {
        id: Number(req.params.id),
        empresaId: req.empresaId,
      },
    });

    res.json({
      message: "Serviço removido com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
