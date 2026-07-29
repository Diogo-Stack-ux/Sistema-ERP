import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import api from "./services/api";
import heroImage from "./assets/hero.png";
import plansBg from "./assets/plans-bg.png";
import welcomeBg from "./assets/welcome-bg.png";
import { firebaseAuth, googleProvider } from "./services/firebase";

const Services = lazy(() => import("./pages/Services/Services"));
const OrdensServico = lazy(() => import("./pages/OrdensServico/OrdensServico"));
const Equipamentos = lazy(() => import("./pages/Equipamentos/Equipamentos"));
const Financeiro = lazy(() => import("./pages/Financeiro/Financeiro"));
const ClientProfileModal = lazy(() => import("./components/ClientProfileModal"));

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[1.25rem] glass-card p-5 text-sm text-slate-300 ring-1 ring-slate-200/10">
      Carregando...
    </div>
  );
}

function App() {
  const subscriptionEnforced = import.meta.env.VITE_SUBSCRIPTION_ENFORCED === "true";
  const [pagina, setPagina] = useState("dashboard");
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );
  const [assinatura, setAssinatura] = useState(
    localStorage.getItem("assinaturaPacote") || ""
  );
  const [onboardingPage, setOnboardingPage] = useState("welcome");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientProfileOpen, setClientProfileOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    senha: "",
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginErro, setLoginErro] = useState("");

  const getFirebaseAuthMessage = (error) => {
    const code = error?.code;

    const messages = {
      "auth/email-already-in-use": "Este e-mail ja esta cadastrado. Use login ou escolha outro e-mail.",
      "auth/invalid-email": "Informe um e-mail valido.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/missing-password": "Informe uma senha.",
      "auth/operation-not-allowed": "Login por e-mail e senha nao esta ativado no Firebase.",
      "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir o login.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      "auth/user-not-found": "Usuario nao encontrado.",
      "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
      "auth/wrong-password": "Senha incorreta.",
    };

    return messages[code] || `Erro de autenticacao: ${code || error?.message || "erro desconhecido"}`;
  };

  const aplicarTokenFirebase = async (user) => {
    const idToken = await user.getIdToken(true);

    localStorage.setItem("token", idToken);
    setToken(idToken);

    api.defaults.headers.common.Authorization = `Bearer ${idToken}`;
  };

  const fazerLogin = async () => {
    try {
      setLoginErro("");

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        loginData.email,
        loginData.senha
      );

      await aplicarTokenFirebase(credential.user);
    } catch (error) {
      console.error(error);
      setLoginErro(getFirebaseAuthMessage(error));
    }
  };

  const fazerLoginGoogle = async () => {
    try {
      setLoginErro("");

      const credential = await signInWithPopup(firebaseAuth, googleProvider);

      await aplicarTokenFirebase(credential.user);
    } catch (error) {
      console.error(error);
      setLoginErro(getFirebaseAuthMessage(error));
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [cadastroData, setCadastroData] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const fazerCadastro = async () => {
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        cadastroData.email,
        cadastroData.senha
      );

      if (cadastroData.nome) {
        await updateProfile(credential.user, {
          displayName: cadastroData.nome,
        });
      }

      await aplicarTokenFirebase(credential.user);
    } catch (error) {
      console.error(error);
      setLoginErro(getFirebaseAuthMessage(error));
    }
  };

  const fazerLogout = async () => {
    await signOut(firebaseAuth);
    localStorage.removeItem("token");
    localStorage.removeItem("assinaturaPacote");
    delete api.defaults.headers.common.Authorization;
    setToken("");
    setSubscriptionStatus(null);
    setSubscriptionError("");
    setAssinatura("");
    setOnboardingPage("welcome");
    setPagina("dashboard");
    setSidebarOpen(true);
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization =
        `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      fazerLogout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const verificarAssinatura = async () => {
    try {
      setCheckingSubscription(true);
      setSubscriptionError("");

      const response = await api.get("/billing/status");
      const subscription = response.data.subscription;

      setSubscriptionStatus(subscription);

      if (subscription?.active) {
        localStorage.setItem("assinaturaPacote", subscription.plan || "Essencial");
        setAssinatura(subscription.plan || "Essencial");
      }

      return subscription;
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
      const subscription = error?.response?.data?.subscription;

      if (subscription) {
        setSubscriptionStatus(subscription);
      }

      setSubscriptionError(
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        "Nao foi possivel verificar o pagamento agora."
      );
      return null;
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    if (!token || !subscriptionEnforced) {
      setSubscriptionStatus(null);
      return;
    }

    verificarAssinatura();
  }, [token, subscriptionEnforced]);

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

  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
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

  const deletarEvento = async (eventoId) => {
    try {
      const idParaDeletar = eventoId || eventoSelecionado?.id || novoEvento.id;

      if (!idParaDeletar) {
        return;
      }

      await api.delete(`/eventos/${idParaDeletar}`);

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

  function openClientProfile(cliente) {
    setSelectedClientId(cliente.id);
    setClientProfileOpen(true);
  }

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

  const criarMovimentacao = async () => {
    if (!produtoId || !quantidadeMov || quantidadeMov <= 0) {
      alert("Selecione um produto e insira uma quantidade v\u00e1lida!");
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

  useEffect(() => {
    if (!token || (subscriptionEnforced && !subscriptionStatus?.active)) {
      return;
    }

    let cancelado = false;

    const carregarDadosIniciais = async () => {
      try {
        const [
          dashboardRes,
          clientesRes,
          produtosRes,
          movimentacoesRes,
          eventosRes,
        ] = await Promise.all([
          api.get("/dashboard"),
          api.get("/clientes"),
          api.get("/produtos"),
          api.get("/movimentacoes"),
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
  }, [token, subscriptionEnforced, subscriptionStatus?.active]);

  const eventosFiltrados = useMemo(() => eventos.filter((evento) => {
    if (filtroCalendario === "todos") return true;

    if (filtroCalendario === "concluidos") {
      return evento.concluido === true;
    }

    if (filtroCalendario === "pendentes") {
      return evento.concluido !== true;
    }

    return evento.tipo === filtroCalendario;
  }), [eventos, filtroCalendario]);

  const produtosFiltradosOrdenados = useMemo(() => {
    const termoBusca = buscaProduto.toLowerCase();

    return produtos
      .filter((p) => {
        const codigoProduto = p.sku || p.codigo || p.code || p.SKU || "";
        return (
          p.nome?.toLowerCase().includes(termoBusca) ||
          p.tipo?.toLowerCase().includes(termoBusca) ||
          codigoProduto.toLowerCase().includes(termoBusca)
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [produtos, buscaProduto]);

  const botaoMenuClasse = (nomePagina) =>
    `shrink-0 rounded-xl px-4 py-4 text-left text-base font-bold transition-all lg:w-full ${pagina === nomePagina
      ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-fuchsia-500/20"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  const menuItems = [
    ["dashboard", "Dashboard"],
    ["clientes", "Clientes"],
    ["produtos", "Produtos"],
    ["services", "Serviços"],
    ["ordens-servico", "Ordens de Serviço"],
    ["equipamentos", "Equipamentos"],
    ["movimentacoes", "Movimentações"],
    ["financeiro", "Financeiro"],
    ["calendario", "Calendário"],
  ];

  const subscriptionPlans = [
    {
      pacote: "Plano essencial",
      preco: "R$49,90/mês",
      paraQuem: "Profissional autônomo",
      incluido: "Clientes, equipamentos, serviços, OS e agenda",
      paymentLink: "https://mpago.la/2BTRPQd",
    },
    {
      pacote: "Essencial anual",
      preco: "R$499,00/ano",
      paraQuem: "Quem quer manter o sistema ativo o ano inteiro",
      incluido: "Plano essencial com pagamento anual único pelo Mercado Pago",
      paymentLink: "https://mpago.la/1zEBQLR",
      buttonDisabled: true,
    },
    {
      pacote: "Plano Profissional",
      preco: "R$89,90/mês",
      paraQuem: "Equipes e operações em crescimento",
      incluido: "Recursos completos do Essencial com maior capacidade operacional",
      paymentLink: "https://mpago.la/1dXRoed",
      buttonDisabled: true,
    },
    {
      pacote: "Profissional Anual",
      preco: "R$899,00/ano",
      paraQuem: "Equipes que preferem pagamento anual",
      incluido: "Plano profissional com pagamento anual único pelo Mercado Pago",
      paymentLink: "https://mpago.la/1scvFQy",
      buttonDisabled: true,
    },
    {
      pacote: "Plano Premium",
      preco: "R$149,90/mês",
      paraQuem: "Operações avançadas com maior volume",
      incluido: "Recursos completos do Profissional com prioridade para expansão",
      paymentLink: "https://mpago.la/2YifMnW",
      buttonDisabled: true,
    },
    {
      pacote: "Premium Anual",
      preco: "Em breve",
      paraQuem: "Plano anual em preparação",
      incluido: "Valor e link serão definidos antes da liberação",
      // paymentLink: "adicione-o-link-do-premium-anual",
      buttonDisabled: true,
    },
  ];

  function handleMenuClick(key) {
    setPagina(key);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }

  function handleAssinarPacote(pacote) {
    localStorage.setItem("assinaturaPacote", pacote);
    setAssinatura(pacote);
    setPagina("dashboard");
  }

  if (!assinatura) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-[#060b1b] text-slate-100">
        {onboardingPage === "welcome" ? (
          <>
            <img
              src={welcomeBg}
              alt=""
              className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.9)_0%,rgba(2,6,23,0.7)_42%,rgba(2,6,23,0.28)_100%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_48%,rgba(99,102,241,0.28),transparent_34%)]" />
          </>
        ) : onboardingPage === "planos" ? (
          <>
            <img
              src={plansBg}
              alt=""
              className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.78)_36%,rgba(2,6,23,0.92)_100%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_34%)]" />
          </>
        ) : (
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(99,102,241,0.28)_0%,rgba(15,23,42,0.08)_34%,rgba(2,6,23,1)_72%)]" />
        )}
        <img
          src={heroImage}
          alt=""
          className={`pointer-events-none absolute right-[-4rem] top-20 -z-10 hidden w-[28rem] opacity-20 blur-[1px] lg:block xl:right-20 ${
            onboardingPage === "welcome" ? "lg:hidden" : ""
          }`}
        />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-7 sm:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-violet-300">
              Nuvix Organizer
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Sistema de gestão para serviços e equipamentos
            </h1>
          </div>
        </header>

        {onboardingPage === "welcome" ? (
          <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-12 px-5 py-10 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)] xl:gap-16">
            <section className="max-w-4xl">
              <p className="inline-flex rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.28em] text-fuchsia-200">
                Bem-vindo
              </p>
              <h2 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] text-white sm:text-6xl xl:text-7xl">
                Organize clientes, equipamentos, ordens e agenda em um só lugar.
              </h2>
              <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
                Um painel completo para profissionais que precisam controlar servi\u00e7os,
                ativos, histórico de atendimento e comprovantes com mais clareza.
              </p>

              <div className="mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Clientes", "perfil e histórico"],
                  ["Serviços", "ordens e status"],
                  ["Agenda", "datas importantes"],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4 shadow-xl shadow-slate-950/30 backdrop-blur"
                  >
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setOnboardingPage("planos")}
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-fuchsia-950/40 transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  Ver pacotes
                </button>
                <span className="text-base font-semibold text-slate-400">
                  Comece pelo plano ideal para sua rotina.
                </span>
              </div>
            </section>

            <section className="relative grid gap-5">
              <div className="relative mb-2 hidden justify-end lg:flex">
                <img
                  src={heroImage}
                  alt=""
                  className="w-52 drop-shadow-[0_28px_60px_rgba(168,85,247,0.28)]"
                />
              </div>
              {[
                ["Clientes", "Cadastro, perfil e histórico organizados."],
                ["Equipamentos", "Ativos vinculados aos clientes, com garantia e detalhes."],
                ["Ordens de Serviço", "Serviços, produtos, status e comprovante para envio."],
              ].map(([title, text], index) => (
                <article
                  key={title}
                  className={`rounded-[1.5rem] border border-slate-700/60 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/50 ${
                    index === 1 ? "lg:ml-10" : index === 2 ? "lg:ml-20" : ""
                  }`}
                >
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">
                    {title}
                  </p>
                  <p className="mt-3 text-xl font-semibold leading-8 text-slate-100">
                    {text}
                  </p>
                </article>
              ))}
            </section>
          </main>
        ) : (
          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-7xl flex-col justify-center px-5 py-8 sm:px-10">
            <div className="mb-8 max-w-5xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-fuchsia-300">
                Assinatura
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
                Escolha o plano ideal.
              </h2>
              <p className="mt-4 text-xl leading-8 text-slate-300">
                O sistema será liberado após a seleção de um pacote.
              </p>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
                6 planos disponíveis: Essencial mensal, Essencial anual, Profissional mensal,
                Profissional anual, Premium mensal e Premium anual.
              </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <article
                  key={plan.pacote}
                  className="flex min-h-[27rem] min-w-0 flex-col rounded-[1.5rem] border border-slate-700/60 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40"
                >
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
                    {plan.pacote}
                  </p>
                  <h3 className="mt-3 break-words text-3xl font-black leading-tight text-white">
                    {plan.preco}
                  </h3>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl bg-slate-900/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Para quem
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7">{plan.paraQuem}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Incluído
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7">{plan.incluido}</p>
                    </div>
                  </div>
                  {plan.buttonDisabled ? (
                    <button
                      type="button"
                      disabled
                      className="mt-auto cursor-not-allowed rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-center text-base font-black leading-6 text-slate-300 opacity-85"
                    >
                      Assinar {plan.pacote}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssinarPacote(plan.pacote)}
                      className="mt-auto rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-4 text-base font-black text-white transition hover:opacity-90"
                    >
                      Assinar {plan.pacote}
                    </button>
                  )}
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOnboardingPage("welcome")}
              className="mt-8 self-start rounded-2xl border border-slate-600 px-6 py-3 text-base font-bold text-slate-200 transition hover:bg-slate-900"
            >
              Voltar
            </button>
          </main>
        )}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.18),_transparent_22%),bg-slate-950] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 shadow-2xl shadow-violet-500/20 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-indigo-500 via-violet-600 to-fuchsia-500 px-8 py-10 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-slate-200/80">Bem-vindo ao</p>
            <h1 className="text-5xl font-black tracking-tight text-white">Nuvix Organizer</h1>
            <p className="mt-4 text-lg leading-8 text-slate-200/85">
              Fa\u00e7a login para acessar o painel de controle e gerenciar seu neg\u00f3cio com seguran\u00e7a.
            </p>
          </div>

          <div className="space-y-7 px-8 py-10 sm:px-10">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-7 shadow-[0_30px_80px_-40px_rgba(124,58,237,0.75)]">
              <p className="mb-6 text-base font-bold uppercase tracking-[0.24em] text-slate-400">
                {isRegistering ? "Crie sua conta" : "Acesse sua conta"}
              </p>

              {isRegistering && (
                <input
                  type="text"
                  placeholder="Nome"
                  className="mb-4 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-lg text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  value={cadastroData.nome}
                  onChange={(e) => {
                    setLoginErro("");
                    setCadastroData({
                      ...cadastroData,
                      nome: e.target.value,
                    });
                  }}
                />
              )}

              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-lg text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                value={isRegistering ? cadastroData.email : loginData.email}
                onChange={(e) => {
                  if (isRegistering) {
                    setLoginErro("");
                    setCadastroData({
                        ...cadastroData,
                        email: e.target.value,
                    });
                    return;
                  }

                  setLoginErro("");
                  setLoginData({
                    ...loginData,
                    email: e.target.value,
                  });
                }}
              />

              <div className="relative mt-4">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Senha"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 pr-14 text-lg text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  value={isRegistering ? cadastroData.senha : loginData.senha}
                  onChange={(e) => {
                    if (isRegistering) {
                      setLoginErro("");
                      setCadastroData({
                          ...cadastroData,
                          senha: e.target.value,
                      });
                      return;
                    }

                    setLoginErro("");
                    setLoginData({
                      ...loginData,
                      senha: e.target.value,
                    });
                  }}
                />
                <button
                  type="button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                >
                  {mostrarSenha ? (
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <path d="M2 2l20 20" />
                      <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {loginErro && (
                <div
                  role="alert"
                  className="mt-4 flex gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-left shadow-lg shadow-rose-950/20"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-300/20">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-base font-semibold text-rose-100">
                      {isRegistering ? "Cadastro inv\u00e1lido" : "Login inv\u00e1lido"}
                    </p>
                    <p className="mt-1 text-base leading-6 text-rose-100/75">
                      {loginErro}
                    </p>
                  </div>
                </div>
              )}

              {!isRegistering && (
                <div className="mt-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-700/70" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      ou
                    </span>
                    <span className="h-px flex-1 bg-slate-700/70" />
                  </div>

                  <button
                    type="button"
                    onClick={fazerLoginGoogle}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 text-lg font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                      />
                    </svg>
                    Entrar com Google
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={isRegistering ? fazerCadastro : fazerLogin}
              className="w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-5 text-xl font-bold text-white shadow-xl shadow-fuchsia-500/25 transition hover:-translate-y-0.5 hover:shadow-fuchsia-500/40"
            >
              {isRegistering ? "Cadastrar" : "Entrar"}
            </button>

            <p className="text-center text-lg text-slate-400">
              {isRegistering ? (
                <>
                  Já possui conta?{' '}
                  <button
                    onClick={() => {
                      setLoginErro("");
                      setIsRegistering(false);
                    }}
                    className="font-semibold text-slate-100 hover:text-white"
                  >
                    Fazer login
                  </button>
                </>
              ) : (
                <>
                  Ainda n\u00e3o possui conta?{' '}
                  <button
                    onClick={() => {
                      setLoginErro("");
                      setIsRegistering(true);
                    }}
                    className="font-semibold text-slate-100 hover:text-white"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionEnforced && (checkingSubscription || !subscriptionStatus?.active)) {
    const paymentLink =
      subscriptionStatus?.paymentLink || "https://mpago.la/2BTRPQd";

    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_25%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] px-4 py-10 text-slate-100">
        <section className="w-full max-w-2xl rounded-[1.5rem] border border-slate-700/60 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet-300">
            Assinatura
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Pagamento necessario
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            O acesso ao sistema e liberado somente apos a confirmacao da mensalidade do plano Essencial.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
              Plano Essencial
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              R$ 49,90 / mes
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Depois do pagamento, clique em verificar para o sistema consultar o Mercado Pago.
            </p>
          </div>

          {subscriptionError && (
            <div className="mt-5 rounded-2xl border border-amber-700/50 bg-amber-950/40 p-4 text-sm font-semibold text-amber-200">
              {subscriptionError}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-center text-lg font-black text-white transition hover:opacity-90"
            >
              Pagar agora
            </a>

            <button
              type="button"
              onClick={verificarAssinatura}
              disabled={checkingSubscription}
              className="min-h-14 flex-1 rounded-2xl border border-slate-600 bg-slate-900 px-5 py-3 text-lg font-black text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingSubscription ? "Verificando..." : "Verificar pagamento"}
            </button>
          </div>

          <button
            type="button"
            onClick={fazerLogout}
            className="mt-5 rounded-xl px-4 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
          >
            Sair e voltar ao inicio
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col text-slate-100 app-shell lg:flex-row">
      <div className="flex shrink-0 items-center border-b border-slate-700/50 bg-slate-950/80 px-3 py-2 text-white shadow-2xl shadow-slate-950/30 lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-2 lg:py-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label={sidebarOpen ? "Esconder menu" : "Mostrar menu"}
          title={sidebarOpen ? "Esconder menu" : "Mostrar menu"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/95 text-white shadow-xl shadow-slate-950/30 backdrop-blur transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <span className="relative h-5 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 rounded-full bg-current transition ${
                sidebarOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2 h-0.5 w-6 rounded-full bg-current transition ${
                sidebarOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-4 h-0.5 w-6 rounded-full bg-current transition ${
                sidebarOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {sidebarOpen && (
      <aside className="flex w-full flex-col px-4 py-4 text-white shadow-2xl sidebar-panel lg:min-h-screen lg:w-[20rem] xl:w-[22rem] lg:rounded-r-[1.5rem] lg:px-6 xl:px-7 lg:py-7">
        <div className="mb-5 lg:mb-9">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
            Painel
          </p>
          <div className="flex items-center justify-between gap-3 lg:block">
            <h2 className="text-3xl font-black tracking-tight lg:text-[2.15rem]">Nuvix Organizer</h2>
            <button
              onClick={fazerLogout}
              className="rounded-lg bg-red-500 px-4 py-2 text-base font-bold text-white hover:bg-red-600 lg:hidden"
            >
              Sair
            </button>
          </div>
          <p className="mt-3 hidden text-base leading-7 text-slate-400 lg:block">
            Gestão organizada e pronta para o dia a dia.
          </p>
        </div>

        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {menuItems.map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleMenuClick(key)}
              className={botaoMenuClasse(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={fazerLogout}
          className="mt-6 hidden rounded-xl bg-red-500 px-4 py-3.5 text-left text-base font-bold hover:bg-red-600 lg:mt-auto lg:block"
        >
          Sair
        </button>
      </aside>
      )}

      <main className="min-w-0 flex-1 px-3 py-4 md:px-5 lg:px-6 lg:py-6 xl:px-7">
        <div className="w-full min-w-0">
          {pagina === "dashboard" && (
            <div className="flex min-h-[calc(100svh-4rem)] flex-col">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Painel principal
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-300">
                  Visão rápida dos números mais importantes para o seu negócio.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-h-[8rem] rounded-[1.25rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-2xl shadow-fuchsia-500/20 ring-1 ring-white/10 sm:rounded-[1.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Clientes
                  </p>
                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">{dados.totalClientes}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Total de clientes no sistema</p>
                </div>
                <div className="min-h-[8rem] rounded-[1.25rem] bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-500 p-5 text-white shadow-2xl shadow-cyan-500/20 ring-1 ring-white/10 sm:rounded-[1.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Produtos
                  </p>
                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">{dados.totalProdutos}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Produtos cadastrados</p>
                </div>
                <div className="min-h-[8rem] rounded-[1.25rem] bg-gradient-to-br from-emerald-600 via-lime-600 to-amber-500 p-5 text-white shadow-2xl shadow-emerald-500/20 ring-1 ring-white/10 sm:rounded-[1.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Estoque
                  </p>
                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">{dados.estoqueTotal}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Unidades em estoque</p>
                </div>
                <div className="min-h-[8rem] rounded-[1.25rem] bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-5 text-white shadow-2xl shadow-rose-500/20 ring-1 ring-white/10 sm:rounded-[1.5rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-100/70">
                    Gastos
                  </p>
                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">R$ {dados.totalGastos}</h2>
                  <p className="mt-3 text-sm text-slate-100/80">Total gasto no período</p>
                </div>
              </div>

              <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,2.4fr)_minmax(20rem,1fr)]">
                <div className="glass-card flex min-h-[24rem] flex-col rounded-[1.25rem] p-4 ring-1 ring-slate-200/10 sm:rounded-[1.5rem] sm:p-5 xl:min-h-0">
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

                  <div className="min-h-[18rem] flex-1" style={{ width: "100%", minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={dadosGrafico}>
                        <XAxis dataKey="mes" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid #334155' }} />
                        <Bar dataKey="valor" fill="#7c3aed" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-rows-2">
                  <div className="glass-card rounded-[1.25rem] p-4 ring-1 ring-slate-200/10 sm:rounded-[1.5rem] sm:p-5">
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

                  <div className="glass-card rounded-[1.25rem] p-4 ring-1 ring-slate-200/10 sm:rounded-[1.5rem] sm:p-5">
                    <h2 className="text-xl font-bold mb-4 text-slate-100">
                      Estoque Baixo
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
            </div>
          )}

          {pagina === "services" && (
            <Suspense fallback={<PageFallback />}>
              <Services />
            </Suspense>
          )}

          {pagina === "ordens-servico" && (
            <Suspense fallback={<PageFallback />}>
              <OrdensServico />
            </Suspense>
          )}

          {pagina === "equipamentos" && (
            <Suspense fallback={<PageFallback />}>
              <Equipamentos />
            </Suspense>
          )}

          {pagina === "clientes" && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Cadastro
                </p>
                <div className="mt-2 flex flex-col items-center gap-3 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                  <div className="mx-auto lg:mx-0">
                    <h1 className="text-3xl font-black tracking-tight text-slate-100">
                      Clientes
                    </h1>
                    <p className="mt-1 text-base text-slate-300">
                      Gerencie os clientes cadastrados em um unico lugar.
                    </p>
                  </div>

                  {editandoId && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                      Editando cliente. Revise os dados e clique em salvar.
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-auto w-full max-w-5xl rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-[0.7fr_0.85fr_0.62fr_0.72fr_auto]">
                  <input
                    className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <input
                    className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                  <input
                    className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />

                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <button
                      onClick={editandoId ? atualizarCliente : criarCliente}
                    className="h-10 rounded-lg bg-black px-4 text-sm font-semibold text-white"
                    >
                      {editandoId ? "Atualizar" : "Adicionar"}
                    </button>

                    {editandoId && (
                      <button
                        onClick={limparFormulario}
                        className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-950/40">
                  <div className="hidden grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] bg-slate-900 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 md:grid">
                    <div className="px-2.5 py-2">Nome</div>
                    <div className="px-2.5 py-2">Email</div>
                    <div className="px-2.5 py-2">Telefone</div>
                    <div className="px-2.5 py-2">Endereco</div>
                    <div className="px-2.5 py-2 text-center">Acoes</div>
                  </div>

                  {clientes.length === 0 && (
                    <div className="bg-slate-950/30 px-6 py-12 text-center text-sm text-slate-400">
                      Nenhum cliente cadastrado.
                    </div>
                  )}

                  {clientes.map((c) => (
                    <div key={c.id} className="border-t border-slate-700 bg-slate-950/80 first:border-t-0">
                      <div className="grid gap-2 px-2.5 py-2 md:grid-cols-[0.65fr_0.9fr_0.65fr_0.68fr_0.55fr] md:items-center md:gap-1.5 md:px-2.5">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Nome
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-100">{c.nome}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Email
                          </p>
                          <p className="truncate text-sm text-slate-300">{c.email}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Telefone
                          </p>
                          <p className="truncate text-sm text-slate-300">{c.telefone}</p>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                            Endereco
                          </p>
                          <p className="truncate text-sm text-slate-300">{c.endereco}</p>
                        </div>

                        <div className="flex gap-1 md:justify-center">
                          <button
                            onClick={() => openClientProfile(c)}
                            className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => {
                              setEditandoId(c.id);
                              setNome(c.nome);
                              setEmail(c.email);
                              setTelefone(c.telefone);
                              setEndereco(c.endereco);
                            }}
                            className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarCliente(c.id)}
                            className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100"
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
            <div className="mx-auto flex w-full max-w-5xl flex-col rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Estoque</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">Produtos</h1>
                <p className="mt-1 text-sm text-slate-400">Gerencie seu cat\u00e1logo de produtos e estoque.</p>
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
                  placeholder="C\u00f3digo SKU (auto se vazio)"
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
                  placeholder="Pre\u00e7o"
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
                  <option value="eletronico">Eletr\u00f4nico</option>
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
                  placeholder="Buscar por nome, tipo ou c\u00f3digo SKU..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900 px-4 py-2.5 pl-10 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
                <span className="absolute left-3 top-2.5 text-slate-500 text-base">ðŸ”</span>
              </div>

              {/* LISTA */}
              <div className="rounded-2xl bg-slate-950/40 p-3 sm:rounded-3xl sm:p-4">
                {produtosFiltradosOrdenados.length === 0 ? (
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
                                sem c\u00f3digo
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
                              Estoque: {p.quantidade} {p.quantidade <= 3 ? "Baixo" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
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
            <div className="mx-auto flex w-full max-w-5xl flex-col rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Movimentações
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
                  Movimentações
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Registre entradas e saídas para manter o estoque atualizado e o histórico organizado.
                </p>
              </div>

              <div className="mb-5 rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4 shadow-inner shadow-slate-100/5 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-black text-slate-100">Registrar movimentação</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Informe o produto, o tipo e a quantidade movimentada.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_0.9fr_0.9fr_auto]">
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

                <select
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Sa\u00edda</option>
                </select>

                <input
                  type="number"
                  className="min-w-0 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Quantidade"
                  value={quantidadeMov || ""}
                  onChange={(e) => setQuantidadeMov(e.target.value ? Number(e.target.value) : 0)}
                />

                <button
                  onClick={criarMovimentacao}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-white transition hover:opacity-90 sm:w-auto sm:min-w-[8rem]"
                >
                  Registrar
                </button>
                </div>
              </div>

              <div className="flex-1 rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4 shadow-inner shadow-slate-100/5 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-black text-slate-100">Hist\u00f3rico de movimenta\u00e7\u00f5es</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Acompanhe as entradas e sa\u00eddas registradas no estoque.
                  </p>
                </div>

                {movimentacoes.length === 0 ? (
                  <p className="text-slate-400">Nenhuma movimentação cadastrada</p>
                ) : (
                  movimentacoes.map((m) => (
                    <div
                      key={m.id}
                      className="mb-3 flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-sm shadow-slate-950/30 last:mb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-100">
                          {m.produto?.nome || "Produto n\u00e3o encontrado"}
                        </p>

                        <p
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-black ${m.tipo === "entrada" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}
                        >
                          {m.tipo.toUpperCase()} - {m.quantidade}
                        </p>

                        <p className="text-xs text-slate-400">
                          {new Date(m.data).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {pagina === "financeiro" && (
            <Suspense fallback={<PageFallback />}>
              <Financeiro />
            </Suspense>
          )}
          {pagina === "calendario" && (
            <div className="mx-auto flex w-full max-w-5xl flex-col rounded-[1.25rem] glass-card p-4 text-left ring-1 ring-slate-200/10 sm:p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Agenda
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
                    Calend\u00e1rio
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Visualize eventos, compromissos e datas importantes do sistema.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="rounded-lg bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100">
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
                <div className="mb-4 rounded-3xl border border-slate-700 bg-slate-950/50 p-4">
                  <h2 className="mb-2 font-bold text-slate-100">
                    ðŸ”” Lembretes
                  </h2>

                  <div className="flex flex-col gap-2">
                    {lembretes.map((evento) => (
                      <div
                        key={evento.id}
                        className="rounded-3xl bg-slate-900/80 p-3 shadow-sm shadow-slate-950/30"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-100">{evento.title}</p>
                            <p className="mt-1 text-sm text-slate-400">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option className="bg-slate-950 text-slate-100" value="todos">Todos</option>
                  <option className="bg-slate-950 text-slate-100" value="reuniao">Reuni\u00f5es</option>
                  <option className="bg-slate-950 text-slate-100" value="entrega">Entregas</option>
                  <option className="bg-slate-950 text-slate-100" value="financeiro">Financeiro</option>
                  <option className="bg-slate-950 text-slate-100" value="tarefa">Tarefas</option>
                  <option className="bg-slate-950 text-slate-100" value="concluidos">Conclu\u00eddos</option>
                  <option className="bg-slate-950 text-slate-100" value="pendentes">Pendentes</option>
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
                    month: "M\u00eas",
                    week: "Semana",
                  }}
                />
              </div>

              {mostrarModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center">
                  <div className="w-full max-w-md rounded-2xl bg-slate-950/95 p-5 text-left shadow-2xl ring-1 ring-slate-200/10 sm:p-6">
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Agenda
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
                        Novo Evento
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Preencha os dados para registrar no calend\u00e1rio.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                          T\u00edtulo
                        </span>
                        <input
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                          placeholder="Ex: Reuni\u00e3o com cliente"
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
                          <option value="reuniao">Reuni\u00e3o</option>
                          <option value="entrega">Entrega</option>
                          <option value="tarefa">Tarefa</option>
                          <option value="financeiro">Financeiro</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
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

                      <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center">
                  <div className="w-full max-w-md rounded-2xl bg-slate-950/95 p-5 text-left shadow-2xl ring-1 ring-slate-200/10 sm:p-6">
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

          {clientProfileOpen && (
            <Suspense fallback={null}>
              <ClientProfileModal
                isOpen={clientProfileOpen}
                clientId={selectedClientId}
                onClose={() => setClientProfileOpen(false)}
              />
            </Suspense>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
