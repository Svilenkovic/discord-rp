// Definicije donacijskih paketa za KG Balkan RP

export interface DonationPackage {
  id: string;
  category: string;
  name: string;
  price: string; // RSD
  perks: string[];
}

export const PACKAGES: DonationPackage[] = [
  // ── VIP rang ──
  {
    id: 'vip-bronze', category: 'VIP', name: 'VIP Bronze',
    price: '500 RSD',
    perks: ['VIP rola', 'Prioritet u queue-u', 'VIP chat'],
  },
  {
    id: 'vip-silver', category: 'VIP', name: 'VIP Silver',
    price: '1000 RSD',
    perks: ['Sve iz Bronze', '1 custom tablica (5 karaktera)', 'Custom boja imena u igri'],
  },
  {
    id: 'vip-gold', category: 'VIP', name: 'VIP Gold',
    price: '2000 RSD',
    perks: ['Sve iz Silver', 'Custom telefon broj (3 cifre)', 'VIP voice kanal', '+10% plata na poslu'],
  },
  {
    id: 'vip-platinum', category: 'VIP', name: 'VIP Platinum',
    price: '4000 RSD',
    perks: ['Sve iz Gold', '2 custom tablice', 'Free 1x reroll lika', 'Skip queue uvek'],
  },

  // ── Vozila ──
  {
    id: 'custom-car', category: 'Vozila', name: 'Custom auto (uvoz)',
    price: '1500 RSD',
    perks: ['Vozilo iz liste premium auta', 'Custom registracija', 'Garažirano u tvojoj kući'],
  },
  {
    id: 'custom-bike', category: 'Vozila', name: 'Custom motor',
    price: '900 RSD',
    perks: ['Motor iz liste premium motora', 'Custom registracija'],
  },
  {
    id: 'tuning-package', category: 'Vozila', name: 'Tuning paket',
    price: '700 RSD',
    perks: ['Full performance + vizual tuning na postojećem vozilu', 'Custom boja + neon'],
  },
  {
    id: 'custom-plate', category: 'Vozila', name: 'Custom tablica',
    price: '300 RSD',
    perks: ['5 znakova po izboru (slova/brojevi)', 'Validacija kroz admina'],
  },

  // ── Telefon / Telekomunikacije ──
  {
    id: 'phone-3-digits', category: 'Telefon', name: 'Custom broj — 3 cifre',
    price: '500 RSD',
    perks: ['Trocifren broj telefona', 'Doživotni'],
  },
  {
    id: 'phone-4-digits', category: 'Telefon', name: 'Custom broj — 4 cifre',
    price: '300 RSD',
    perks: ['Četvorocifren broj telefona'],
  },

  // ── Biznis ──
  {
    id: 'business-small', category: 'Biznis', name: 'Mali biznis',
    price: '5000 RSD',
    perks: ['Vlasništvo nad malim biznisom (kafić, prodavnica, perionica...)', 'Custom logo', 'Pristup biznis chat-u'],
  },
  {
    id: 'business-medium', category: 'Biznis', name: 'Srednji biznis',
    price: '10000 RSD',
    perks: ['Veći biznis (auto-salon, restoran, fitness...)', 'Custom unutrašnjost', 'Pravo zapošljavanja 5 ljudi'],
  },
  {
    id: 'business-large', category: 'Biznis', name: 'Veliki biznis / Klub',
    price: '20000 RSD',
    perks: ['Klub, kasino, bar...', 'Pristup uvozu', 'Pravo zapošljavanja 15 ljudi', 'Custom event rights'],
  },

  // ── Organizacije ──
  {
    id: 'org-small', category: 'Organizacije', name: 'Mala organizacija',
    price: '8000 RSD',
    perks: ['10-15 članova', 'Custom uniforme', 'HQ lokacija', 'Org chat na Discord-u'],
  },
  {
    id: 'org-medium', category: 'Organizacije', name: 'Srednja organizacija',
    price: '15000 RSD',
    perks: ['20-30 članova', 'Custom vozila + tuning', 'Garaža + safe', 'Pristup org-only resursima'],
  },
  {
    id: 'org-large', category: 'Organizacije', name: 'Velika organizacija (Mafija/Kartel)',
    price: '30000 RSD',
    perks: ['40+ članova', 'Custom mapa lokacije', 'War rights', 'Pristup teritorijama', 'Special events'],
  },

  // ── Kuće / Imovina ──
  {
    id: 'house-small', category: 'Imovina', name: 'Mali stan',
    price: '1500 RSD',
    perks: ['Lokacija po izboru', 'Garaža (1 vozilo)', 'Personalni safe'],
  },
  {
    id: 'house-medium', category: 'Imovina', name: 'Kuća',
    price: '3000 RSD',
    perks: ['Veća lokacija', 'Garaža (3 vozila)', 'Veći safe', 'Mogućnost iznajmljivanja sobe'],
  },
  {
    id: 'house-villa', category: 'Imovina', name: 'Vila',
    price: '7000 RSD',
    perks: ['Premium lokacija', 'Garaža (10 vozila)', 'Bazen + party rights', 'Bezbednost'],
  },

  // ── Ostalo ──
  {
    id: 'name-change', category: 'Ostalo', name: 'Promena imena lika',
    price: '300 RSD',
    perks: ['Jednokratna promena IC imena (1x)'],
  },
  {
    id: 'reroll', category: 'Ostalo', name: 'Reroll (resetuj lika)',
    price: '500 RSD',
    perks: ['Brisanje lika sa zadržavanjem novca / kuće (po izboru)'],
  },
  {
    id: 'pet', category: 'Ostalo', name: 'Pet',
    price: '400 RSD',
    perks: ['Životinja u igri (pas, mačka, ptica...)', 'Custom ime'],
  },
];

export function packagesByCategory(): Record<string, DonationPackage[]> {
  const out: Record<string, DonationPackage[]> = {};
  for (const p of PACKAGES) (out[p.category] ??= []).push(p);
  return out;
}

export function findPackage(id: string): DonationPackage | undefined {
  return PACKAGES.find(p => p.id === id);
}
