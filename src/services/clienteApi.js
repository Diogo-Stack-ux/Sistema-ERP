import api from "./api";

export async function getClientes() {
  const response = await api.get("/clientes");
  return response.data;
}

export async function getPerfilCliente(clienteId) {
  const response = await api.get(`/clientes/${clienteId}/perfil`);
  return response.data;
}
