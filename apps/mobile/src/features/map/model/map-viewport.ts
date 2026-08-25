export type MapViewportChange = {
  bounds: [west: number, south: number, east: number, north: number];
  center: [longitude: number, latitude: number];
  zoom: number;
  userInteraction: boolean;
};
