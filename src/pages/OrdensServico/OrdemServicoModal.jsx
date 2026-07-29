import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createOrdem } from "../../services/ordemServicoApi";
import { getClientes } from "../../services/clienteApi";
import { getServices } from "../../services/serviceApi";
import { getProdutos } from "../../services/produtoApi";
import { getEquipamentosPorCliente } from "../../services/equipamentoApi";

function OrdemServicoModal({ isOpen, onClose, onSuccess }) {
  const [clientes, setClientes] = useState([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [clientesData, servicosData, produtosData] = await Promise.all([
          getClientes(),
          getServices(),
          getProdutos(),
        ]);
        setClientes(clientesData);
        setServicosDisponiveis(servicosData.filter((s) => s.ativo));
        setProdutosDisponiveis(produtosData);
      } catch (error) {
        console.error("Erro ao carregar opções:", error);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !clienteId) {
      setEquipamentosDisponiveis([]);
      setEquipamentoId("");
      return;
    }

    async function loadEquipamentos() {
      try {
        const data = await getEquipamentosPorCliente(clienteId);
        setEquipamentosDisponiveis(data.filter((equipamento) => equipamento.ativo));
      } catch (error) {
        console.error("Erro ao carregar equipamentos:", error);
        setEquipamentosDisponiveis([]);
      }
    }

    setEquipamentoId("");
    loadEquipamentos();
  }, [clienteId, isOpen]);

  function resetForm() {
    setClienteId("");
    setEquipamentoId("");
    setObservacoes("");
    setServicosSelecionados([]);
    setProdutosSelecionados([]);
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  // ---- Serviços ----
  function toggleServico(service) {
    setServicosSelecionados((prev) => {
      const exists = prev.find((s) => s.serviceId === service.id);
      if (exists) {
        return prev.filter((s) => s.serviceId !== service.id);
      }
      return [...prev, { serviceId: service.id, nome: service.nome, valor: Number(service.valor) }];
    });
  }

  // ---- Produtos ----
  function toggleProduto(produto) {
    setProdutosSelecionados((prev) => {
      const exists = prev.find((p) => p.produtoId === produto.id);
      if (exists) {
        return prev.filter((p) => p.produtoId !== produto.id);
      }
      return [
        ...prev,
        {
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: 1,
          precoUnitario: Number(produto.preco),
          estoqueDisponivel: produto.quantidade,
        },
      ];
    });
  }

  function updateQuantidadeProduto(produtoId, quantidade) {
    setProdutosSelecionados((prev) =>
      prev.map((p) =>
        p.produtoId === produtoId
          ? { ...p, quantidade: Math.max(1, Number(quantidade) || 1) }
          : p
      )
    );
  }

  // ---- Totais ----
  const totalServicos = servicosSelecionados.reduce((sum, s) => sum + s.valor, 0);
  const totalProdutos = produtosSelecionados.reduce(
    (sum, p) => sum + p.precoUnitario * p.quantidade,
    0
  );
  const totalGeral = totalServicos + totalProdutos;

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!clienteId) {
      alert("Selecione um cliente");
      return;
    }
    if (servicosSelecionados.length === 0) {
      alert("Selecione ao menos um serviço");
      return;
    }

    // Validação simples de estoque
    const semEstoque = produtosSelecionados.find(
      (p) => p.quantidade > p.estoqueDisponivel
    );
    if (semEstoque) {
      alert(`Estoque insuficiente para "${semEstoque.nome}"`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        clienteId: Number(clienteId),
        equipamentoId: equipamentoId ? Number(equipamentoId) : null,
        observacoes,
        servicos: servicosSelecionados.map((s) => ({
          serviceId: Number(s.serviceId),
          valor: Number(s.valor),
        })),
        produtos: produtosSelecionados.map((p) => ({
          produtoId: Number(p.produtoId),
          quantidade: Number(p.quantidade),
          precoUnitario: Number(p.precoUnitario),
        })),
      };

      await createOrdem(payload);

      await onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error("Erro ao criar ordem de servico:", error);
      alert(error?.response?.data?.error || "Erro ao criar ordem de servico");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-300";
  const inputClass =
    "h-11 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:p-10 lg:items-center">
      <div className="my-auto w-full max-w-3xl rounded-2xl bg-slate-950/95 p-5 text-left shadow-2xl ring-1 ring-slate-200/10 sm:max-h-[calc(100svh-80px)] sm:p-6 sm:overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Operação
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Nova Ordem de Serviço
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Selecione o cliente, os serviços e os produtos utilizados.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
          >
            X
          </button>
        </div>

        {loadingOptions ? (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 text-sm text-slate-400">
            Carregando dados...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Cliente */}
            <label className="mb-4 block">
              <span className={labelClass}>Cliente</span>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-4 block">
              <span className={labelClass}>Equipamento</span>
              <select
                value={equipamentoId}
                onChange={(e) => setEquipamentoId(e.target.value)}
                disabled={!clienteId}
                className={inputClass}
              >
                <option value="">
                  {clienteId ? "Sem equipamento vinculado" : "Selecione um cliente primeiro"}
                </option>
                {equipamentosDisponiveis.map((equipamento) => (
                  <option key={equipamento.id} value={equipamento.id}>
                    {[equipamento.nome, equipamento.marca, equipamento.modelo]
                      .filter(Boolean)
                      .join(" - ")}
                  </option>
                ))}
              </select>
            </label>

            {/* Serviços */}
            <div className="mb-4">
              <span className={labelClass}>Serviços</span>
              {servicosDisponiveis.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum serviço ativo cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {servicosDisponiveis.map((service) => {
                    const checked = servicosSelecionados.some(
                      (s) => s.serviceId === service.id
                    );
                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                          checked
                            ? "border-violet-500/60 bg-violet-500/10"
                            : "border-slate-700/60 bg-slate-900/60 hover:bg-slate-900"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleServico(service)}
                            className="h-4 w-4 accent-violet-500"
                          />
                          <span className="text-sm font-semibold text-slate-200">
                            {service.nome}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-emerald-300">
                          {formatCurrency(service.valor)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Produtos */}
            <div className="mb-4">
              <span className={labelClass}>Produtos Utilizados</span>
              {produtosDisponiveis.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {produtosDisponiveis.map((produto) => {
                    const selecionado = produtosSelecionados.find(
                      (p) => p.produtoId === produto.id
                    );
                    return (
                      <div
                        key={produto.id}
                        className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition sm:flex-row sm:items-center sm:justify-between ${
                          selecionado
                            ? "border-violet-500/60 bg-violet-500/10"
                            : "border-slate-700/60 bg-slate-900/60 hover:bg-slate-900"
                        }`}
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(selecionado)}
                            onChange={() => toggleProduto(produto)}
                            className="h-4 w-4 accent-violet-500"
                          />
                          <span className="text-sm font-semibold text-slate-200">
                            {produto.nome}
                          </span>
                          <span className="text-xs text-slate-500">
                            (estoque: {produto.quantidade})
                          </span>
                        </label>

                        <div className="flex items-center gap-3">
                          {selecionado && (
                            <input
                              type="number"
                              min={1}
                              max={produto.quantidade}
                              value={selecionado.quantidade}
                              onChange={(e) =>
                                updateQuantidadeProduto(produto.id, e.target.value)
                              }
                              className="h-9 w-20 rounded-lg border border-slate-700 bg-slate-950/80 px-2 text-sm text-slate-100 outline-none focus:border-violet-400"
                            />
                          )}
                          <span className="w-24 text-right text-sm font-semibold text-emerald-300">
                            {formatCurrency(produto.preco)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Observações */}
            <label className="mb-4 block">
              <span className={labelClass}>Observações</span>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Detalhes adicionais sobre a OS"
              />
            </label>

            {/* Resumo de valores */}
            <div className="mb-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Serviços</span>
                <span>{formatCurrency(totalServicos)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-slate-400">
                <span>Produtos</span>
                <span>{formatCurrency(totalProdutos)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-700/60 pt-2 text-base font-bold text-slate-100">
                <span>Total</span>
                <span className="text-emerald-300">{formatCurrency(totalGeral)}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Criar Ordem de Serviço"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

export default OrdemServicoModal;
