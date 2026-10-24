/**
 * Every business detail the site displays, in one place.
 * Taken from the live olifelni.com. Change it here and it changes everywhere.
 */
export const SITE = {
  name: "Oli Felni",
  legalName: "OF Felni Kft.",
  phone: "+36 30 177 8667",
  phoneHref: "tel:+36301778667",
  email: "olifelni5@gmail.com",
  address: "6728 Szeged, Algyői út 87",
  mapsUrl: "https://maps.google.com/?q=6728+Szeged,+Algyői+út+87",
  tagline: "Használt és új alufelnik, gumiabroncsok",
} as const;

export const NAV = [
  { href: "/", label: "Főoldal" },
  { href: "/felnik", label: "Felnik" },
  { href: "/gumik", label: "Gumik" },
  { href: "/kapcsolat", label: "Elérhetőség" },
] as const;
