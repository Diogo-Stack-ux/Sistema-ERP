import { useState } from "react";
import { createPortal } from "react-dom";
import { createService } from "../../services/serviceApi";

function ServiceModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    valor: "",
    garantia: "",
    duracao: "",
    ativo: true,
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setFormData({
      nome: "",
      descricao: "",
      categoria: "",
      valor: "",
      garantia: "",
      duracao: "",
      ativo: true,
    });
  }

  function handleClose() {
    if (loading) {
      return;
    }

    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await createService({
        ...formData,
        valor: Number(formData.valor),
        garantia: formData.garantia ? Number(formData.garantia) : null,
        duracao: formData.duracao ? Number(formData.duracao) : null,
      });

      await onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar serviço");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-300";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 px-4 py-8 backdrop-blur-sm lg:items-center">
      <div className="my-auto w-full max-w-2xl rounded-2xl bg-slate-950/95 p-5 text-left shadow-2xl ring-1 ring-slate-200/10 sm:p-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Serviços
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
              Novo Serviço
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Preencha os dados para cadastrar um novo serviço.
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

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelClass}>Nome</span>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Ex: Instalação"
              />
            </label>

            <label className="sm:col-span-2">
              <span className={labelClass}>Descrição</span>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="min-h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Detalhes do serviço"
              />
            </label>

            <label>
              <span className={labelClass}>Categoria</span>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: Manutenção"
              />
            </label>

            <label>
              <span className={labelClass}>Valor</span>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="0,00"
              />
            </label>

            <label>
              <span className={labelClass}>Garantia (dias)</span>
              <input
                type="number"
                name="garantia"
                value={formData.garantia}
                onChange={handleChange}
                className={inputClass}
                placeholder="30"
              />
            </label>

            <label>
              <span className={labelClass}>Duração (min)</span>
              <input
                type="number"
                name="duracao"
                value={formData.duracao}
                onChange={handleChange}
                className={inputClass}
                placeholder="60"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="h-4 w-4 accent-violet-500"
              />
              <span className="text-sm font-semibold text-slate-200">
                Serviço ativo
              </span>
            </label>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ServiceModal;
