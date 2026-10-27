/** Database keys are stable English; everything a visitor or the owner sees is Hungarian. */

export const KIND_LABEL = { wheel: "Felni", tire: "Gumiabroncs" } as const;
export const KIND_LABEL_PLURAL = { wheel: "Felnik", tire: "Gumiabroncsok" } as const;

export const STATUS_LABEL = {
  active: "Aktív",
  reserved: "Foglalt",
  sold: "Eladva",
  hidden: "Rejtett",
} as const;

export const SEASON_LABEL = {
  summer: "Nyári",
  winter: "Téli",
  all_season: "Négy évszakos",
} as const;

/** Closed sets for the admin form — typing is where 5x114,3 / 5x114.3 / 5x1143 comes from. */
export const BOLT_PATTERNS = [
  "4x98", "4x100", "4x108", "5x98", "5x100", "5x108",
  "5x110", "5x112", "5x114,3", "5x115", "5x120", "5x130",
] as const;

export const DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] as const;

export const CAR_MAKES = [
  "Alfa Romeo", "Audi", "Bentley", "BMW", "Citroen", "Cupra", "DS", "Fiat", "Ford", "Honda",
  "Hyundai", "Jaguar", "Jeep", "Kia", "Land Rover", "Mazda", "Mercedes Benz", "Mercedes AMG",
  "MINI", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Seat", "Skoda",
  "Smart", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
] as const;

export const WHEEL_BRANDS = [
  "ABT", "Advanti", "AEZ", "Alutec", "ATS", "Autec", "BBS", "Borbet", "Breyton", "Brock",
  "Dezent", "Dotz", "Japan Racing", "OZ Racing", "Rial", "Ronal", "TEC",
] as const;

export const TIRE_BRANDS = [
  "Barum", "Bridgestone", "Continental", "Dunlop", "Goodyear", "Hankook", "Lassa", "Michelin",
  "Nexen", "Pirelli", "Platin", "Semperit", "Uniroyal", "Vredestein",
] as const;
