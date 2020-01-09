// https://github.com/JustFixNYC/eviction-free-nyc/blob/master/src/data/zipcodes.js

const RTC_ZIPCODES: Set<number> = new Set([
  // Manhattan:
  10026,
  10027,
  10025,
  10031,
  10029, 
  10034,

  // Bronx:
  10457,
  10467,
  10468,
  10462,
  10453,

  // Brooklyn: 
  11216,
  11221,
  11225,
  11226,
  11207,

  // Queens:
  11433,
  11434,
  11373,
  11385,
  11691,

  // Staten Island: 
  10302,
  10303,
  10314,
  10310
]);

export function isRtcZipcode(zip: string): boolean {
  return RTC_ZIPCODES.has(parseInt(zip));
}