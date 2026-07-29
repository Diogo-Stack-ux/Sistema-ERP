import EquipmentHeader from "./EquipmentHeader";
import EquipmentStats from "./EquipmentStats";
import EquipmentTimeline from "./EquipmentTimeline";

function EquipmentWorkspace({ equipamento }) {
  if (!equipamento) return null;

  return (
    <div className="space-y-6">
      <EquipmentHeader equipamento={equipamento} />

      <EquipmentStats equipamento={equipamento} />

      <EquipmentTimeline equipamento={equipamento} />
    </div>
  );
}

export default EquipmentWorkspace;