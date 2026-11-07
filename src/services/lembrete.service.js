const prisma = require("../lib/prisma");

async function listarLembretes(empresaId) {
  return prisma.lembrete.findMany({
    where: { empresaId },
    include: {
      cliente: true,
      equipamento: true,
    },
    orderBy: {
      dataLembrete: "asc",
    },
  });
}

async function buscarLembretePorId(id, empresaId) {
  return prisma.lembrete.findFirst({
    where: {
      id: Number(id),
      empresaId,
    },
    include: {
      cliente: true,
      equipamento: true,
    },
  });
}

async function criarLembrete(data, empresaId) {
  const {
    clienteId,
    equipamentoId,
    titulo,
    mensagem,
    dataLembrete,
    canal,
  } = data;

  if (!clienteId) {
    throw new Error("Cliente é obrigatório.");
  }

  if (!titulo?.trim()) {
    throw new Error("Título é obrigatório.");
  }

  if (!dataLembrete) {
    throw new Error("Data do lembrete é obrigatória.");
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      id: Number(clienteId),
      empresaId,
    },
  });

  if (!cliente) {
    throw new Error("Cliente não encontrado.");
  }

  if (equipamentoId) {
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        id: Number(equipamentoId),
        empresaId,
      },
    });

    if (!equipamento) {
      throw new Error("Equipamento não encontrado.");
    }

    if (equipamento.clienteId !== Number(clienteId)) {
      throw new Error(
        "O equipamento informado não pertence a este cliente."
      );
    }
  }

  return prisma.lembrete.create({
    data: {
      empresaId,
      clienteId: Number(clienteId),

      equipamentoId: equipamentoId
        ? Number(equipamentoId)
        : null,

      titulo: titulo.trim(),

      mensagem: mensagem?.trim() || null,

      dataLembrete: new Date(dataLembrete),

      canal: canal || "SISTEMA",

      status: "PENDENTE",
    },

    include: {
      cliente: true,
      equipamento: true,
    },
  });
}

async function atualizarLembrete(id, data, empresaId) {
  const lembrete = await prisma.lembrete.findFirst({
    where: {
      id: Number(id),
      empresaId,
    },
  });

  if (!lembrete) {
    throw new Error("Lembrete não encontrado.");
  }

  const {
    clienteId,
    equipamentoId,
    titulo,
    mensagem,
    dataLembrete,
    canal,
  } = data;

  if (clienteId !== undefined) {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(clienteId),
        empresaId,
      },
    });

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }
  }

  const clienteFinal =
    clienteId !== undefined
      ? Number(clienteId)
      : lembrete.clienteId;

  if (equipamentoId) {
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        id: Number(equipamentoId),
        empresaId,
      },
    });

    if (!equipamento) {
      throw new Error("Equipamento não encontrado.");
    }

    if (equipamento.clienteId !== clienteFinal) {
      throw new Error(
        "O equipamento informado não pertence a este cliente."
      );
    }
  }

  return prisma.lembrete.update({
    where: {
      id: Number(id),
      empresaId,
    },

    data: {
      ...(clienteId !== undefined && {
        clienteId: Number(clienteId),
      }),

      ...(equipamentoId !== undefined && {
        equipamentoId: equipamentoId
          ? Number(equipamentoId)
          : null,
      }),

      ...(titulo !== undefined && {
        titulo: titulo.trim(),
      }),

      ...(mensagem !== undefined && {
        mensagem: mensagem?.trim() || null,
      }),

      ...(dataLembrete !== undefined && {
        dataLembrete: new Date(dataLembrete),
      }),

      ...(canal !== undefined && {
        canal: canal || "SISTEMA",
      }),
    },

    include: {
      cliente: true,
      equipamento: true,
    },
  });
}

async function atualizarStatus(id, status, empresaId) {
  const statusPermitidos = [
    "PENDENTE",
    "ENVIADO",
    "CANCELADO",
  ];

  if (!statusPermitidos.includes(status)) {
    throw new Error("Status inválido.");
  }

  const lembrete = await prisma.lembrete.findFirst({
    where: {
      id: Number(id),
      empresaId,
    },
  });

  if (!lembrete) {
    throw new Error("Lembrete não encontrado.");
  }

  return prisma.lembrete.update({
    where: {
      id: Number(id),
      empresaId,
    },

    data: {
      status,
    },

    include: {
      cliente: true,
      equipamento: true,
    },
  });
}

async function excluirLembrete(id, empresaId) {
  const lembrete = await prisma.lembrete.findFirst({
    where: {
      id: Number(id),
      empresaId,
    },
  });

  if (!lembrete) {
    throw new Error("Lembrete não encontrado.");
  }

  return prisma.lembrete.delete({
    where: {
      id: Number(id),
      empresaId,
    },
  });
}

module.exports = {
  listarLembretes,
  buscarLembretePorId,
  criarLembrete,
  atualizarLembrete,
  atualizarStatus,
  excluirLembrete,
};