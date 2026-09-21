export type MapModule = { default: any; Marker: any; Polyline: any };

export function loadMapModule(loader: () => MapModule): MapModule | null {
  try {
    return loader();
  } catch {
    return null;
  }
}
