
import { useEffect, useState } from "react";

const initialForm = {
  clienteId: "",
  equipamentoId: "",
  titulo: "",
  mensagem: "",
  dataLembrete: "",
  canal: "SISTEMA",
};

export default function LembreteModal({
  isOpen,
  onClose,
  onSave,
  clientes,
  equipamentos,
  loading,
  lembrete = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (lembrete) {
      const data = new Date(lembrete.dataLembrete);

      const dataLocal = new Date(
        data.getTime() - data.getTimezoneOffset() * 60000
      )
        .toISOString() 
        .slice(0, 16);

      setForm({
        clienteId: String(lembrete.clienteId),
        equipamentoId: lembrete.equipamentoId
          ? String(lembrete.equipamentoId)
          : "",
        titulo: lembrete.titulo || "",
        mensagem: lembrete.mensagem || "",
        dataLembrete: dataLocal,
        canal: lembrete.canal || "SISTEMA",
      });
    } else {
      setForm({ ...initialForm });
    }

    setErro("");
  }, [isOpen, lembrete]);

  if (!isOpen) return null;

  const equipamentosCliente = equipamentos.filter(
    (equipamento) =>
      Number(equipamento.clienteId) === Number(form.clienteId)
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "clienteId" ? { equipamentoId: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.clienteId || !form.titulo.trim() || !form.dataLembrete) {
      setErro("Preencha cliente, título e data.");
      return;
    }

    const data = new Date(form.dataLembrete);

    if (Number.isNaN(data.getTime())) {
      setErro("Informe uma data válida.");
      return;
    }

    try {
      setErro("");

      await onSave({
        clienteId: Number(form.clienteId),
        equipamentoId: form.equipamentoId
          ? Number(form.equipamentoId)
          : null,
        titulo: form.titulo.trim(),
        mensagem: form.mensagem.trim() || null,
        dataLembrete: data.toISOString(),
        canal: form.canal,
      });
    } catch (error) {
      setErro(
        error?.response?.data?.error ||
        "Não foi possível cadastrar o lembrete."
      );
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100 outline-none focus:border-violet-500";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-100 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">
            {lembrete ? "Editar lembrete" : "Novo lembrete"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold">Cliente *</label>
            <select
              name="clienteId"
              value={form.clienteId}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">
              Equipamento (opcional)
            </label>
            <select
              name="equipamentoId"
              value={form.equipamentoId}
              onChange={handleChange}
              disabled={!form.clienteId}
              className={inputClass}
            >
              <option value="">Nenhum equipamento</option>
              {equipamentosCliente.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Título *</label>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              required
              placeholder="Ex.: Revisão preventiva"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Mensagem</label>
            <textarea
              name="mensagem"
              value={form.mensagem}
              onChange={handleChange}
              rows={3}
              placeholder="Detalhes do lembrete..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Data e hora *</label>
            <input
              type="datetime-local"
              name="dataLembrete"
              value={form.dataLembrete}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">
              Canal
            </label>
            <select
              name="canal"
              value={form.canal}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="SISTEMA">Sistema</option>
              <option value="EMAIL">E-mail</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            <p className="mt-2 text-xs text-slate-400">
              O canal é apenas registrado. O envio automático
              será implementado posteriormente.
            </p>
          </div>

          {erro && (
            <p className="rounded-xl bg-red-950/40 p-3 text-sm text-red-300">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-3 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : lembrete
                ? "Salvar alterações"
                : "Cadastrar lembrete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
