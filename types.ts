export interface EarthquakeEvent {
  id: string;
  title: string;
  updated: Date;
  link: string;
  location: string;
  magnitude: number;
  depth: number;
  lat: number;
  lon: number;
  isTsunamiWarning: boolean;
  rawSummary: string;
  alertLevel: 'none' | 'info' | 'advisory' | 'watch' | 'warning';
}

export interface AlertSettings {
  minMagnitude: number;
  notificationsEnabled: boolean;
  recipients: string[];
  emailTemplate: string;
}

export interface GeneratedAlert {
  id: string;
  timestamp: string;
  event: EarthquakeEvent;
  body: string;
}
