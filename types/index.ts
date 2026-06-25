export interface Property {
  id: string;
  url: string;
  address: string;
  name?: string;
  rent?: string;
  lat?: number;
  lng?: number;
  loading: boolean;
  error?: string;
}

export interface Location {
  id: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
}

export interface CommuteStep {
  instruction: string;
  duration: string;
  distance?: string;
  transitLine?: string;
  transitVehicle?: string;
  departureStop?: string;
  arrivalStop?: string;
}

export interface CommuteInfo {
  propertyId: string;
  locationId: string;
  duration: string;
  distance: string;
  mode: string;
  steps: CommuteStep[];
  departureStop?: string;
  arrivalStop?: string;
}
