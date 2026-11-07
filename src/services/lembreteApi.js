import api from "./api";

export async function getLembretes() {
  const response = await api.get("/lembretes");
  return response.data;
}

export async function getLembreteById(id) {
  const response = await api.get(`/lembretes/${id}`);
  return response.data;
}

export async function createLembrete(data) {
  const response = await api.post("/lembretes", data);
  return response.data;
}

export async function updateLembrete(id, data) {
  const response = await api.put(`/lembretes/${id}`, data);
  return response.data;
}

export async function updateLembreteStatus(id, status) {
  const response = await api.patch(`/lembretes/${id}/status`, {
    status,
  });

  return response.data;
}

export async function deleteLembrete(id) {
  const response = await api.delete(`/lembretes/${id}`);
  return response.data;
}