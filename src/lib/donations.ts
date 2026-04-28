// Definicije donacijskih paketa za KG Balkan RP — cene u EURIMA

export interface DonationPackage {
  id: string;
  category: string;
  name: string;
  price: string; // €, ili formula
  perks: string[];
}

// Konstanta za vozila/imovina formulu
export const IG_TO_EUR_RATE = 100_000; // 1€ = 100.000 IC

export const PACKAGES: DonationPackage[] = [
  // ── KARAKTER ──
  {
    id: 'name-change', category: 'Karakter', name: 'Promena imena i prezimena',
    price: '15€',
    perks: ['Jednokratna promena IC imena/prezimena lika', 'Validacija kroz admina'],
  },
  {
    id: 'phone-custom', category: 'Karakter', name: 'Custom broj telefona',
    price: '10€',
    perks: ['Broj po izboru (3-7 cifara)', 'Doživotni'],
  },
  {
    id: 'appearance', category: 'Karakter', name: 'Promena izgleda',
    price: '25€',
    perks: ['Lice, ten, kosa, brada — full customization', 'Salon sesija sa adminom'],
  },

  // ── PRIORITY QUEUE (mesečno) ──
  {
    id: 'prio-10', category: 'Priority Queue', name: 'Priority 10',
    price: '10€ / mes',
    perks: ['Skip 10 mesta u queue-u', 'VIP queue indikator'],
  },
  {
    id: 'prio-20', category: 'Priority Queue', name: 'Priority 20',
    price: '20€ / mes',
    perks: ['Skip 20 mesta u queue-u'],
  },
  {
    id: 'prio-30', category: 'Priority Queue', name: 'Priority 30',
    price: '30€ / mes',
    perks: ['Skip 30 mesta u queue-u'],
  },
  {
    id: 'prio-50', category: 'Priority Queue', name: 'Priority 50',
    price: '50€ / mes',
    perks: ['Skip 50 mesta u queue-u'],
  },
  {
    id: 'prio-70', category: 'Priority Queue', name: 'Priority 70',
    price: '70€ / mes',
    perks: ['Skip 70 mesta u queue-u', 'Top 1% prioritet (najbrži ulaz)'],
  },

  // ── ORGANIZACIJA ──
  {
    id: 'org-create', category: 'Organizacija', name: 'Custom organizacija',
    price: '100€ (jednokratno)',
    perks: [
      'Custom mapa baze (interijer + eksterijer)',
      'Lider PC sa admin panelom (zapošljavanje, plate, rang sistem)',
      'Cuvanje outfita (5 default slot-ova)',
      'Sef organizacije (default storage)',
      'Garaža za vozila (5 mesta default)',
      'Custom radio frekvencija (default 1)',
      'IC dnevnik aktivnosti (audit log)',
      'Org-only Discord chat kanal',
      'Pravo zapošljavanja do 25 članova default',
    ],
  },
  {
    id: 'org-monthly', category: 'Organizacija', name: 'Održavanje organizacije',
    price: '20€ / mes',
    perks: [
      'Mesečna pretplata da org ostane aktivna',
      'Servis baze (popravke posle update-a)',
      'Update mape posle FiveM patch-a (po potrebi)',
      'Backup organizacijskih podataka',
    ],
  },

  // ── ORG. DODACI / UPGRADE ──
  {
    id: 'org-radio', category: 'Org. nadogradnja', name: 'Privatna radio frekvencija',
    price: '5€',
    perks: ['Frekvencija po izboru', 'Šifrovana komunikacija (org-only)'],
  },
  {
    id: 'org-rename', category: 'Org. nadogradnja', name: 'Promena imena organizacije',
    price: '10€',
    perks: ['Update svih IC referenci', 'Update Discord uloge i kanala'],
  },
  {
    id: 'org-relocate', category: 'Org. nadogradnja', name: 'Promena lokacije baze',
    price: '30€',
    perks: ['Premeštanje na novu lokaciju (admin verifikuje da nije konflikt)'],
  },
  {
    id: 'org-leader-pc', category: 'Org. nadogradnja', name: 'Lider PC — nadogradnja',
    price: '15€',
    perks: ['Više modula u admin panelu', 'Statistika, bonus plate, ranglista clan-ova'],
  },
  {
    id: 'org-safe-extra', category: 'Org. nadogradnja', name: 'Dodatni sef (storage slot)',
    price: '20€',
    perks: ['Dodatni storage slot za organizaciju', 'Posebna pristupna grupa'],
  },
  {
    id: 'org-garage-extra', category: 'Org. nadogradnja', name: 'Dodatnih 5 garažnih mesta',
    price: '10€',
    perks: ['+5 vozila u garaži (default je 5, max 30)'],
  },
  {
    id: 'org-outfit-extra', category: 'Org. nadogradnja', name: 'Dodatnih 5 outfit slot-ova',
    price: '5€',
    perks: ['Extra slotovi za uniforme', 'Default je 5, max 30'],
  },
  {
    id: 'org-members', category: 'Org. nadogradnja', name: 'Proširenje broja članova (+10)',
    price: '15€',
    perks: ['Default je 25, svaki paket daje +10 mesta'],
  },

  // ── VOZILA (organizacijska ili lična) ──
  {
    id: 'vehicle-import', category: 'Vozila', name: 'Custom uvozno vozilo',
    price: 'IG cena ÷ 100.000 (€)',
    perks: [
      'Cena se računa: IG cena vozila / 100.000',
      'Primer: vozilo košta 1.500.000 IC = 15€',
      'Premium vozilo iz odobrene liste',
      'Custom registracija uključena',
      'Garažirano u tvojoj kući ili org',
    ],
  },
  {
    id: 'vehicle-salon', category: 'Vozila', name: 'Salonsko vozilo (top tier)',
    price: '30€',
    perks: ['Najbolja klasa (super, sport-classics, hyper)', 'Bez IG restrikcije', 'Custom boja default'],
  },
  {
    id: 'vehicle-bike', category: 'Vozila', name: 'Custom motor',
    price: 'IG cena ÷ 100.000 (€)',
    perks: ['Cena: IG / 100.000', 'Motor po izboru', 'Custom registracija'],
  },
  {
    id: 'vehicle-armored', category: 'Vozila', name: 'Blindirano vozilo (org)',
    price: '25€',
    perks: ['Blindiranje postojećeg org vozila', 'Veća otpornost na metke', 'Org-only'],
  },
  {
    id: 'vehicle-tuning', category: 'Vozila', name: 'Full tuning paket',
    price: '7€',
    perks: ['Performance tuning (motor, kočnice, suspension)', 'Vizual tuning (felne, body, neon)', 'Custom boja'],
  },
  {
    id: 'vehicle-plate', category: 'Vozila', name: 'Custom registracija',
    price: '3€',
    perks: ['5 znakova po izboru (slova/brojevi)', 'Validacija da nije uvredljiva'],
  },

  // ── HELIKOPTERI ──
  {
    id: 'heli-light', category: 'Helikopteri', name: 'Mali heli (transport)',
    price: '40€',
    perks: ['Frogger / Maverick / Volatus klasa', 'Civil/biznis namena'],
  },
  {
    id: 'heli-medium', category: 'Helikopteri', name: 'Srednji heli (utility)',
    price: '60€',
    perks: ['Cargobob (transport vozila) / Skylift', 'Org-only'],
  },
  {
    id: 'heli-armed', category: 'Helikopteri', name: 'Borbeni heli (armed)',
    price: '80€',
    perks: ['Buzzard / Savage / Akula', 'Org-only sa Admin odobrenjem', 'Naoružanje uključeno'],
  },

  // ── IMOVINA ──
  {
    id: 'house-small', category: 'Imovina', name: 'Stan',
    price: 'IG cena ÷ 100.000 (€)',
    perks: ['Lokacija po izboru', 'Garaža (1 vozilo)', 'Personalni safe'],
  },
  {
    id: 'house-medium', category: 'Imovina', name: 'Kuća',
    price: 'IG cena ÷ 100.000 (€)',
    perks: ['Veća lokacija', 'Garaža (3 vozila)', 'Veći safe', 'Pravo iznajmljivanja sobe'],
  },
  {
    id: 'house-villa', category: 'Imovina', name: 'Vila',
    price: 'IG cena ÷ 100.000 (€)',
    perks: ['Premium lokacija', 'Garaža (10 vozila)', 'Bazen + party rights', 'Bezbednost (KOD na vratima)'],
  },

  // ── OSTALO ──
  {
    id: 'reroll', category: 'Ostalo', name: 'Reroll lika',
    price: '20€',
    perks: ['Brisanje lika sa zadržavanjem novca/kuće (po izboru)', 'Novi lik sa istih početnih privilegija'],
  },
  {
    id: 'pet', category: 'Ostalo', name: 'Pet (kućni ljubimac)',
    price: '8€',
    perks: ['Pas/mačka/ptica u igri', 'Custom ime', 'Prati te po mapi'],
  },
  {
    id: 'business-license', category: 'Ostalo', name: 'Biznis licenca (custom)',
    price: '50€',
    perks: ['Otvori vlasništvo nad postojećim biznisom', 'Custom logo + interijer', 'Pravo zapošljavanja'],
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
