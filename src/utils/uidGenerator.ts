// UID Generator utility - creates 10-digit UIDs starting with country code

// Common country mappings for birth locations
const COUNTRY_CODES: Record<string, string> = {
  // Major English-speaking countries
  'united states': 'US',
  'usa': 'US',
  'us': 'US',  // Fix: Direct US country code
  'america': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'england': 'GB',
  'britain': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'ireland': 'IE',
  'canada': 'CA',
  'ca': 'CA',  // Fix: Direct CA country code
  'australia': 'AU',
  'new zealand': 'NZ',
  
  // Major European countries
  'germany': 'DE',
  'france': 'FR',
  'italy': 'IT',
  'spain': 'ES',
  'netherlands': 'NL',
  'belgium': 'BE',
  'austria': 'AT',
  'switzerland': 'CH',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'russia': 'RU',
  'ukraine': 'UA',
  'greece': 'GR',
  'portugal': 'PT',
  'czech republic': 'CZ',
  'romania': 'RO',
  'hungary': 'HU',
  'croatia': 'HR',
  'slovenia': 'SI',
  'slovakia': 'SK',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  
  // Asian countries
  'china': 'CN',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'india': 'IN',
  'singapore': 'SG',
  'thailand': 'TH',
  'vietnam': 'VN',
  'philippines': 'PH',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'myanmar': 'MM',
  'cambodia': 'KH',
  'laos': 'LA',
  'mongolia': 'MN',
  'nepal': 'NP',
  'bhutan': 'BT',
  
  // Middle Eastern countries
  'israel': 'IL',
  'turkey': 'TR',
  'iran': 'IR',
  'iraq': 'IQ',
  'syria': 'SY',
  'lebanon': 'LB',
  'jordan': 'JO',
  'saudi arabia': 'SA',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'kuwait': 'KW',
  'qatar': 'QA',
  'bahrain': 'BH',
  'oman': 'OM',
  'yemen': 'YE',
  'afghanistan': 'AF',
  
  // African countries
  'south africa': 'ZA',
  'egypt': 'EG',
  'nigeria': 'NG',
  'kenya': 'KE',
  'ghana': 'GH',
  'ethiopia': 'ET',
  'morocco': 'MA',
  'algeria': 'DZ',
  'tunisia': 'TN',
  'libya': 'LY',
  'sudan': 'SD',
  'uganda': 'UG',
  'tanzania': 'TZ',
  'zimbabwe': 'ZW',
  'botswana': 'BW',
  'namibia': 'NA',
  'zambia': 'ZM',
  'malawi': 'MW',
  'mozambique': 'MZ',
  'madagascar': 'MG',
  'mauritius': 'MU',
  'rwanda': 'RW',
  'senegal': 'SN',
  'ivory coast': 'CI',
  'cameroon': 'CM',
  'angola': 'AO',
  
  // American countries
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'bolivia': 'BO',
  'uruguay': 'UY',
  'paraguay': 'PY',
  'costa rica': 'CR',
  'panama': 'PA',
  'guatemala': 'GT',
  'honduras': 'HN',
  'nicaragua': 'NI',
  'cuba': 'CU',
  'jamaica': 'JM',
  'haiti': 'HT',
  'dominican republic': 'DO',
  'trinidad and tobago': 'TT',
  'barbados': 'BB',
  
  // Oceania
  'fiji': 'FJ',
  'papua new guinea': 'PG',
  'solomon islands': 'SB',
  'vanuatu': 'VU',
  'samoa': 'WS',
  'tonga': 'TO',
};

// US States mapping for more granular US identification
const US_STATES: Record<string, string> = {
  'california': 'CA',
  'new york': 'NY',
  'texas': 'TX',
  'florida': 'FL',
  'illinois': 'IL',
  'pennsylvania': 'PA',
  'ohio': 'OH',
  'georgia': 'GA',
  'north carolina': 'NC',
  'michigan': 'MI',
  'new jersey': 'NJ',
  'virginia': 'VA',
  'washington': 'WA',
  'arizona': 'AZ',
  'massachusetts': 'MA',
  'tennessee': 'TN',
  'indiana': 'IN',
  'maryland': 'MD',
  'missouri': 'MO',
  'wisconsin': 'WI',
  'colorado': 'CO',
  'minnesota': 'MN',
  'south carolina': 'SC',
  'alabama': 'AL',
  'louisiana': 'LA',
  'kentucky': 'KY',
  'oregon': 'OR',
  'oklahoma': 'OK',
  'connecticut': 'CT',
  'utah': 'UT',
  'iowa': 'IA',
  'nevada': 'NV',
  'arkansas': 'AR',
  'mississippi': 'MS',
  'kansas': 'KS',
  'new mexico': 'NM',
  'nebraska': 'NE',
  'west virginia': 'WV',
  'idaho': 'ID',
  'hawaii': 'HI',
  'new hampshire': 'NH',
  'maine': 'ME',
  'montana': 'MT',
  'rhode island': 'RI',
  'delaware': 'DE',
  'south dakota': 'SD',
  'north dakota': 'ND',
  'alaska': 'AK',
  'vermont': 'VT',
  'wyoming': 'WY',
};

/**
 * Extracts country code from birth location string
 * @param birthLocation - The birth location string (e.g., "New York, USA" or "London, UK")
 * @returns 2-letter country code or default fallback
 */
function extractCountryCode(birthLocation: string): string {
  if (!birthLocation || typeof birthLocation !== 'string') {
    return 'XX'; // Default fallback
  }
  
  const location = birthLocation.toLowerCase().trim();
  
  // Check for direct country matches first
  for (const [country, code] of Object.entries(COUNTRY_CODES)) {
    if (location.includes(country)) {
      return code;
    }
  }
  
  // Check for US states (assume US if state is mentioned)
  for (const state of Object.keys(US_STATES)) {
    if (location.includes(state)) {
      return 'US';
    }
  }
  
  // Check for common city patterns that indicate country
  const cityPatterns = [
    { pattern: /london|birmingham|manchester|liverpool|leeds|glasgow/, code: 'GB' },
    { pattern: /paris|marseille|lyon|toulouse|nice|strasbourg/, code: 'FR' },
    { pattern: /berlin|munich|hamburg|cologne|frankfurt|stuttgart/, code: 'DE' },
    { pattern: /madrid|barcelona|valencia|seville|bilbao|granada/, code: 'ES' },
    { pattern: /rome|milan|naples|turin|palermo|genoa/, code: 'IT' },
    { pattern: /amsterdam|rotterdam|utrecht|eindhoven|groningen/, code: 'NL' },
    { pattern: /tokyo|osaka|kyoto|nagoya|yokohama|kobe/, code: 'JP' },
    { pattern: /beijing|shanghai|guangzhou|shenzhen|chengdu|hangzhou/, code: 'CN' },
    { pattern: /mumbai|delhi|bangalore|kolkata|chennai|hyderabad/, code: 'IN' },
    { pattern: /sydney|melbourne|brisbane|perth|adelaide|canberra/, code: 'AU' },
    { pattern: /toronto|vancouver|montreal|calgary|ottawa|edmonton/, code: 'CA' },
    { pattern: /mexico city|guadalajara|monterrey|puebla|tijuana/, code: 'MX' },
    { pattern: /são paulo|rio de janeiro|brasília|salvador|fortaleza/, code: 'BR' },
    { pattern: /buenos aires|córdoba|rosario|mendoza|la plata/, code: 'AR' },
    { pattern: /moscow|st\. petersburg|novosibirsk|yekaterinburg/, code: 'RU' },
  ];
  
  for (const { pattern, code } of cityPatterns) {
    if (pattern.test(location)) {
      return code;
    }
  }
  
  // Default fallback if no match found
  return 'XX';
}

/**
 * Generates a unique 10-digit UID starting with country code
 * Format: CC + 8-digit timestamp-based number
 * @param birthLocation - The birth location to extract country code from
 * @returns 10-character UID (e.g., "US12345678")
 */
export function generateUID(birthLocation: string): string {
  // Get 2-letter country code
  const countryCode = extractCountryCode(birthLocation);
  
  // Generate 8-digit number based on timestamp + random component
  const now = Date.now();
  const timestampPart = now.toString().slice(-6); // Last 6 digits of timestamp
  const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 random digits
  
  const eightDigits = timestampPart + randomPart;
  
  // Combine country code + 8 digits = 10 characters total
  const uid = countryCode + eightDigits;
  
  return uid;
}

/**
 * Validates that a UID follows the expected format
 * @param uid - The UID to validate
 * @returns true if valid format (2 letters + 8 digits)
 */
export function validateUID(uid: string): boolean {
  if (!uid || typeof uid !== 'string' || uid.length !== 10) {
    return false;
  }
  
  const pattern = /^[A-Z]{2}\d{8}$/;
  return pattern.test(uid);
} 