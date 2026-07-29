import { useEffect, useState } from "react";
import EquipmentForm from "./EquipmentForm";
import {
  createEquipamento,
  updateEquipamento,
} from "../services/equipamentoApi";

const initialForm = {
  nome: "",
  tipo: "",
  marca: "",
  modelo: "",
  numeroSerie: "",
  identificacao: "",
  dataCompra: "",
  garantiaAte: "",
  observacoes: "",
  ativo: true,
};

function EquipmentModal({
  isOpen,
  onClose,
  clienteId,
  equipamento,
  onSuccess,
}) {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (equipamento) {
      setFormData({
        nome: equipamento.nome || "",
        tipo: equipamento.tipo || "",
        marca: equipamento.marca || "",
        modelo: equipamento.modelo || "",
        numeroSerie: equipamento.numeroSerie || "",
        identificacao: equipamento.identificacao || "",
        dataCompra: equipamento.dataCompra
          ? String(equipamento.dataCompra).split("T")[0]
          : "",
        garantiaAte: equipamento.garantiaAte
          ? String(equipamento.garantiaAte).split("T")[0]
          : "",
        observacoes: equipamento.observacoes || "",
        ativo: equipamento.ativo ?? true,
      });
    } else {
      setFormData(initialForm);
    }

    setErro("");
  }, [isOpen, equipamento]);

  if (!isOpen) return null;

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!clienteId) {
      setErro("Cliente nao informado.");
      return;
    }

    if (!formData.nome.trim()) {
      setErro("Informe o nome do equipamento.");
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const payload = {
        clienteId: Number(clienteId),
        nome: formData.nome.trim(),
        tipo: formData.tipo.trim() || null,
        marca: formData.marca.trim() || null,
        modelo: formData.modelo.trim() || null,
        numeroSerie: formData.numeroSerie.trim() || null,
        identificacao: formData.identificacao.trim() || null,
        dataCompra: formData.dataCompra || null,
        garantiaAte: formData.garantiaAte || null,
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
      };

      if (equipamento) {
        await updateEquipamento(equipamento.id, payload);
      } else {
        await createEquipamento(payload);
      }

      setFormData(initialForm);

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);

      setErro(
        error?.response?.data?.error ||
          "Nao foi possivel salvar o equipamento."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-10 sm:items-center">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-950 p-5 text-slate-100 shadow-2xl ring-1 ring-slate-700 sm:max-h-[calc(100svh-80px)] sm:p-6 sm:overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Equipamento
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {equipamento ? "Editar equipamento" : "Novo equipamento"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Cadastre veiculos, maquinas, notebooks, aparelhos e outros ativos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>

        <EquipmentForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          error={erro}
          submitLabel={
            equipamento
              ? "Atualizar equipamento"
              : "Cadastrar equipamento"
          }
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

export default EquipmentModal;
