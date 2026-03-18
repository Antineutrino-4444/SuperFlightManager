// Major airports with continent/region classification for transfer area filtering
const AIRPORTS = {
  // North America - US
  'JFK': { name: 'John F. Kennedy International', city: 'New York', country: 'US', continent: 'North America', region: 'US East Coast', lat: 40.6413, lon: -73.7781 },
  'LAX': { name: 'Los Angeles International', city: 'Los Angeles', country: 'US', continent: 'North America', region: 'US West Coast', lat: 33.9425, lon: -118.4081 },
  'ORD': { name: "O'Hare International", city: 'Chicago', country: 'US', continent: 'North America', region: 'US Midwest', lat: 41.9742, lon: -87.9073 },
  'SFO': { name: 'San Francisco International', city: 'San Francisco', country: 'US', continent: 'North America', region: 'US West Coast', lat: 37.6213, lon: -122.3790 },
  'ATL': { name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US', continent: 'North America', region: 'US Southeast', lat: 33.6407, lon: -84.4277 },
  'DFW': { name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US', continent: 'North America', region: 'US South', lat: 32.8998, lon: -97.0403 },
  'DEN': { name: 'Denver International', city: 'Denver', country: 'US', continent: 'North America', region: 'US Mountain', lat: 39.8561, lon: -104.6737 },
  'SEA': { name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US', continent: 'North America', region: 'US West Coast', lat: 47.4502, lon: -122.3088 },
  'MIA': { name: 'Miami International', city: 'Miami', country: 'US', continent: 'North America', region: 'US Southeast', lat: 25.7959, lon: -80.2870 },
  'EWR': { name: 'Newark Liberty International', city: 'Newark', country: 'US', continent: 'North America', region: 'US East Coast', lat: 40.6895, lon: -74.1745 },
  'IAD': { name: 'Washington Dulles International', city: 'Washington DC', country: 'US', continent: 'North America', region: 'US East Coast', lat: 38.9531, lon: -77.4565 },
  'BOS': { name: 'Boston Logan International', city: 'Boston', country: 'US', continent: 'North America', region: 'US East Coast', lat: 42.3656, lon: -71.0096 },
  'IAH': { name: 'George Bush Intercontinental', city: 'Houston', country: 'US', continent: 'North America', region: 'US South', lat: 29.9902, lon: -95.3368 },
  'PHX': { name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'US', continent: 'North America', region: 'US Southwest', lat: 33.4373, lon: -112.0078 },
  'MSP': { name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'US', continent: 'North America', region: 'US Midwest', lat: 44.8848, lon: -93.2223 },
  'DTW': { name: 'Detroit Metropolitan Wayne County', city: 'Detroit', country: 'US', continent: 'North America', region: 'US Midwest', lat: 42.2162, lon: -83.3554 },
  'FAT': { name: 'Fresno Yosemite International', city: 'Fresno', country: 'US', continent: 'North America', region: 'US West Coast', lat: 36.7762, lon: -119.7181 },
  'HNL': { name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'US', continent: 'North America', region: 'US Pacific', lat: 21.3187, lon: -157.9225 },
  'ANC': { name: 'Ted Stevens Anchorage International', city: 'Anchorage', country: 'US', continent: 'North America', region: 'US Alaska', lat: 61.1743, lon: -149.9962 },

  // North America - Canada
  'YYZ': { name: 'Toronto Pearson International', city: 'Toronto', country: 'CA', continent: 'North America', region: 'Canada East', lat: 43.6777, lon: -79.6248 },
  'YVR': { name: 'Vancouver International', city: 'Vancouver', country: 'CA', continent: 'North America', region: 'Canada West', lat: 49.1967, lon: -123.1815 },
  'YUL': { name: 'Montréal-Trudeau International', city: 'Montreal', country: 'CA', continent: 'North America', region: 'Canada East', lat: 45.4706, lon: -73.7408 },

  // Central America / Caribbean
  'MEX': { name: 'Mexico City International', city: 'Mexico City', country: 'MX', continent: 'North America', region: 'Central America', lat: 19.4363, lon: -99.0721 },
  'CUN': { name: 'Cancún International', city: 'Cancún', country: 'MX', continent: 'North America', region: 'Central America', lat: 21.0365, lon: -86.8771 },
  'PTY': { name: 'Tocumen International', city: 'Panama City', country: 'PA', continent: 'North America', region: 'Central America', lat: 9.0714, lon: -79.3835 },

  // South America
  'GRU': { name: 'São Paulo-Guarulhos International', city: 'São Paulo', country: 'BR', continent: 'South America', region: 'South America East', lat: -23.4356, lon: -46.4731 },
  'EZE': { name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'AR', continent: 'South America', region: 'South America South', lat: -34.8222, lon: -58.5358 },
  'BOG': { name: 'El Dorado International', city: 'Bogotá', country: 'CO', continent: 'South America', region: 'South America North', lat: 4.7016, lon: -74.1469 },
  'LIM': { name: 'Jorge Chávez International', city: 'Lima', country: 'PE', continent: 'South America', region: 'South America West', lat: -12.0219, lon: -77.1143 },
  'SCL': { name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'CL', continent: 'South America', region: 'South America South', lat: -33.3930, lon: -70.7858 },

  // Europe
  'LHR': { name: 'London Heathrow', city: 'London', country: 'GB', continent: 'Europe', region: 'Western Europe', lat: 51.4700, lon: -0.4543 },
  'LGW': { name: 'London Gatwick', city: 'London', country: 'GB', continent: 'Europe', region: 'Western Europe', lat: 51.1537, lon: -0.1821 },
  'CDG': { name: 'Paris Charles de Gaulle', city: 'Paris', country: 'FR', continent: 'Europe', region: 'Western Europe', lat: 49.0097, lon: 2.5479 },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', continent: 'Europe', region: 'Western Europe', lat: 50.0379, lon: 8.5622 },
  'AMS': { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', continent: 'Europe', region: 'Western Europe', lat: 52.3105, lon: 4.7683 },
  'MAD': { name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'ES', continent: 'Europe', region: 'Southern Europe', lat: 40.4983, lon: -3.5676 },
  'BCN': { name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'ES', continent: 'Europe', region: 'Southern Europe', lat: 41.2974, lon: 2.0833 },
  'FCO': { name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'IT', continent: 'Europe', region: 'Southern Europe', lat: 41.8003, lon: 12.2389 },
  'MUC': { name: 'Munich Airport', city: 'Munich', country: 'DE', continent: 'Europe', region: 'Western Europe', lat: 48.3538, lon: 11.7861 },
  'IST': { name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', continent: 'Europe', region: 'Eastern Europe', lat: 41.2753, lon: 28.7519 },
  'ZRH': { name: 'Zurich Airport', city: 'Zurich', country: 'CH', continent: 'Europe', region: 'Western Europe', lat: 47.4647, lon: 8.5492 },
  'VIE': { name: 'Vienna International', city: 'Vienna', country: 'AT', continent: 'Europe', region: 'Central Europe', lat: 48.1103, lon: 16.5697 },
  'CPH': { name: 'Copenhagen Airport', city: 'Copenhagen', country: 'DK', continent: 'Europe', region: 'Northern Europe', lat: 55.6180, lon: 12.6508 },
  'OSL': { name: 'Oslo Gardermoen', city: 'Oslo', country: 'NO', continent: 'Europe', region: 'Northern Europe', lat: 60.1976, lon: 11.1004 },
  'ARN': { name: 'Stockholm Arlanda', city: 'Stockholm', country: 'SE', continent: 'Europe', region: 'Northern Europe', lat: 59.6519, lon: 17.9186 },
  'HEL': { name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'FI', continent: 'Europe', region: 'Northern Europe', lat: 60.3172, lon: 24.9633 },
  'LIS': { name: 'Lisbon Humberto Delgado', city: 'Lisbon', country: 'PT', continent: 'Europe', region: 'Southern Europe', lat: 38.7813, lon: -9.1359 },
  'WAW': { name: 'Warsaw Chopin', city: 'Warsaw', country: 'PL', continent: 'Europe', region: 'Central Europe', lat: 52.1657, lon: 20.9671 },
  'ATH': { name: 'Athens International', city: 'Athens', country: 'GR', continent: 'Europe', region: 'Southern Europe', lat: 37.9364, lon: 23.9445 },
  'SVO': { name: 'Sheremetyevo International', city: 'Moscow', country: 'RU', continent: 'Europe', region: 'Eastern Europe', lat: 55.9726, lon: 37.4146 },
  'DME': { name: 'Domodedovo International', city: 'Moscow', country: 'RU', continent: 'Europe', region: 'Eastern Europe', lat: 55.4088, lon: 37.9063 },
  'DUB': { name: 'Dublin Airport', city: 'Dublin', country: 'IE', continent: 'Europe', region: 'Western Europe', lat: 53.4264, lon: -6.2499 },
  'BRU': { name: 'Brussels Airport', city: 'Brussels', country: 'BE', continent: 'Europe', region: 'Western Europe', lat: 50.9014, lon: 4.4844 },

  // Middle East
  'DXB': { name: 'Dubai International', city: 'Dubai', country: 'AE', continent: 'Asia', region: 'Middle East', lat: 25.2532, lon: 55.3657 },
  'AUH': { name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'AE', continent: 'Asia', region: 'Middle East', lat: 24.4330, lon: 54.6511 },
  'DOH': { name: 'Hamad International', city: 'Doha', country: 'QA', continent: 'Asia', region: 'Middle East', lat: 25.2731, lon: 51.6081 },
  'RUH': { name: 'King Khalid International', city: 'Riyadh', country: 'SA', continent: 'Asia', region: 'Middle East', lat: 24.9576, lon: 46.6988 },
  'JED': { name: 'King Abdulaziz International', city: 'Jeddah', country: 'SA', continent: 'Asia', region: 'Middle East', lat: 21.6796, lon: 39.1565 },
  'TLV': { name: 'Ben Gurion International', city: 'Tel Aviv', country: 'IL', continent: 'Asia', region: 'Middle East', lat: 32.0055, lon: 34.8854 },
  'AMM': { name: 'Queen Alia International', city: 'Amman', country: 'JO', continent: 'Asia', region: 'Middle East', lat: 31.7226, lon: 35.9932 },
  'BEY': { name: 'Rafic Hariri International', city: 'Beirut', country: 'LB', continent: 'Asia', region: 'Middle East', lat: 33.8209, lon: 35.4884 },

  // East Asia
  'PEK': { name: 'Beijing Capital International', city: 'Beijing', country: 'CN', continent: 'Asia', region: 'East Asia', lat: 40.0799, lon: 116.6031 },
  'PKX': { name: 'Beijing Daxing International', city: 'Beijing', country: 'CN', continent: 'Asia', region: 'East Asia', lat: 39.5098, lon: 116.4105 },
  'PVG': { name: 'Shanghai Pudong International', city: 'Shanghai', country: 'CN', continent: 'Asia', region: 'East Asia', lat: 31.1443, lon: 121.8083 },
  'CAN': { name: 'Guangzhou Baiyun International', city: 'Guangzhou', country: 'CN', continent: 'Asia', region: 'East Asia', lat: 23.3924, lon: 113.2988 },
  'HKG': { name: 'Hong Kong International', city: 'Hong Kong', country: 'HK', continent: 'Asia', region: 'East Asia', lat: 22.3080, lon: 113.9185 },
  'NRT': { name: 'Narita International', city: 'Tokyo', country: 'JP', continent: 'Asia', region: 'East Asia', lat: 35.7720, lon: 140.3929 },
  'HND': { name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', continent: 'Asia', region: 'East Asia', lat: 35.5494, lon: 139.7798 },
  'KIX': { name: 'Kansai International', city: 'Osaka', country: 'JP', continent: 'Asia', region: 'East Asia', lat: 34.4347, lon: 135.2441 },
  'ICN': { name: 'Incheon International', city: 'Seoul', country: 'KR', continent: 'Asia', region: 'East Asia', lat: 37.4602, lon: 126.4407 },
  'TPE': { name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'TW', continent: 'Asia', region: 'East Asia', lat: 25.0777, lon: 121.2330 },

  // Southeast Asia
  'SIN': { name: 'Singapore Changi', city: 'Singapore', country: 'SG', continent: 'Asia', region: 'Southeast Asia', lat: 1.3644, lon: 103.9915 },
  'BKK': { name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'TH', continent: 'Asia', region: 'Southeast Asia', lat: 13.6900, lon: 100.7501 },
  'KUL': { name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'MY', continent: 'Asia', region: 'Southeast Asia', lat: 2.7456, lon: 101.7099 },
  'CGK': { name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'ID', continent: 'Asia', region: 'Southeast Asia', lat: -6.1256, lon: 106.6559 },
  'MNL': { name: 'Ninoy Aquino International', city: 'Manila', country: 'PH', continent: 'Asia', region: 'Southeast Asia', lat: 14.5086, lon: 121.0197 },
  'SGN': { name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'VN', continent: 'Asia', region: 'Southeast Asia', lat: 10.8188, lon: 106.6520 },
  'HAN': { name: 'Noi Bai International', city: 'Hanoi', country: 'VN', continent: 'Asia', region: 'Southeast Asia', lat: 21.2212, lon: 105.8070 },

  // South Asia
  'DEL': { name: 'Indira Gandhi International', city: 'Delhi', country: 'IN', continent: 'Asia', region: 'South Asia', lat: 28.5562, lon: 77.1000 },
  'BOM': { name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'IN', continent: 'Asia', region: 'South Asia', lat: 19.0896, lon: 72.8656 },
  'BLR': { name: 'Kempegowda International', city: 'Bangalore', country: 'IN', continent: 'Asia', region: 'South Asia', lat: 13.1986, lon: 77.7066 },
  'CMB': { name: 'Bandaranaike International', city: 'Colombo', country: 'LK', continent: 'Asia', region: 'South Asia', lat: 7.1808, lon: 79.8841 },

  // Africa
  'JNB': { name: 'O.R. Tambo International', city: 'Johannesburg', country: 'ZA', continent: 'Africa', region: 'Southern Africa', lat: -26.1392, lon: 28.2460 },
  'CPT': { name: 'Cape Town International', city: 'Cape Town', country: 'ZA', continent: 'Africa', region: 'Southern Africa', lat: -33.9649, lon: 18.6017 },
  'CAI': { name: 'Cairo International', city: 'Cairo', country: 'EG', continent: 'Africa', region: 'North Africa', lat: 30.1219, lon: 31.4056 },
  'ADD': { name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'ET', continent: 'Africa', region: 'East Africa', lat: 8.9779, lon: 38.7993 },
  'NBO': { name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'KE', continent: 'Africa', region: 'East Africa', lat: -1.3192, lon: 36.9278 },
  'CMN': { name: 'Mohammed V International', city: 'Casablanca', country: 'MA', continent: 'Africa', region: 'North Africa', lat: 33.3675, lon: -7.5898 },
  'LOS': { name: 'Murtala Muhammed International', city: 'Lagos', country: 'NG', continent: 'Africa', region: 'West Africa', lat: 6.5774, lon: 3.3212 },

  // Oceania
  'SYD': { name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'AU', continent: 'Oceania', region: 'Australia', lat: -33.9399, lon: 151.1753 },
  'MEL': { name: 'Melbourne Airport', city: 'Melbourne', country: 'AU', continent: 'Oceania', region: 'Australia', lat: -37.6690, lon: 144.8410 },
  'BNE': { name: 'Brisbane Airport', city: 'Brisbane', country: 'AU', continent: 'Oceania', region: 'Australia', lat: -27.3842, lon: 153.1175 },
  'AKL': { name: 'Auckland Airport', city: 'Auckland', country: 'NZ', continent: 'Oceania', region: 'New Zealand', lat: -37.0082, lon: 174.7850 },
  'NAN': { name: 'Nadi International', city: 'Nadi', country: 'FJ', continent: 'Oceania', region: 'Pacific Islands', lat: -17.7554, lon: 177.4431 },
};

const CONTINENTS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
const REGIONS = [...new Set(Object.values(AIRPORTS).map(a => a.region))].sort();

module.exports = { AIRPORTS, CONTINENTS, REGIONS };
