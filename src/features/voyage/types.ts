export interface AttachedFile {
  id: string;
  title: string;
  doc_type: string | null;
}

export interface Trajet {
  id: string;
  departurePoint: string;
  departureDate: string;
  departureTime: string;
  arrivalPoint: string;
  arrivalDate: string;
  arrivalTime: string;
  transportMode: string;
  numberOfPeople: number;
  unitPrice: number;
  totalPrice: number;
  isPaid: boolean;
  attachedFiles: AttachedFile[];
}

export interface Logement {
  id: string;
  city: string;
  place: string;
  arrivalDate: string;
  departureDate: string;
  pricePerDay: number;
  totalPrice: number;
  isPaid: boolean;
  attachedFiles: AttachedFile[];
}

export interface TripData {
  trajets: Trajet[];
  logements: Logement[];
}

export const TRANSPORT_MODES = [
  "Avion",
  "Train",
  "Bus",
  "Voiture",
  "Bateau",
  "Taxi",
  "Metro / Tram",
  "A pied",
  "Velo",
  "Autre",
];

export function createEmptyTrajet(): Trajet {
  return {
    id: crypto.randomUUID(),
    departurePoint: "",
    departureDate: "",
    departureTime: "",
    arrivalPoint: "",
    arrivalDate: "",
    arrivalTime: "",
    transportMode: TRANSPORT_MODES[0],
    numberOfPeople: 1,
    unitPrice: 0,
    totalPrice: 0,
    isPaid: false,
    attachedFiles: [],
  };
}

export function createEmptyLogement(): Logement {
  return {
    id: crypto.randomUUID(),
    city: "",
    place: "",
    arrivalDate: "",
    departureDate: "",
    pricePerDay: 0,
    totalPrice: 0,
    isPaid: false,
    attachedFiles: [],
  };
}

export function createEmptyTripData(): TripData {
  return {
    trajets: [],
    logements: [],
  };
}

/** Calcule le nombre de nuits entre deux dates */
export function calculateNights(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival);
  const d = new Date(departure);
  const diff = d.getTime() - a.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}

/** Calcule les totaux du voyage */
export function calculateTripTotals(data: TripData) {
  let total = 0;
  let paid = 0;

  for (const t of data.trajets) {
    total += t.totalPrice;
    if (t.isPaid) paid += t.totalPrice;
  }

  for (const l of data.logements) {
    total += l.totalPrice;
    if (l.isPaid) paid += l.totalPrice;
  }

  return { total, paid, remaining: total - paid };
}
