import type { VehicleKind } from "../types";

export const VEHICLE_KINDS = [
  {
    id: "alpine-compact",
    label: "Alpine blue compact car",
    body: "compact",
    color: "alpine",
    width: 92,
    speedFactor: 1.08,
  },
  {
    id: "cream-sedan",
    label: "Cream sedan",
    body: "sedan",
    color: "cream",
    width: 105,
    speedFactor: 1.04,
  },
  {
    id: "charcoal-sedan",
    label: "Charcoal sedan",
    body: "sedan",
    color: "charcoal",
    width: 108,
    speedFactor: 1,
  },
  {
    id: "forest-compact",
    label: "Forest green compact car",
    body: "compact",
    color: "forest",
    width: 95,
    speedFactor: 1.12,
  },
  {
    id: "sunset-sport",
    label: "Sunset yellow sports car",
    body: "sport",
    color: "sunset",
    width: 110,
    speedFactor: 1.2,
  },
  {
    id: "forest-freight-truck",
    label: "Forest green freight truck",
    body: "truck",
    color: "forest",
    width: 174,
    speedFactor: 0.82,
  },
  {
    id: "sunset-delivery-truck",
    label: "Sunset yellow delivery truck",
    body: "truck",
    color: "sunset",
    width: 164,
    speedFactor: 0.86,
  },
  {
    id: "charcoal-delivery-van",
    label: "Charcoal delivery van",
    body: "van",
    color: "charcoal",
    width: 153,
    speedFactor: 0.78,
  },
] as const satisfies readonly VehicleKind[];

export function getVehicleKind(kindId: string): VehicleKind {
  return VEHICLE_KINDS.find((kind) => kind.id === kindId) ?? VEHICLE_KINDS[0];
}
