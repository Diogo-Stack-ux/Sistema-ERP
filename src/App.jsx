import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "./services/api";

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [dados, setDados] = useState({
    totalClientes: 0,
    totalProdutos: 0,
    estoqueTotal: 0,
    totalGastos: 0,
  });
  const dadosGrafico = [
    { mes: "Jan", valor: 1200 },
    { mes: "Fev", valor: 900 },
    { mes: "Mar", valor: 1500 },
    { mes: "Abr", valor: 800 },
    { mes: "Mai", valor: 2100 },
    { mes: "Jun", valor: 1700 },
  ];
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState("");
  const [skuProduto, setSkuProduto] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipoProduto, setTipoProduto] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [editandoProdutoId, setEditandoProdutoId] = useState(null);

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtoId, setProdutoId] = useState(null);
  const [tipo, setTipo] = useState("entrada");
  const [quantidadeMov, setQuantidadeMov] = useState(0);

  const [gastosLista, setGastosLista] = useState([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("0");
  const [categoriaGasto, setCategoriaGasto] = useState("");
  const [eventos, setEventos] = useState([]);
  const [filtroCalendario, setFiltroCalendario] = useState("todos");
  const [lembretes, setLembretes] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: "",
    descricao: "",
    tipo: "reuniao",
    data: "",
    concluido: false,
  });

  const buscarClientes = async () => {
    const res = await api.get("/clientes");
    setClientes(res.data);
  };

  const buscarProdutos = async () => {
    const res = await api.get("/produtos");
    console.log("Produto exemplo:", res.data[0]); // ver quais campos chegam
    setProdutos(res.data);
  };

  const buscarMovimentacoes = async () => {
    const res = await api.get("/movimentacoes");
    setMovimentacoes(res.data);
  };

  const buscarGastos = async () => {
    const res = await api.get("/gastos");
    setGastosLista(res.data);
  };

  const formatarEventos = (eventosLista) =>
    eventosLista.map((evento) => {
      let cor = "#3b82f6";

      if (evento.tipo === "entrega") {
        cor = "#22c55e";
      }

      if (evento.tipo === "financeiro") {
        cor = "#ef4444";
      }

      if (evento.tipo === "tarefa") {
        cor = "#eab308";
      }
      if (evento.concluido) {
        cor = "#9ca3af";
      }

      return {
        id: evento.id,
        title: evento.titulo,
        date: String(evento.data).split("T")[0],

        descricao: evento.descricao,
        tipo: evento.tipo,
        concluido: evento.concluido,

        backgroundColor: cor,
        borderColor: cor,
      };
    });

  const obterLembretes = (eventosLista) => {
    const hoje = new Date();

    return eventosLista.filter((evento) => {
      const dataEvento = new Date(evento.date);

      const diff = Math.ceil(
        (dataEvento - hoje) / (1000 * 60 * 60 * 24)
      );

      return diff <= 1;
    });
  };

  const buscarEventos = async () => {
    const res = await api.get("/eventos");
    const formatados = formatarEventos(res.data);

    setEventos(formatados);
    gerarLembretes(formatados);
  };

  const gerarLembretes = (eventosLista) => {
    setLembretes(obterLembretes(eventosLista));
  };

  const handleDateClick = (info) => {
    setModoEdicao(false);

    setNovoEvento({
      titulo: "",
      descricao: "",
      tipo: "reuniao",
      data: info.dateStr,
      concluido: false,
    });

    setMostrarModal(true);
  };

  const handleEventClick = (info) => {

    setModoEdicao(true);

    setNovoEvento({
      id: info.event.id,
      titulo: info.event.title,
      descricao: info.event.extendedProps.descricao || "",
      tipo: info.event.extendedProps.tipo || "reuniao",
      data: info.event.startStr,
      concluido: info.event.extendedProps.concluido || false,
    });

    setMostrarModal(true);
  };

  const handleEventDrop = async (info) => {
    try {
      await api.put(`/eventos/${info.event.id}`, {
        titulo: info.event.title,
        descricao: info.event.extendedProps.descricao,
        tipo: info.event.extendedProps.tipo,
        data: info.event.startStr,
      });

      buscarEventos();
    } catch (error) {
      console.error(error);
    }
  };

  const criarEvento = async () => {
    try {
      await api.post("/eventos", novoEvento);

      buscarEventos();

      setMostrarModal(false);

      setNovoEvento({
        titulo: "",
        descricao: "",
        tipo: "reuniao",
        data: "",
        concluido: false,
      });

    } catch (error) {
      console.error(error);
    }
  };

  const atualizarEvento = async () => {
    try {

      await api.put(`/eventos/${novoEvento.id}`, {
        titulo: novoEvento.titulo,
        descricao: novoEvento.descricao,
        tipo: novoEvento.tipo,
        data: novoEvento.data,
      });

      buscarEventos();

      setMostrarModal(false);

      setModoEdicao(false);

    } catch (error) {
      console.error(error);
    }
  };

  const concluirEvento = async () => {
    try {
      await api.put(`/eventos/${novoEvento.id}`, {
        titulo: novoEvento.titulo,
        descricao: novoEvento.descricao,
        tipo: novoEvento.tipo,
        data: novoEvento.data,
        concluido: true,
      });

      buscarEventos();

      setMostrarModal(false);
      setModoEdicao(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deletarEvento = async () => {
    try {
      const eventoId = eventoSelecionado?.id || novoEvento.id;

      if (!eventoId) {
        return;
      }

      await api.delete(`/eventos/${eventoId}`);

      buscarEventos();

      setEventoSelecionado(null);
      setMostrarModal(false);
      setModoEdicao(false);

    } catch (error) {
      console.error(error);
    }
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setEndereco("");
  };

  const criarCliente = async () => {
    try {
      await api.post("/clientes", {
        nome,
        email,
        telefone,
        endereco,
      });

      limparFormulario();
      buscarClientes();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
    }
  };


  const atualizarCliente = async () => {
    try {
      await api.put(`/clientes/${editandoId}`, {
        nome,
        email,
        telefone,
        endereco,
      });

      limparFormulario();
      buscarClientes();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const deletarCliente = async (id) => {
    await api.delete(`/clientes/${id}`);
    buscarClientes();
  };

  const gerarSKU = (nome) => {
    const prefixo = (nome || "PRD").slice(0, 3).toUpperCase().padEnd(3, "X");
    const numero = Math.floor(Math.random() * 90000) + 10000;
    return prefixo + "-" + numero;
  };

  const criarProduto = async () => {
    const skuFinal = (skuProduto && skuProduto.trim() !== "")
      ? skuProduto.trim()
      : gerarSKU(nomeProduto);

    await api.post("/produtos", {
      nome: nomeProduto,
      sku: skuFinal,
      preco: Number(preco),
      quantidade: Number(quantidade),
      tipo: tipoProduto,
    });

    setNomeProduto("");
    setSkuProduto("");
    setPreco("");
    setQuantidade("");
    setTipoProduto("");

    buscarProdutos();
  };

  const atualizarProduto = async () => {
    const skuFinal = (skuProduto && skuProduto.trim() !== "")
      ? skuProduto.trim()
      : gerarSKU(nomeProduto);

    await api.put(`/produtos/${editandoProdutoId}`, {
      nome: nomeProduto,
      sku: skuFinal,
      preco: Number(preco),
      quantidade: Number(quantidade),
      tipo: tipoProduto,
    });

    setEditandoProdutoId(null);
    setNomeProduto("");
    setSkuProduto("");
    setPreco("");
    setQuantidade("");
    setTipoProduto("");

    buscarProdutos();
  };

  const deletarProduto = async (id) => {
    await api.delete(`/produtos/${id}`);
    buscarProdutos();
  };

  const criarGasto = async () => {
    try {
      await api.post("/gastos", {
        descricao,
        valor: Number(valor),
        categoria: categoriaGasto,
      });

      setDescricao("");
      setValor("");
      setCategoriaGasto("");

      buscarGastos();
    } catch (error) {
      console.error("Erro ao cadastrar gasto:", error);
    }
  };

  const criarMovimentacao = async () => {
    if (!produtoId || !quantidadeMov || quantidadeMov <= 0) {
      alert("Selecione um produto e insira uma quantidade válida!");
      return;
    }
    try {
      await api.post("/movimentacoes", {
        produtoId,
        tipo,
        quantidade: quantidadeMov,
      });

      setProdutoId(null);
      setQuantidadeMov(0);

      buscarMovimentacoes();
      buscarProdutos(); // atualiza estoque
    } catch (error) {
      console.error("Erro movimentação:", error);
    }
  };

  const deletarGasto = async (id) => {
    await api.delete(`/gastos/${id}`);
    buscarGastos();
  };

  useEffect(() => {
    let cancelado = false;

    const carregarDadosIniciais = async () => {
      try {
        const [
          dashboardRes,
          clientesRes,
          produtosRes,
          movimentacoesRes,
          gastosRes,
          eventosRes,
        ] = await Promise.all([
          api.get("/dashboard"),
          api.get("/clientes"),
          api.get("/produtos"),
          api.get("/movimentacoes"),
          api.get("/gastos"),
          api.get("/eventos"),
        ]);

        if (cancelado) {
          return;
        }

        const eventosFormatados = formatarEventos(eventosRes.data);

        setDados(dashboardRes.data);
        setEstoqueBaixo(dashboardRes.data.estoqueBaixo);
        setClientes(clientesRes.data);
        setProdutos(produtosRes.data);
        setMovimentacoes(movimentacoesRes.data);
        setGastosLista(gastosRes.data);
        setEventos(eventosFormatados);
        setLembretes(obterLembretes(eventosFormatados));
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    carregarDadosIniciais();

    return () => {
      cancelado = true;
    };
  }, []);

  const eventosFiltrados = eventos.filter((evento) => {
    if (filtroCalendario === "todos") return true;

    if (filtroCalendario === "concluidos") {
      return evento.concluido === true;
    }

    if (filtroCalendario === "pendentes") {
      return evento.concluido !== true;
    }

    return evento.tipo === filtroCalendario;
  });

  const produtosFiltrados = produtos.filter((p) => {
    const codigoProduto = p.sku || p.codigo || p.code || p.SKU || "";
    return (
      p.nome?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      p.tipo?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      codigoProduto.toLowerCase().includes(buscaProduto.toLowerCase())
    );
  });

  const produtosFiltradosOrdenados = [...produtosFiltrados].sort((a, b) => b.id - a.id);

  const botaoMenuClasse = (nomePagina) =>
    `rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all ${pagina === nomePagina
      ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-fuchsia-500/20"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen text-slate-100 app-shell">
      <aside className="w-72 min-h-screen rounded-r-[2rem] px-6 py-8 text-white shadow-2xl sidebar-panel">
        <div className="mb-7">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">
            Painel
          </p>
          <h2 className="text-[1.8rem] font-black tracking-tight">Nuvix Organizer</h2>
          <p className="mt-2.5 text-[13px] leading-6 text-slate-400">
            Gestao organizada e pronta para o dia a dia.
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          <button
            onClick={() => setPagina("dashboard")}
            className={`${botaoMenuClasse("dashboard")} px-3.5 py-2.5 text-[13px]`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setPagina("clientes")}
            className={`${botaoMenuClasse("clientes")} px-3.5 py-2.5 text-[13px]`}
          >
            Clientes
          </button>
          <button
            onClick={() => setPagina("produtos")}
            className={`${botaoMenuClasse("produtos")} px-3.5 py-2.5 text-[13px]`}
          >
            Produtos
          </button>
          <button
            onClick={() => setPagina("movimentacoes")}
            className={`${botaoMenuClasse("movimentacoes")} px-3.5 py-2.5 text-[13px]`}
          >
            Movimentações
          </button>
          <button
            onClick={() => setPagina("gastos")}
            className={`${botaoMenuClasse("gastos")} px-3.5 py-2.5 text-[13px]`}
          >
            Gastos
          </button>
          <button
            onClick={() => setPagina("calendario")}
            className={`${botaoMenuClasse("calendario")} px-3.5 py-2.5 text-[13px]`}
          >
            Calendário
          </button>
        </nav>
      </aside>

      <main className="flex-1 px-3 py-5 md:px-4 lg:px-5">
        <div className="mx-auto w-full max-w-[62rem]">
          {pagina === "dashboard" && (
            <>
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Painel principal
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-300">
                  Visão rápida dos números mais importantes para o seu negócio.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.75rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-fuchsia-500/20 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Clientes
                  </p>
                  <h2 className="mt-4 text-4xl font-black">{dados.totalClientes}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Total de clientes no sistema</p>
                </div>
                <div className="rounded-[1.75rem] bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-500 p-6 text-white shadow-2xl shadow-cyan-500/20 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Produtos
                  </p>
                  <h2 className="mt-4 text-4xl font-black">{dados.totalProdutos}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Produtos cadastrados</p>
                </div>
                <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-600 via-lime-600 to-amber-500 p-6 text-white shadow-2xl shadow-emerald-500/20 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Estoque
                  </p>
                  <h2 className="mt-4 text-4xl font-black">{dados.estoqueTotal}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Unidades em estoque</p>
                </div>
                <div className="rounded-[1.75rem] bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-6 text-white shadow-2xl shadow-rose-500/20 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Gastos
                  </p>
                  <h2 className="mt-4 text-4xl font-black">R$ {dados.totalGastos}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Total gasto no período</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
                <div className="glass-card p-6 rounded-[2rem] ring-1 ring-slate-200/10">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                        Total Vendido por Ano
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">
                        Tendência anual
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-sm text-slate-200">
                      6 meses
                    </span>
                  </div>

                  <div style={{ width: "100%", minWidth: 0, minHeight: 0, height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={dadosGrafico}>
                        <XAxis dataKey="mes" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid #334155' }} />
                        <Bar dataKey="valor" fill="#7c3aed" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-[2rem] ring-1 ring-slate-200/10">
                    <h2 className="text-xl font-bold mb-4 text-slate-100">
                      Próximos Eventos
                    </h2>
                    <div className="space-y-3">
                      {lembretes.slice(0, 5).map((evento) => (
                        <div
                          key={evento.id}
                          className="rounded-2xl border border-slate-700/70 bg-slate-950/40 p-4"
                        >
                          <p className="font-semibold text-slate-100">
                            {evento.title}
                          </p>
                          <p className="text-sm text-slate-400">
                            {evento.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-[2rem] ring-1 ring-slate-200/10">
                    <h2 className="text-xl font-bold mb-4 text-slate-100">
                      ⚠ Estoque Baixo
                    </h2>
                    {estoqueBaixo.length === 0 ? (
                      <p className="text-slate-400">Nenhum produto com estoque baixo.</p>
                    ) : (
                      estoqueBaixo.map((produto) => (
                        <div
                          key={produto.id}
                          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 mb-3"
                        >
                          <p className="font-semibold text-slate-100">
                            {produto.nome}
                          </p>
                          <p className="mt-1 text-sm text-red-300">
                            Quantidade: {produto.quantidade}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {pagina === "clientes" && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Cadastro
                </p>
                <div className="mt-2 flex flex-col items-center gap-3 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                  <div className="mx-auto lg:mx-0">
                    <h1 className="text-[1.7rem] font-black tracking-tight text-slate-100">
                      Clientes
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-300">
                      Gerencie os clientes cadastrados em um unico lugar.
                    </p>
                  </div>

                  {editandoId && (
                    <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                      Editando cliente. Revise os dados e clique em salvar.
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-auto max-w-[54rem] rounded-[1.25rem] bg-white p-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 md:p-3.5">
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-[0.7fr_0.85fr_0.62fr_0.72fr_auto]">
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />

                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <button
                      onClick={editandoId ? atualizarCliente : criarCliente}
                      className="bg-black text-white px-4 rounded"
                    >
                      {editandoId ? "Atualizar" : "Adicionar"}
                    </button>

                    {editandoId && (
                      <button
                        onClick={limparFormulario}
                        className="border border-gray-300 text-gray-700 px-4 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 overflow-hidden rounded-[1rem] border border-slate-200">
                  <div className="hidden grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] bg-slate-900 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-100 md:grid">
                    <div className="px-2.5 py-2">Nome</div>
                    <div className="px-2.5 py-2">Email</div>
                    <div className="px-2.5 py-2">Telefone</div>
                    <div className="px-2.5 py-2">Endereco</div>
                    <div className="px-2.5 py-2 text-center">Acoes</div>
                  </div>

                  {clientes.length === 0 && (
                    <div className="bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                      Nenhum cliente cadastrado.
                    </div>
                  )}

                  {clientes.map((c) => (
                    <div key={c.id} className="border-t border-slate-200 bg-white first:border-t-0">
                      <div className="grid gap-2 px-2.5 py-2 md:grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] md:items-center md:gap-1.5 md:px-2.5">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Nome
                          </p>
                          <p className="truncate text-[10px] font-semibold text-slate-900">{c.nome}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Email
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.email}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Telefone
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.telefone}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Endereco
                          </p>
                          <p className="truncate text-[10px] text-slate-600">{c.endereco}</p>
                        </div>

                        <div className="flex gap-1 md:justify-center">
                          <button
                            onClick={() => {
                              setEditandoId(c.id);
                              setNome(c.nome);
                              setEmail(c.email);
                              setTelefone(c.telefone);
                              setEndereco(c.endereco);
                            }}
                            className="rounded-md bg-blue-50 px-1.5 py-1 text-[9px] font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarCliente(c.id)}
                            className="rounded-md bg-red-50 px-1.5 py-1 text-[9px] font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {pagina === "produtos" && (
            <div className="mx-auto w-full max-w-5xl rounded-[1.5rem] glass-card p-5 ring-1 ring-slate-200/10">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Estoque</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">Produtos</h1>
                <p className="mt-1 text-sm text-slate-400">Gerencie seu catálogo de produtos e estoque.</p>
              </div>

              {/* FORM */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr_0.65fr_auto_auto]">
                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Nome"
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                />

                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Código SKU (auto se vazio)"
                  value={skuProduto}
                  onChange={(e) => setSkuProduto(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setSkuProduto(gerarSKU())}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition whitespace-nowrap"
                >
                  Gerar SKU
                </button>

                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Preço"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />

                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Quantidade"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />

                <select
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={tipoProduto}
                  onChange={(e) => setTipoProduto(e.target.value)}
                >
                  <option value="">Tipo</option>
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                  <option value="moda">Moda</option>
                  <option value="eletronico">Eletrônico</option>
                  <option value="alimento">Alimento</option>
                  <option value="brinquedo">Brinquedo</option>
                  <option value="outros">Outros</option>
                </select>

                <button
                  onClick={editandoProdutoId ? atualizarProduto : criarProduto}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-white transition hover:opacity-90 sm:w-auto sm:min-w-[8rem]"
                >
                  {editandoProdutoId ? "Atualizar" : "Adicionar"}
                </button>
              </div>

              <div className="mb-4 relative">
                <input
                  placeholder="Buscar por nome, tipo ou código SKU..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900 px-4 py-2.5 pl-10 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
                <span className="absolute left-3 top-2.5 text-slate-500 text-base">🔍</span>
              </div>

              {/* LISTA */}
              <div className="bg-slate-950/40 p-4 rounded-3xl">
                {produtosFiltrados.length === 0 ? (
                  <p className="text-slate-400">Nenhum produto encontrado.</p>
                ) : (
                  produtosFiltradosOrdenados.map((p) => {
                    const codigoProduto = p.sku || p.codigo || p.code || p.SKU || null;
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-2 border-b border-slate-700/50 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-100">{p.nome}</p>
                            {codigoProduto ? (
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                                {codigoProduto}
                              </span>
                            ) : (
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500 italic">
                                sem código
                              </span>
                            )}
                            {!codigoProduto && (
                              <button
                                onClick={async () => {
                                  const sku = gerarSKU(p.nome);
                                  await api.put(`/produtos/${p.id}`, { ...p, sku });
                                  buscarProdutos();
                                }}
                                className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400 hover:bg-violet-500/30 transition"
                              >
                                + gerar SKU
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                              {p.tipo}
                            </span>
                            <span className="text-sm text-slate-300">
                              R$ {Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-sm font-semibold ${p.quantidade <= 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                              Estoque: {p.quantidade} {p.quantidade <= 3 ? '⚠' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditandoProdutoId(p.id);
                              setNomeProduto(p.nome);
                              setSkuProduto(codigoProduto || "");
                              setPreco(p.preco);
                              setQuantidade(p.quantidade);
                              setTipoProduto(p.tipo);
                            }}
                            className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarProduto(p.id)}
                            className="rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {pagina === "movimentacoes" && (
            <div className="mx-auto w-full max-w-5xl rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <h1 className="text-2xl font-black mb-4">Movimentações</h1>

              {/* FORM */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_0.9fr_0.9fr_auto]">

                {/* PRODUTO */}
                <select
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={produtoId || ""}
                  onChange={(e) => setProdutoId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecione o produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>

                {/* TIPO */}
                <select
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>

                {/* QUANTIDADE */}
                <input
                  type="number"
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Quantidade"
                  value={quantidadeMov || ""}
                  onChange={(e) => setQuantidadeMov(e.target.value ? Number(e.target.value) : 0)}
                />

                {/* BOTÃO */}
                <button
                  onClick={criarMovimentacao}
                  className="w-full rounded-lg bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800 sm:w-auto sm:min-w-[8rem]"
                >
                  Registrar
                </button>
              </div>

              {/* LISTA */}
              <div className="bg-slate-50 p-4 rounded-3xl shadow-inner shadow-slate-100/70">
                {movimentacoes.length === 0 ? (
                  <p className="text-gray-500">Nenhuma movimentação cadastrada</p>
                ) : (
                  movimentacoes.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          {m.produto?.nome || "Produto não encontrado"}
                        </p>

                        <p
                          className={`text-sm ${m.tipo === "entrada"
                              ? "text-green-600"
                              : "text-red-600"
                            }`}
                        >
                          {m.tipo.toUpperCase()} - {m.quantidade}
                        </p>

                        <p className="text-xs text-gray-400">
                          {new Date(m.data).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {pagina === "gastos" && (
            <div className="mx-auto w-full max-w-5xl rounded-[1.5rem] glass-card p-5 ring-1 ring-slate-200/10">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Finanças</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">Gastos</h1>
                <p className="mt-1 text-sm text-slate-400">Registre e controle seus gastos em um único lugar.</p>
              </div>

              {/* FORM */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_0.7fr_0.9fr_auto]">
                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />

                <input
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />

                <select
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={categoriaGasto}
                  onChange={(e) => setCategoriaGasto(e.target.value)}
                >
                  <option value="">Categoria</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Outros">Outros</option>
                </select>

                <button
                  onClick={criarGasto}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-white transition hover:opacity-90 sm:w-auto sm:min-w-[8rem]"
                >
                  Adicionar
                </button>
              </div>

              {/* LISTA */}
              <div className="bg-slate-950/40 p-4 rounded-3xl">
                {gastosLista.length === 0 ? (
                  <p className="text-slate-400">Nenhum gasto cadastrado</p>
                ) : (
                  gastosLista.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col gap-3 border-b border-slate-700 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-100">{g.descricao}</p>
                        <span className="mt-1 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                          {g.categoria || "Outros"}
                        </span>
                        <p className="mt-2 text-sm text-slate-400">
                          R$ {Number(g.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <button
                        onClick={() => deletarGasto(g.id)}
                        className="rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}

                {gastosLista.length > 0 && (
                  <div className="mt-4 border-t border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total</span>
                    <span className="text-lg font-black text-slate-100">
                      R$ {gastosLista.reduce((acc, g) => acc + Number(g.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {pagina === "calendario" && (
            <div className="mx-auto w-full max-w-5xl rounded-[1.5rem] bg-white p-5 text-left shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Agenda
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    Calendário
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Visualize eventos, compromissos e datas importantes do sistema.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    {eventos.length} evento{eventos.length === 1 ? "" : "s"}
                  </div>
                  <button
                    onClick={buscarEventos}
                    className="rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Atualizar
                  </button>
                </div>
              </div>

              {lembretes.length > 0 && (
                <div className="mb-4 rounded border border-slate-700 bg-slate-900/60 p-4">
                  <h2 className="mb-2 font-bold text-slate-100">
                    🔔 Lembretes
                  </h2>

                  <div className="flex flex-col gap-2">
                    {lembretes.map((evento) => (
                      <div
                        key={evento.id}
                        className="rounded bg-slate-800 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-100">{evento.title}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {new Date(evento.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => deletarEvento(evento.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <select
                  value={filtroCalendario}
                  onChange={(e) => setFiltroCalendario(e.target.value)}
                  className="rounded border border-slate-300 bg-white p-2 text-black"
                >
                  <option className="bg-white text-black" value="todos">Todos</option>
                  <option className="bg-white text-black" value="reuniao">Reuniões</option>
                  <option className="bg-white text-black" value="entrega">Entregas</option>
                  <option className="bg-white text-black" value="financeiro">Financeiro</option>
                  <option className="bg-white text-black" value="tarefa">Tarefas</option>
                  <option className="bg-white text-black" value="concluidos">Concluídos</option>
                  <option className="bg-white text-black" value="pendentes">Pendentes</option>
                </select>
              </div>

              <div className="calendario-card rounded-3xl border border-slate-700/60 bg-slate-950/80 p-3 shadow-inner shadow-slate-100/5 md:p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={eventosFiltrados}
                  editable={true}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  height="auto"
                  locale="pt-br"
                  dayMaxEvents={3}
                  eventDisplay="block"
                  eventColor="#0f172a"
                  eventTextColor="#fff"
                  dayCellClassNames={(arg) => arg.isToday ? 'bg-slate-800/70 rounded-lg' : undefined}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,dayGridWeek",
                  }}
                  buttonText={{
                    today: "Hoje",
                    month: "Mês",
                    week: "Semana",
                  }}
                />
              </div>

              {mostrarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl bg-slate-950/95 p-6 text-left shadow-2xl ring-1 ring-slate-200/10">
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Agenda
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
                        Novo Evento
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Preencha os dados para registrar no calendário.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Título
                        </span>
                        <input
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                          placeholder="Ex: Reunião com cliente"
                          value={novoEvento.titulo}
                          onChange={(e) =>
                            setNovoEvento({
                              ...novoEvento,
                              titulo: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Descrição
                        </span>
                        <textarea
                          className="min-h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                          placeholder="Detalhes do evento"
                          value={novoEvento.descricao}
                          onChange={(e) =>
                            setNovoEvento({
                              ...novoEvento,
                              descricao: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Tipo
                        </span>
                        <select
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                          value={novoEvento.tipo}
                          onChange={(e) =>
                            setNovoEvento({
                              ...novoEvento,
                              tipo: e.target.value,
                            })
                          }
                        >
                          <option value="reuniao">Reunião</option>
                          <option value="entrega">Entrega</option>
                          <option value="tarefa">Tarefa</option>
                          <option value="financeiro">Financeiro</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-6 flex justify-between gap-2">
                      <div>
                        {modoEdicao && (
                          <button
                            onClick={deletarEvento}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {modoEdicao && !novoEvento.concluido && (
                          <button
                            onClick={concluirEvento}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                          >
                            Concluir
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setMostrarModal(false);
                            setModoEdicao(false);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={modoEdicao ? atualizarEvento : criarEvento}
                          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          {modoEdicao ? "Atualizar" : "Salvar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {eventoSelecionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl bg-slate-950/95 p-6 text-left shadow-2xl ring-1 ring-slate-200/10">
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Evento
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {eventoSelecionado.title}
                      </h2>
                    </div>

                    <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
                      <span className="font-semibold text-slate-900">Data:</span>{" "}
                      {eventoSelecionado.startStr}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setEventoSelecionado(null)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Fechar
                      </button>

                      <button
                        onClick={deletarEvento}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
