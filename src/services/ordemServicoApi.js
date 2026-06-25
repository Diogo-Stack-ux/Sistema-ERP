import api from "./api";

export async function getOrdens() {
  const response = await api.get("/ordens-servico");
  return response.data;
}

export async function getOrdemById(id) {
  const response = await api.get(`/ordens-servico/${id}`);
  return response.data;
}

export async function createOrdem(data) {
  const response = await api.post("/ordens-servico", data);
  return response.data;
}

export async function updateOrdemStatus(id, status) {
  const response = await api.patch(`/ordens-servico/${id}/status`, { status });
  return response.data;
}

export async function deleteOrdem(id) {
  const response = await api.delete(`/ordens-servico/${id}`);
  return response.data;
}