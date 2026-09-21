/**
 * Type declarations for Google Maps JavaScript API
 */

declare namespace google.maps {
  export class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    setMapTypeId(mapTypeId: MapTypeId | string): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    getCenter(): LatLng;
    getZoom(): number;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: MapTypeId | string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    streetViewControl?: boolean;
    rotateControl?: boolean;
    fullscreenControl?: boolean;
    styles?: MapTypeStyle[];
  }

  export enum MapTypeId {
    HYBRID = 'hybrid',
    ROADMAP = 'roadmap',
    SATELLITE = 'satellite',
    TERRAIN = 'terrain',
  }

  export interface MapTypeStyle {
    elementType?: string;
    featureType?: string;
    stylers?: any[];
  }

  export class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setIcon(icon: string | Icon | Symbol): void;
    setTitle(title: string): void;
    getPosition(): LatLng | undefined;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    animation?: any;
    zIndex?: number;
    draggable?: boolean;
  }

  export interface Icon {
    url: string;
    scaledSize?: Size;
    size?: Size;
    origin?: Point;
    anchor?: Point;
  }

  export interface Symbol {
    path: SymbolPath | string;
    fillColor?: string;
    fillOpacity?: number;
    scale?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    rotation?: number;
    anchor?: Point;
  }

  export enum SymbolPath {
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
  }

  export class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    open(options?: InfoWindowOpenOptions | Map, anchor?: Marker): void;
    close(): void;
    setContent(content: string | Node): void;
    setPosition(position: LatLng | LatLngLiteral): void;
  }

  export interface InfoWindowOptions {
    content?: string | Node;
    position?: LatLng | LatLngLiteral;
    maxWidth?: number;
    pixelOffset?: Size;
  }

  export interface InfoWindowOpenOptions {
    anchor?: Marker;
    map?: Map;
    shouldFocus?: boolean;
  }

  export class Polyline {
    constructor(opts?: PolylineOptions);
    setMap(map: Map | null): void;
    setPath(path: LatLng[] | LatLngLiteral[]): void;
  }

  export interface PolylineOptions {
    path?: LatLng[] | LatLngLiteral[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    geodesic?: boolean;
    icons?: IconSequence[];
    map?: Map;
  }

  export interface IconSequence {
    icon?: Symbol;
    offset?: string;
    repeat?: string;
  }

  export class Circle {
    constructor(opts?: CircleOptions);
    setMap(map: Map | null): void;
    setCenter(center: LatLng | LatLngLiteral): void;
    setRadius(radius: number): void;
  }

  export interface CircleOptions {
    center?: LatLng | LatLngLiteral;
    radius?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
    map?: Map;
  }

  export class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  export interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  export class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    getCenter(): LatLng;
  }

  export interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  export class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  export class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    width: number;
    height: number;
  }

  export interface MapsEventListener {
    remove(): void;
  }

  export namespace event {
    export function addListener(instance: any, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    export function removeListener(listener: MapsEventListener): void;
    export function trigger(instance: any, eventName: string, ...args: any[]): void;
  }
}

interface Window {
  google?: typeof google;
}
