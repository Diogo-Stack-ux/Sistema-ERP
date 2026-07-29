import { useEffect, useState } from "react";
import { getServices, deleteService } from "../../services/serviceApi";
import ServiceModal from "./ServiceModal";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function loadServices() {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function handleEdit(service) {
    setSelectedService(service);
    setIsModalOpen(true);
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setSelectedService(null);
  }

  async function handleDelete(id) {
    try {
      await deleteService(id);
      await loadServices();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Erro ao excluir serviço");
    } finally {
      setDeletingId(null);
    }
  }

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col rounded-[1.25rem] glass-card p-4 ring-1 ring-slate-200/10 sm:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Cadastro
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-100">
              Serviços
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Cadastre e acompanhe os serviços oferecidos pelo seu negócio.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-lg bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100">
              {services.length} serviço{services.length === 1 ? "" : "s"}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
            >
              Novo Serviço
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-6 text-sm text-slate-400">
            Carregando serviços...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-100">
              Nenhum serviço cadastrado
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Clique em Novo Serviço para registrar o primeiro item.
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{service.nome}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {service.categoria || "Sem categoria"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      service.ativo
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-700/70 text-slate-300"
                    }`}
                  >
                    {service.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {service.descricao && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-400">{service.descricao}</p>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <div className="rounded-xl bg-slate-900/80 p-2">
                    <span className="block text-slate-500">Valor</span>
                    <strong className="text-emerald-300">{formatCurrency(service.valor)}</strong>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2">
                    <span className="block text-slate-500">Garantia</span>
                    <strong className="text-slate-200">
                      {service.garantia ? `${service.garantia}d` : "-"}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2">
                    <span className="block text-slate-500">Duracao</span>
                    <strong className="text-slate-200">
                      {service.duracao ? `${service.duracao}min` : "-"}
                    </strong>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingId(service.id)}
                    className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden space-y-4 md:block">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-slate-700/60 bg-slate-950/50 p-4 shadow-lg shadow-slate-950/20"
              >
                <div className="grid gap-3 xl:grid-cols-[1.25fr_0.95fr_0.75fr_0.75fr_0.75fr_0.7fr_auto] xl:items-stretch">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Nome
                    </span>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      {service.nome}
                    </p>
                    {service.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                        {service.descricao}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Categoria
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {service.categoria || "Sem categoria"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Valor
                    </span>
                    <p className="mt-2 font-bold text-emerald-300">
                      {formatCurrency(service.valor)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Garantia
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {service.garantia ? `${service.garantia} dias` : "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      DuraÃ§Ã£o
                    </span>
                    <p className="mt-2 font-semibold text-slate-100">
                      {service.duracao ? `${service.duracao} min` : "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </span>
                    <div className="mt-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          service.ativo
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-slate-700/70 text-slate-300"
                        }`}
                      >
                        {service.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 xl:flex-col xl:items-stretch xl:justify-center">
                    <button
                      onClick={() => handleEdit(service)}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingId(service.id)}
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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Garantia</th>
                    <th className="px-4 py-3 font-semibold">Duração</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/60">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="text-slate-300 transition hover:bg-slate-900/60"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-100">{service.nome}</p>
                        {service.descricao && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {service.descricao}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {service.categoria || "Sem categoria"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-300">
                        {formatCurrency(service.valor)}
                      </td>
                      <td className="px-4 py-4">
                        {service.garantia ? `${service.garantia} dias` : "-"}
                      </td>
                      <td className="px-4 py-4">
                        {service.duracao ? `${service.duracao} min` : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            service.ativo
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700/70 text-slate-300"
                          }`}
                        >
                          {service.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => setDeletingId(service.id)}
                            className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300"
                          >
                            🗑️ Excluir
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950/95 p-6 shadow-2xl ring-1 ring-slate-200/10">
            <h3 className="text-lg font-black text-slate-100">Excluir serviço?</h3>
            <p className="mt-2 text-sm text-slate-400">
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={loadServices}
        service={selectedService}
      />
    </>
  );
}

export default Services;
