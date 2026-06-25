import api from "./api";

export async function getLancamentos(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipo) params.append("tipo", filtros.tipo);
  if (filtros.status) params.append("status", filtros.status);
  const query = params.toString();
  const response = await api.get(query ? `/gastos?${query}` : "/gastos");
  return response.data;
}

export async function getTotais() {
  const response = await api.get("/gastos/total");
  return response.data;
}

export async function createLancamento(data) {
  const response = await api.post("/gastos", data);
  return response.data;
}

export async function updateLancamentoStatus(id, status) {
  const response = await api.patch(`/gastos/${id}/status`, { status });
  return response.data;
}

export async function deleteLancamento(id) {
  const response = await api.delete(`/gastos/${id}`);
  return response.data;
}
