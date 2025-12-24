
export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  // year field removed, derived from dateStr
  dateStr: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  category?: string;
  isSaved?: boolean;
}

export interface MapPosition {
  lat: number;
  lng: number;
  zoom: number;
}

export interface GitHubConfig {
  token: string;
  gistId?: string;
}

export interface UserProfile {
  login: string;
  avatar_url: string;
  name: string;
}
