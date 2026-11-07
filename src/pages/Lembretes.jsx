import { useEffect, useState } from "react";
import api from "../services/api";
import LembreteModal from "../components/LembreteModal";
import {
  getLembretes,
  createLembrete,
  updateLembrete,
  updateLembreteStatus,
  deleteLembrete,
} from "../services/lembreteApi";

function Lembretes() {
  const [lembretes, setLembretes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [lembreteEditando, setLembreteEditando] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [salvando, setSalvando] = useState(false);

  async function carregarLembretes() {
    try {
      setLoading(true);
      setErro("");

      const dados = await getLembretes();

      setLembretes(dados);
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);

      setErro("Não foi possível carregar os lembretes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarLembretes();
  }, []);

  async function carregarDadosFormulario() {
    const [resClientes, resEquipamentos] = await Promise.all([
      api.get("/clientes"),
      api.get("/equipamentos"),
    ]);

    setClientes(resClientes.data);
    setEquipamentos(resEquipamentos.data);
  }

  async function abrirNovoLembrete() {
    try {
      setErro("");

      await carregarDadosFormulario();
      setModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar clientes/equipamentos:", error);
      setErro("Não foi possível carregar os dados do formulário.");
    }
  }

  async function abrirEdicaoLembrete(lembrete) {
    try {
      setErro("");

      await carregarDadosFormulario();

      setLembreteEditando(lembrete);
      setModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar edição:", error);
      setErro("Não foi possível carregar os dados para edição.");
    }
  }

  async function salvarLembrete(payload) {
    try {
      setSalvando(true);

      if (lembreteEditando) {
        await updateLembrete(lembreteEditando.id, payload);
      } else {
        await createLembrete(payload);
      }

      await carregarLembretes();

      setModalOpen(false);
      setLembreteEditando(null);
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoEnviado(id) {
    try {
      await updateLembreteStatus(id, "ENVIADO");

      await carregarLembretes();
    } catch (error) {
      console.error("Erro ao atualizar lembrete:", error);

      setErro(
        error?.response?.data?.error ||
          "Não foi possível atualizar o lembrete."
      );
    }
  }

  async function handleExcluirLembrete(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este lembrete?"
    );

    if (!confirmar) return;

    try {
      await deleteLembrete(id);

      await carregarLembretes();
    } catch (error) {
      console.error("Erro ao excluir lembrete:", error);

      setErro(
        error?.response?.data?.error ||
          "Não foi possível excluir o lembrete."
      );
    }
  }

  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  const atrasados = lembretes.filter((lembrete) => {
    if (lembrete.status !== "PENDENTE") return false;

    const data = new Date(lembrete.dataLembrete);
    data.setHours(0, 0, 0, 0);

    return data < hoje;
  });

  const lembretesHoje = lembretes.filter((lembrete) => {
    if (lembrete.status !== "PENDENTE") return false;

    const data = new Date(lembrete.dataLembrete);
    data.setHours(0, 0, 0, 0);

    return data.getTime() === hoje.getTime();
  });

  const proximos = lembretes.filter((lembrete) => {
    if (lembrete.status !== "PENDENTE") return false;

    const data = new Date(lembrete.dataLembrete);
    data.setHours(0, 0, 0, 0);

    return data > hoje;
  });

  const enviados = lembretes.filter(
    (lembrete) => lembrete.status === "ENVIADO"
  );

  const lembretesFiltrados = lembretes.filter((lembrete) => {
    if (filtro === "TODOS") {
      return true;
    }

    if (filtro === "ATRASADOS") {
      const data = new Date(lembrete.dataLembrete);
      data.setHours(0, 0, 0, 0);

      return (
        lembrete.status === "PENDENTE" &&
        data < hoje
      );
    }

    if (filtro === "HOJE") {
      const data = new Date(lembrete.dataLembrete);
      data.setHours(0, 0, 0, 0);

      return (
        lembrete.status === "PENDENTE" &&
        data.getTime() === hoje.getTime()
      );
    }

    if (filtro === "PROXIMOS") {
      const data = new Date(lembrete.dataLembrete);
      data.setHours(0, 0, 0, 0);

      return (
        lembrete.status === "PENDENTE" &&
        data > hoje
      );
    }

    if (filtro === "ENVIADOS") {
      return lembrete.status === "ENVIADO";
    }

    return true;
  });

  if (loading) {
    return (
      <div className="p-6 text-slate-300">
        Carregando lembretes...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Relacionamento
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-100">
          Central de Lembretes
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Acompanhe revisões, manutenções e contatos programados.
        </p>
      </div>

      {erro && (
        <div className="mb-6 rounded-xl bg-red-950/40 p-4 text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5">
          <p className="text-sm font-semibold text-red-300">
            Atrasados
          </p>

          <p className="mt-2 text-3xl font-black text-red-400">
            {atrasados.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
          <p className="text-sm font-semibold text-amber-300">
            Hoje
          </p>

          <p className="mt-2 text-3xl font-black text-amber-400">
            {lembretesHoje.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5">
          <p className="text-sm font-semibold text-blue-300">
            Próximos
          </p>

          <p className="mt-2 text-3xl font-black text-blue-400">
            {proximos.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
          <p className="text-sm font-semibold text-emerald-300">
            Enviados
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-400">
            {enviados.length}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-100">
              Lembretes programados
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Revisões, manutenções e contatos que precisam de acompanhamento.
            </p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ["TODOS", "Todos"],
              ["ATRASADOS", "Atrasados"],
              ["HOJE", "Hoje"],
              ["PROXIMOS", "Próximos"],
              ["ENVIADOS", "Enviados"],
            ].map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filtro === valor
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={abrirNovoLembrete}
              className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
            >
              Novo lembrete
            </button>

            <button
              type="button"
              onClick={carregarLembretes}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
            >
              Atualizar
            </button>
          </div>
        </div>

        {lembretesFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <p className="font-bold text-slate-300">
              Nenhum lembrete encontrado
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Os próximos lembretes de revisão aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lembretesFiltrados.map((lembrete) => {
              const data = new Date(lembrete.dataLembrete);

              const atrasado =
                lembrete.status === "PENDENTE" &&
                data < new Date();

              return (
                <div
                  key={lembrete.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-100">
                          {lembrete.titulo}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            lembrete.status === "ENVIADO"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : atrasado
                                ? "bg-red-500/10 text-red-300"
                                : "bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {lembrete.status === "ENVIADO"
                            ? "ENVIADO"
                            : atrasado
                              ? "ATRASADO"
                              : "PENDENTE"}
                        </span>
                      </div>

                      {lembrete.mensagem && (
                        <p className="mt-2 text-sm text-slate-400">
                          {lembrete.mensagem}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <p className="text-slate-400">
                          Cliente:{" "}
                          <span className="font-semibold text-slate-200">
                            {lembrete.cliente?.nome || "Não informado"}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Equipamento:{" "}
                          <span className="font-semibold text-slate-200">
                            {lembrete.equipamento?.nome || "Não vinculado"}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Data:{" "}
                          <span className="font-semibold text-slate-200">
                            {data.toLocaleDateString("pt-BR")}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Canal:{" "}
                          <span className="font-semibold text-slate-200">
                            {lembrete.canal || "SISTEMA"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicaoLembrete(lembrete)}
                        className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
                      >
                        Editar
                      </button>

                      {lembrete.status === "PENDENTE" && (
                        <button
                          type="button"
                          onClick={() => marcarComoEnviado(lembrete.id)}
                          className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          Marcar enviado
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExcluirLembrete(lembrete.id)}
                        className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LembreteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setLembreteEditando(null);
        }}
        onSave={salvarLembrete}
        clientes={clientes}
        equipamentos={equipamentos}
        loading={salvando}
        lembrete={lembreteEditando}
      />
    </div>
  );
}

export default Lembretes;
