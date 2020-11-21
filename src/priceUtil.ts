export const PRICE_ID_LIFETIME_US: string = process.env.STRIPE_PRICE_USD || "";
export const PRICE_ID_YEAR_US: string = "price_1HUneuJTQgPl8Cr4RpMANhId";
export const PRICE_ID_LIFETIME_CA: string = process.env.STRIPE_PRICE_CAD || "";
export const PRICE_ID_YEAR_CA: string = "price_1HUneuJTQgPl8Cr43Ll1vIZD";

const PRICE_LIFETIME_US = {
  priceId: PRICE_ID_LIFETIME_US,
  type: "lifetime",
  country: "US",
};

const PRICE_YEAR_US = {
  priceId: PRICE_ID_YEAR_US,
  type: "year",
  country: "US",
};

const PRICE_LIFETIME_CA = {
  priceId: PRICE_ID_LIFETIME_CA,
  type: "lifetime",
  country: "CA",
};

const PRICE_YEAR_CA = {
  priceId: PRICE_ID_YEAR_CA,
  type: "year",
  country: "CA",
};

export const PRICE_MAP = {
  [PRICE_ID_LIFETIME_US]: PRICE_LIFETIME_US,
  [PRICE_ID_YEAR_US]: PRICE_YEAR_US,
  [PRICE_ID_LIFETIME_CA]: PRICE_LIFETIME_CA,
  [PRICE_ID_YEAR_CA]: PRICE_YEAR_CA,
};

export const PRICES_ARRAY = [
  PRICE_LIFETIME_US,
  PRICE_YEAR_US,
  PRICE_LIFETIME_CA,
  PRICE_YEAR_CA,
];
