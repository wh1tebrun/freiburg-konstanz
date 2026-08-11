import { getVehicleKind } from "../game";

type VehicleSpriteProps = {
  kindId: string;
};

export function VehicleSprite({ kindId }: VehicleSpriteProps) {
  const kind = getVehicleKind(kindId);

  return (
    <div
      className={`vehicle-art vehicle-art--${kind.body} vehicle-art--${kind.color}`}
      aria-hidden="true"
    >
      <span className="vehicle-art__cargo" />
      <span className="vehicle-art__body">
        <span className="vehicle-art__window vehicle-art__window--rear" />
        <span className="vehicle-art__window vehicle-art__window--front" />
        <span className="vehicle-art__light" />
      </span>
      <span className="vehicle-art__wheel vehicle-art__wheel--rear" />
      <span className="vehicle-art__wheel vehicle-art__wheel--front" />
    </div>
  );
}
