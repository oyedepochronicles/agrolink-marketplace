import {
  getCitiesAndTownsByLga,
  getLgasByState,
  getStates,
} from "nigerian-states-lgas-cities-towns";

export interface NigerianLocationValue {
  state: string;
  lga: string;
  city?: string;
  fullAddress?: string;
  landmark?: string;
}

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

export const NIGERIAN_STATES = getStates();

export const lgasForState = (state?: string) =>
  state ? getLgasByState(state) : [];

export const citiesForLga = (state?: string, lga?: string) =>
  state && lga ? getCitiesAndTownsByLga(state, lga) : [];

export const isValidState = (state?: string) =>
  NIGERIAN_STATES.some((item) => normalize(item) === normalize(state));

export const isValidLga = (state?: string, lga?: string) =>
  lgasForState(state).some((item) => normalize(item) === normalize(lga));

export const isKnownCityOrTown = (
  state?: string,
  lga?: string,
  city?: string,
) => {
  if (!city?.trim()) return true;
  const cities = citiesForLga(state, lga);
  if (!cities.length) return true;
  return cities.some((item) => normalize(item) === normalize(city));
};

export const locationError = (value: Partial<NigerianLocationValue>) => {
  if (!value.state?.trim()) return "Select a Nigerian state.";
  if (!isValidState(value.state)) return "Select a valid Nigerian state.";
  if (!value.lga?.trim()) return "Select an LGA for the selected state.";
  if (!isValidLga(value.state, value.lga)) {
    return "Select an LGA that belongs to the selected state.";
  }
  if (!isKnownCityOrTown(value.state, value.lga, value.city)) {
    return "Select a city or town that belongs to the selected LGA.";
  }
  if (!value.fullAddress?.trim()) return "Enter the detailed address.";
  return undefined;
};
