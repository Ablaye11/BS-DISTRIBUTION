import { SenegalRegion } from '../types';

export interface DepartmentCommuneMap {
  [department: string]: string[];
}

export const SENEGAL_GEOGRAPHY: Record<SenegalRegion, DepartmentCommuneMap> = {
  Dakar: {
    'Keur Massar': ['Keur Massar Nord', 'Keur Massar Sud', 'Médinatoul Mounawara', 'Jaxaay-Parcelles', 'Yeumbeul Nord', 'Yeumbeul Sud', 'Malika'],
    'Rufisque': ['Rufisque Est', 'Rufisque Ouest', 'Rufisque Nord', 'Sangalkam', 'Bargny', 'Sebikotane', 'Sendou'],
    'Pikine': ['Pikine Est', 'Pikine Ouest', 'Pikine Nord', 'Guédiawaye', 'Thiaroye sur Mer', 'Thiaroye Gare', 'Dakar Thiaroye Kao'],
    'Dakar': ['Plateau', 'Médina', 'Grand Dakar', 'Parcelles Assainies', 'Yoff', 'Ngor', 'Ouakam', 'Fann-Point E']
  },
  Thiès: {
    'Thiès': ['Thiès Est', 'Thiès Ouest', 'Thiès Nord', 'Kaysar', 'Fandène'],
    'Mbour': ['Mbour', 'Saly Portudal', 'Ngaparou', 'Somone', 'Joal-Fadiouth', 'Popenguine'],
    'Tivaouane': ['Tivaouane', 'Meckhe', 'Pire Gourèye', 'Ndombil']
  },
  Diourbel: {
    'Touba / Mbacké': ['Touba Mosquée', 'Mbacké', 'Taïba', 'Dalla', 'Kael'],
    'Diourbel': ['Diourbel', 'Ndoulo', 'Tocky Gare'],
    'Bambey': ['Bambey', 'Ngoye', 'Thieppe']
  },
  'Saint-Louis': {
    'Saint-Louis': ['Saint-Louis Sor', 'Ndar Toute', 'Gandon', 'Mpal'],
    'Dagana': ['Dagana', 'Richard-Toll', 'Rosso Sénégal'],
    'Podor': ['Podor', 'Ndioum', 'Golléré']
  },
  Kaolack: {
    'Kaolack': ['Kaolack', 'Kahone', 'Ndoffane'],
    'Nioro du Rip': ['Nioro', 'Keur Madiabel'],
    'Guinguinéo': ['Guinguinéo', 'Mbadakhoune']
  },
  Fatick: {
    'Fatick': ['Fatick', 'Diofior'],
    'Foundiougne': ['Foundiougne', 'Passy', 'Sokone'],
    'Gossas': ['Gossas']
  },
  Kolda: {
    'Kolda': ['Kolda', 'Dabo', 'Saré Yoba'],
    'Vélingara': ['Vélingara', 'Kounkané'],
    'Médina Yoro Foulah': ['Médina Yoro Foulah']
  },
  Louga: {
    'Louga': ['Louga', 'Ndiagne', 'Keur Momar Sarr'],
    'Linguère': ['Linguère', 'Dahra Djoloff'],
    'Kébémer': ['Kébémer', 'Guéoul']
  },
  Matam: {
    'Matam': ['Matam', 'Ourossogui'],
    'Kanel': ['Kanel', 'Semmé'],
    'Ranérou': ['Ranérou']
  },
  Kaffrine: {
    'Kaffrine': ['Kaffrine', 'Nganda'],
    'Birkelane': ['Birkelane'],
    'Koungheul': ['Koungheul']
  },
  Kédougou: {
    'Kédougou': ['Kédougou', 'Bandafassi'],
    'Saraya': ['Saraya'],
    'Salémata': ['Salémata']
  },
  Sédhiou: {
    'Sédhiou': ['Sédhiou', 'Marsassoum'],
    'Bounkiling': ['Bounkiling'],
    'Goudomp': ['Goudomp']
  },
  Tambacounda: {
    'Tambacounda': ['Tambacounda', 'Malem Niani'],
    'Bakel': ['Bakel', 'Kidira'],
    'Goudiry': ['Goudiry']
  },
  Ziguinchor: {
    'Ziguinchor': ['Ziguinchor', 'Bignona', 'Oussouye', 'Cap Skirring']
  }
};

/**
 * Coordonnées GPS exactes des principales communes et points clés du Sénégal
 */
export const EXACT_SENEGAL_GPS_COORDS: Record<string, { lat: number; lng: number }> = {
  // Keur Massar & Dakar
  'Keur Massar': { lat: 14.7794, lng: -17.3129 },
  'Médinatoul Mounawara': { lat: 14.7831, lng: -17.3085 },
  'Keur Massar Nord': { lat: 14.7850, lng: -17.3150 },
  'Keur Massar Sud': { lat: 14.7715, lng: -17.3110 },
  'Jaxaay-Parcelles': { lat: 14.7640, lng: -17.2980 },
  'Yeumbeul Nord': { lat: 14.7820, lng: -17.3480 },
  'Malika': { lat: 14.7950, lng: -17.3320 },
  'Sangalkam': { lat: 14.7800, lng: -17.2280 },
  'Rufisque': { lat: 14.7158, lng: -17.2725 },
  'Bargny': { lat: 14.6980, lng: -17.2250 },
  'Pikine': { lat: 14.7553, lng: -17.3912 },
  'Guédiawaye': { lat: 14.7745, lng: -17.3878 },
  'Dakar Plateau': { lat: 14.6672, lng: -17.4348 },
  'Parcelles Assainies': { lat: 14.7580, lng: -17.4390 },
  'Médina': { lat: 14.6850, lng: -17.4470 },
  'Yoff': { lat: 14.7610, lng: -17.4660 },

  // Région Thiès
  'Thiès': { lat: 14.7903, lng: -16.9260 },
  'Mbour': { lat: 14.4220, lng: -16.9638 },
  'Saly Portudal': { lat: 14.4442, lng: -17.0145 },
  'Tivaouane': { lat: 14.9520, lng: -16.8120 },
  'Somone': { lat: 14.4850, lng: -17.0850 },

  // Région Diourbel
  'Touba Mosquée': { lat: 14.8631, lng: -15.8794 },
  'Mbacké': { lat: 14.7930, lng: -15.9080 },
  'Diourbel': { lat: 14.6540, lng: -16.2300 },

  // Autres Régions
  'Saint-Louis': { lat: 16.0326, lng: -16.4818 },
  'Kaolack': { lat: 14.1524, lng: -16.0726 },
  'Ziguinchor': { lat: 12.5680, lng: -16.2730 },
  'Tambacounda': { lat: 13.7689, lng: -13.6673 },
  'Louga': { lat: 15.6186, lng: -16.2244 }
};

/**
 * Retourne les coordonnées GPS exactes ou approximatives d'une commune
 */
export function getExactLocationGPS(communeOrRegion: string): { lat: number; lng: number } {
  if (EXACT_SENEGAL_GPS_COORDS[communeOrRegion]) {
    return EXACT_SENEGAL_GPS_COORDS[communeOrRegion];
  }
  // Default Keur Massar HQ
  return { lat: 14.7794, lng: -17.3129 };
}

/**
 * Recherche d'adresse / lieu en direct via l'API OpenStreetMap Nominatim au Sénégal
 */
export async function searchSenegalAddressGPS(query: string): Promise<Array<{ display_name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(`${query}, Senegal`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=sn&limit=5`);
    const data = await res.json();

    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (e) {
    console.warn('Geocoding search failed:', e);
    return [];
  }
}
