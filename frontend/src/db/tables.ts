import { 
  SensorItem, 
  WatershedItem, 
  AlertItem, 
  EvacuationCenterItem, 
  CitizenReportCategory,
  ReportVerificationStatus
} from '../types';

export interface OfflineSensorRecord extends SensorItem {
  cached_at: string;
}

export interface OfflineWatershedRecord extends WatershedItem {
  cached_at: string;
}

export interface OfflineRiskZoneRecord {
  id: string;
  name: string;
  watershed_id?: number;
  risk_category: string;
  score: number;
  geometry?: any;
  cached_at: string;
}

export interface OfflineAlertRecord extends AlertItem {
  cached_at: string;
}

export interface OfflineEvacuationCenterRecord extends EvacuationCenterItem {
  cached_at: string;
}

export type OfflineReportSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OfflineCitizenReportRecord {
  local_id: string;
  server_id?: number;
  report_type: CitizenReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  verification_status: ReportVerificationStatus;
  confidence_score?: number;
  created_at: string;
  sync_status: OfflineReportSyncStatus;
  sync_attempts: number;
  last_sync_error?: string;
  synced_at?: string;
}

export interface SyncMetadataRecord {
  key: string; // e.g. 'global_sync'
  last_synced_at: string;
  total_records_cached: number;
  status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  error_message?: string;
}
