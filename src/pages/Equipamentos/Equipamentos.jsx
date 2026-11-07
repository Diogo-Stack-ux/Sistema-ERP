import { useEffect, useMemo, useState } from "react";
import {
  createEquipamento,
  deleteEquipamento,
  getEquipamentoPorId,
  getEquipamentos,
  updateEquipamento,
} from "../../services/equipamentoApi";
import EquipmentForm from "../../components/EquipmentForm";
import EquipmentWorkspace from "../../components/EquipmentWorkspace/EquipmentWorkspace";
import { getClientes } from "../../services/clienteApi";

const emptyForm = {
  clienteId: "",
  nome: "",
  tipo: "",
  marca: "",
  modelo: "",
  numeroSerie: "",
  identificacao: "",
  dataCompra: "",
  garantiaAte: "",
  frequenciaRevisao: "",
  tipoFrequenciaRevisao: "",
  observacoes: "",
  ativo: true,
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busca, setBusca] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [equipamentoDetalhado, setEquipamentoDetalhado] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [equipamentosData, clientesData] = await Promise.all([
        getEquipamentos(),
        getClientes(),
      ]);
      setEquipamentos(equipamentosData);
      setClientes(clientesData);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
      alert("Erro ao carregar equipamentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const equipamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return equipamentos.filter((equipamento) => {
      const clienteOk =
        !clienteFiltro || Number(equipamento.clienteId) === Number(clienteFiltro);

      const texto = [
        equipamento.nome,
        equipamento.tipo,
        equipamento.marca,
        equipamento.modelo,
        equipamento.numeroSerie,
        equipamento.identificacao,
        equipamento.cliente?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return clienteOk && (!termo || texto.includes(termo));
    });
  }, [busca, clienteFiltro, equipamentos]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleEdit(equipamento) {
    setEditingId(equipamento.id);
    setForm({
      clienteId: equipamento.clienteId || "",
      nome: equipamento.nome || "",
      tipo: equipamento.tipo || "",
      marca: equipamento.marca || "",
      modelo: equipamento.modelo || "",
      numeroSerie: equipamento.numeroSerie || "",
      identificacao: equipamento.identificacao || "",
      dataCompra: equipamento.dataCompra
        ? String(equipamento.dataCompra).slice(0, 10)
        : "",
      garantiaAte: equipamento.garantiaAte
        ? String(equipamento.garantiaAte).slice(0, 10)
        : "",
      frequenciaRevisao: equipamento.frequenciaRevisao || "",
      tipoFrequenciaRevisao: equipamento.tipoFrequenciaRevisao || "",
      observacoes: equipamento.observacoes || "",
      ativo: equipamento.ativo !== false,
    });
  }

  async function abrirWorkspace(equipamentoId) {
    try {
      setLoadingWorkspace(true);
      setWorkspaceOpen(true);

      const data = await getEquipamentoPorId(equipamentoId);

      setEquipamentoDetalhado(data);
    } catch (error) {
      console.error("Erro ao carregar equipamento:", error);

      alert(
        error?.response?.data?.error ||
          "Não foi possível carregar os dados do equipamento"
      );

      setWorkspaceOpen(false);
    } finally {
      setLoadingWorkspace(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.clienteId) {
      alert("Selecione um cliente.");
      return;
    }

    if (!form.nome.trim()) {
      alert("Informe o nome do equipamento.");
      return;
    }

    const payload = {
      clienteId: Number(form.clienteId),
      nome: form.nome.trim(),
      tipo: form.tipo.trim() || null,
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      numeroSerie: form.numeroSerie.trim() || null,
      identificacao: form.identificacao.trim() || null,
      dataCompra: form.dataCompra || null,
      garantiaAte: form.garantiaAte || null,
      frequenciaRevisao: form.frequenciaRevisao
        ? Number(form.frequenciaRevisao)
        : null,
      tipoFrequenciaRevisao: form.tipoFrequenciaRevisao || null,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateEquipamento(editingId, payload);
      } else {
        await createEquipamento(payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);

      alert(
        error?.response?.data?.error ||
          "Erro ao salvar equipamento"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEquipamento(id);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error);
      alert(error?.response?.data?.error || "Erro ao excluir equipamento");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Cadastro
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Equipamentos
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Controle os equipamentos vinculados aos clientes.
            </p>
          </div>

          <div className="rounded-lg bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100">
            {equipamentos.length} equipamento{equipamentos.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-100">
              {editingId
                ? "Editar equipamento"
                : "Cadastrar equipamento"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Vincule veículos, máquinas, computadores e outros ativos aos clientes.
            </p>
          </div>

          <EquipmentForm
            formData={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={saving}
            submitLabel={
              editingId
                ? "Atualizar equipamento"
                : "Cadastrar equipamento"
            }
            onCancel={editingId ? resetForm : undefined}
            showCliente
            clientes={clientes}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por equipamento, cliente, serie ou identificacao"
            className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400"
          />
          <select
            value={clienteFiltro}
            onChange={(event) => setClienteFiltro(event.target.value)}
            className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-6 text-sm text-slate-400">
            Carregando equipamentos...
          </div>
        ) : equipamentosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-100">
              Nenhum equipamento encontrado
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Cadastre um equipamento ou ajuste os filtros.
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-4">
            {equipamentosFiltrados.map((equipamento) => (
              <article
                key={equipamento.id}
                className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4 shadow-lg shadow-slate-950/20"
              >
                <div className="grid gap-3 xl:grid-cols-[1.3fr_0.95fr_0.85fr_0.75fr_0.75fr_0.7fr_auto] xl:items-stretch">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Equipamento
                    </span>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      {equipamento.nome}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {[equipamento.tipo, equipamento.marca, equipamento.modelo]
                        .filter(Boolean)
                        .join(" - ") || "Sem detalhes"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Cliente
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {equipamento.cliente?.nome || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Serie
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {equipamento.numeroSerie || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {equipamento.identificacao || ""}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Compra
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {formatDate(equipamento.dataCompra)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Garantia
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {formatDate(equipamento.garantiaAte)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </span>
                    <div className="mt-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          equipamento.ativo
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-slate-700/70 text-slate-300"
                        }`}
                      >
                        {equipamento.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 xl:flex-col xl:items-stretch xl:justify-center">
                    <button
                      type="button"
                      onClick={() => abrirWorkspace(equipamento.id)}
                      className="rounded-xl border border-violet-700/60 bg-violet-950/40 px-4 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-900/50 hover:text-white"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(equipamento)}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(equipamento.id)}
                      className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Equipamento</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Serie</th>
                    <th className="px-4 py-3 font-semibold">Compra</th>
                    <th className="px-4 py-3 font-semibold">Garantia</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {equipamentosFiltrados.map((equipamento) => (
                    <tr key={equipamento.id} className="text-slate-300 transition hover:bg-slate-900/60">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-100">{equipamento.nome}</p>
                        <p className="text-xs text-slate-500">
                          {[equipamento.tipo, equipamento.marca, equipamento.modelo]
                            .filter(Boolean)
                            .join(" - ") || "Sem detalhes"}
                        </p>
                      </td>
                      <td className="px-4 py-4">{equipamento.cliente?.nome || "-"}</td>
                      <td className="px-4 py-4">
                        <p>{equipamento.numeroSerie || "-"}</p>
                        <p className="text-xs text-slate-500">{equipamento.identificacao || ""}</p>
                      </td>
                      <td className="px-4 py-4">{formatDate(equipamento.dataCompra)}</td>
                      <td className="px-4 py-4">{formatDate(equipamento.garantiaAte)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            equipamento.ativo
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700/70 text-slate-300"
                          }`}
                        >
                          {equipamento.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirWorkspace(equipamento.id)}
                            className="rounded-lg border border-violet-700/60 bg-violet-950/40 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-900/50 hover:text-white"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(equipamento)}
                            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(equipamento.id)}
                            className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </section>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950/95 p-6 shadow-2xl ring-1 ring-slate-200/10">
            <h3 className="text-lg font-black text-slate-100">
              Excluir equipamento?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Equipamentos com ordens de servico vinculadas nao podem ser excluidos.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Confirmar exclusao
              </button>
            </div>
          </div>
        </div>
      )}

      {workspaceOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-4xl overflow-y-auto bg-slate-950 p-5 shadow-2xl ring-1 ring-slate-700 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Workspace
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-100">
                  Detalhes do Equipamento
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWorkspaceOpen(false);
                  setEquipamentoDetalhado(null);
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Fechar
              </button>
            </div>

            {loadingWorkspace ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
                Carregando equipamento...
              </div>
            ) : equipamentoDetalhado ? (
              <EquipmentWorkspace equipamento={equipamentoDetalhado} />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default Equipamentos;
