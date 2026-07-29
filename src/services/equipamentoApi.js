import api from "./api";

export async function getEquipamentos() {
  const response = await api.get("/equipamentos");
  return response.data;
}

export async function getEquipamentosPorCliente(clienteId) {
  const response = await api.get(`/equipamentos/cliente/${clienteId}`);
  return response.data;
}

export async function getEquipamentoPorId(id) {
  const response = await api.get(`/equipamentos/${id}`);
  return response.data;
}

export async function createEquipamento(data) {
  const response = await api.post("/equipamentos", data);
  return response.data;
}

export async function updateEquipamento(id, data) {
  const response = await api.put(`/equipamentos/${id}`, data);
  return response.data;
}

export async function deleteEquipamento(id) {
  const response = await api.delete(`/equipamentos/${id}`);
  return response.data;
}
