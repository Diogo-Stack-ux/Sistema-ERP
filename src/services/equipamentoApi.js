import api from "./api";

export const getEquipamentos = async () => {
  const response = await api.get("/equipamentos");
  return response.data;
};

export const getEquipamentosPorCliente = async (clienteId) => {
  const response = await api.get(`/equipamentos/cliente/${clienteId}`);
  return response.data;
};

export const getEquipamentoPorId = async (id) => {
  const response = await api.get(`/equipamentos/${id}`);
  return response.data;
};

export const createEquipamento = async (data) => {
  const response = await api.post("/equipamentos", data);
  return response.data;
};

export const updateEquipamento = async (id, data) => {
  const response = await api.put(`/equipamentos/${id}`, data);
  return response.data;
};

export const deleteEquipamento = async (id) => {
  const response = await api.delete(`/equipamentos/${id}`);
  return response.data;
};