import { useEffect, useState } from "react";
import { getServices } from "../../services/serviceApi";
import ServiceModal from "./ServiceModal";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <>
      <section className="mx-auto w-full max-w-5xl rounded-[1.5rem] glass-card p-5 ring-1 ring-slate-200/10">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Cadastro
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
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
            className="rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
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
        <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/50">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </section>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadServices}
      />
    </>
  );
}

export default Services;
