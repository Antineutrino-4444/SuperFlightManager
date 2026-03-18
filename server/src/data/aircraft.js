// Comprehensive list of commercial aircraft types currently in operation
// IATA codes where available, otherwise ICAO
const AIRCRAFT_TYPES = [
  // Airbus Narrowbody
  { code: '318', manufacturer: 'Airbus', model: 'A318', family: 'A318', category: 'Narrowbody', typicalSeats: 132 },
  { code: '319', manufacturer: 'Airbus', model: 'A319', family: 'A319', category: 'Narrowbody', typicalSeats: 156 },
  { code: '31N', manufacturer: 'Airbus', model: 'A319neo', family: 'A319', category: 'Narrowbody', typicalSeats: 160 },
  { code: '320', manufacturer: 'Airbus', model: 'A320', family: 'A320', category: 'Narrowbody', typicalSeats: 180 },
  { code: '32N', manufacturer: 'Airbus', model: 'A320neo', family: 'A320', category: 'Narrowbody', typicalSeats: 186 },
  { code: '321', manufacturer: 'Airbus', model: 'A321', family: 'A321', category: 'Narrowbody', typicalSeats: 220 },
  { code: '32Q', manufacturer: 'Airbus', model: 'A321neo', family: 'A321', category: 'Narrowbody', typicalSeats: 244 },
  { code: '32X', manufacturer: 'Airbus', model: 'A321XLR', family: 'A321', category: 'Narrowbody', typicalSeats: 244 },

  // Airbus Widebody
  { code: '332', manufacturer: 'Airbus', model: 'A330-200', family: 'A330', category: 'Widebody', typicalSeats: 293 },
  { code: '333', manufacturer: 'Airbus', model: 'A330-300', family: 'A330', category: 'Widebody', typicalSeats: 335 },
  { code: '338', manufacturer: 'Airbus', model: 'A330-800neo', family: 'A330', category: 'Widebody', typicalSeats: 260 },
  { code: '339', manufacturer: 'Airbus', model: 'A330-900neo', family: 'A330', category: 'Widebody', typicalSeats: 310 },
  { code: '342', manufacturer: 'Airbus', model: 'A340-200', family: 'A340', category: 'Widebody', typicalSeats: 261 },
  { code: '343', manufacturer: 'Airbus', model: 'A340-300', family: 'A340', category: 'Widebody', typicalSeats: 295 },
  { code: '345', manufacturer: 'Airbus', model: 'A340-500', family: 'A340', category: 'Widebody', typicalSeats: 313 },
  { code: '346', manufacturer: 'Airbus', model: 'A340-600', family: 'A340', category: 'Widebody', typicalSeats: 380 },
  { code: '351', manufacturer: 'Airbus', model: 'A350-900', family: 'A350', category: 'Widebody', typicalSeats: 325 },
  { code: '35K', manufacturer: 'Airbus', model: 'A350-1000', family: 'A350', category: 'Widebody', typicalSeats: 366 },
  { code: '380', manufacturer: 'Airbus', model: 'A380-800', family: 'A380', category: 'Widebody', typicalSeats: 555 },

  // Boeing Narrowbody
  { code: '737', manufacturer: 'Boeing', model: '737-700', family: '737', category: 'Narrowbody', typicalSeats: 149 },
  { code: '738', manufacturer: 'Boeing', model: '737-800', family: '737', category: 'Narrowbody', typicalSeats: 189 },
  { code: '739', manufacturer: 'Boeing', model: '737-900ER', family: '737', category: 'Narrowbody', typicalSeats: 215 },
  { code: '7M7', manufacturer: 'Boeing', model: '737 MAX 7', family: '737 MAX', category: 'Narrowbody', typicalSeats: 172 },
  { code: '7M8', manufacturer: 'Boeing', model: '737 MAX 8', family: '737 MAX', category: 'Narrowbody', typicalSeats: 189 },
  { code: '7M9', manufacturer: 'Boeing', model: '737 MAX 9', family: '737 MAX', category: 'Narrowbody', typicalSeats: 220 },
  { code: '7MJ', manufacturer: 'Boeing', model: '737 MAX 10', family: '737 MAX', category: 'Narrowbody', typicalSeats: 230 },
  { code: '757', manufacturer: 'Boeing', model: '757-200', family: '757', category: 'Narrowbody', typicalSeats: 200 },
  { code: '75W', manufacturer: 'Boeing', model: '757-300', family: '757', category: 'Narrowbody', typicalSeats: 243 },

  // Boeing Widebody
  { code: '763', manufacturer: 'Boeing', model: '767-300ER', family: '767', category: 'Widebody', typicalSeats: 269 },
  { code: '764', manufacturer: 'Boeing', model: '767-400ER', family: '767', category: 'Widebody', typicalSeats: 304 },
  { code: '772', manufacturer: 'Boeing', model: '777-200', family: '777', category: 'Widebody', typicalSeats: 314 },
  { code: '77L', manufacturer: 'Boeing', model: '777-200LR', family: '777', category: 'Widebody', typicalSeats: 317 },
  { code: '773', manufacturer: 'Boeing', model: '777-300ER', family: '777', category: 'Widebody', typicalSeats: 396 },
  { code: '779', manufacturer: 'Boeing', model: '777-9', family: '777X', category: 'Widebody', typicalSeats: 426 },
  { code: '778', manufacturer: 'Boeing', model: '777-8', family: '777X', category: 'Widebody', typicalSeats: 384 },
  { code: '788', manufacturer: 'Boeing', model: '787-8', family: '787', category: 'Widebody', typicalSeats: 248 },
  { code: '789', manufacturer: 'Boeing', model: '787-9', family: '787', category: 'Widebody', typicalSeats: 290 },
  { code: '78J', manufacturer: 'Boeing', model: '787-10', family: '787', category: 'Widebody', typicalSeats: 330 },
  { code: '748', manufacturer: 'Boeing', model: '747-8', family: '747', category: 'Widebody', typicalSeats: 467 },
  { code: '744', manufacturer: 'Boeing', model: '747-400', family: '747', category: 'Widebody', typicalSeats: 416 },

  // Embraer
  { code: 'E70', manufacturer: 'Embraer', model: 'E170', family: 'E-Jet', category: 'Regional', typicalSeats: 72 },
  { code: 'E75', manufacturer: 'Embraer', model: 'E175', family: 'E-Jet', category: 'Regional', typicalSeats: 88 },
  { code: 'E90', manufacturer: 'Embraer', model: 'E190', family: 'E-Jet', category: 'Regional', typicalSeats: 114 },
  { code: 'E95', manufacturer: 'Embraer', model: 'E195', family: 'E-Jet', category: 'Regional', typicalSeats: 132 },
  { code: 'E7W', manufacturer: 'Embraer', model: 'E175-E2', family: 'E-Jet E2', category: 'Regional', typicalSeats: 90 },
  { code: 'E90', manufacturer: 'Embraer', model: 'E190-E2', family: 'E-Jet E2', category: 'Regional', typicalSeats: 114 },
  { code: 'E9F', manufacturer: 'Embraer', model: 'E195-E2', family: 'E-Jet E2', category: 'Regional', typicalSeats: 146 },

  // Bombardier / Mitsubishi
  { code: 'CRJ', manufacturer: 'Bombardier', model: 'CRJ-200', family: 'CRJ', category: 'Regional', typicalSeats: 50 },
  { code: 'CR7', manufacturer: 'Bombardier', model: 'CRJ-700', family: 'CRJ', category: 'Regional', typicalSeats: 78 },
  { code: 'CR9', manufacturer: 'Bombardier', model: 'CRJ-900', family: 'CRJ', category: 'Regional', typicalSeats: 90 },
  { code: 'CRK', manufacturer: 'Bombardier', model: 'CRJ-1000', family: 'CRJ', category: 'Regional', typicalSeats: 104 },

  // ATR
  { code: 'AT4', manufacturer: 'ATR', model: 'ATR 42-600', family: 'ATR', category: 'Turboprop', typicalSeats: 48 },
  { code: 'AT7', manufacturer: 'ATR', model: 'ATR 72-600', family: 'ATR', category: 'Turboprop', typicalSeats: 72 },

  // De Havilland
  { code: 'DH8', manufacturer: 'De Havilland', model: 'Dash 8-400', family: 'Dash 8', category: 'Turboprop', typicalSeats: 90 },
  { code: 'DH3', manufacturer: 'De Havilland', model: 'Dash 8-300', family: 'Dash 8', category: 'Turboprop', typicalSeats: 56 },

  // COMAC
  { code: '919', manufacturer: 'COMAC', model: 'C919', family: 'C919', category: 'Narrowbody', typicalSeats: 174 },
  { code: 'ARJ', manufacturer: 'COMAC', model: 'ARJ21', family: 'ARJ21', category: 'Regional', typicalSeats: 90 },

  // Sukhoi
  { code: 'SU9', manufacturer: 'Sukhoi', model: 'Superjet 100', family: 'SSJ', category: 'Regional', typicalSeats: 98 },

  // Tupolev
  { code: 'T20', manufacturer: 'Tupolev', model: 'Tu-204', family: 'Tu-204', category: 'Narrowbody', typicalSeats: 210 },
  { code: 'T2H', manufacturer: 'Tupolev', model: 'Tu-214', family: 'Tu-204', category: 'Narrowbody', typicalSeats: 210 },

  // BAe/Avro
  { code: '14Y', manufacturer: 'BAe', model: 'BAe 146/Avro RJ', family: 'BAe 146', category: 'Regional', typicalSeats: 100 },

  // Saab
  { code: 'SF3', manufacturer: 'Saab', model: 'Saab 340', family: 'Saab 340', category: 'Turboprop', typicalSeats: 34 },
  { code: 'S20', manufacturer: 'Saab', model: 'Saab 2000', family: 'Saab 2000', category: 'Turboprop', typicalSeats: 50 },
];

// Build family groupings for filtering
const AIRCRAFT_FAMILIES = (() => {
  const familyMap = {};
  for (const ac of AIRCRAFT_TYPES) {
    if (!familyMap[ac.family]) {
      familyMap[ac.family] = {
        family: ac.family,
        manufacturer: ac.manufacturer,
        category: ac.category,
        codes: [],
        models: [],
      };
    }
    familyMap[ac.family].codes.push(ac.code);
    familyMap[ac.family].models.push(ac.model);
  }
  return Object.values(familyMap);
})();

module.exports = { AIRCRAFT_TYPES, AIRCRAFT_FAMILIES };
