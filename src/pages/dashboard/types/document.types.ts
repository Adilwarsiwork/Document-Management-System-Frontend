export interface SelectedDocument {
  id: string;
  file: File;
}

export interface DashboardStatsData {
  selectedFiles: number;
  totalSelectedBytes: number;
}
