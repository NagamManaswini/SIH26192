import Dexie, { Table } from 'dexie';
import { 
  OfflineSensorRecord, 
  OfflineWatershedRecord, 
  OfflineRiskZoneRecord, 
  OfflineAlertRecord, 
  OfflineEvacuationCenterRecord, 
  OfflineCitizenReportRecord, 
  SyncMetadataRecord 
} from './tables';

export class FlashFloodOfflineDB extends Dexie {
  sensors!: Table<OfflineSensorRecord, number>;
  watersheds!: Table<OfflineWatershedRecord, number>;
  riskZones!: Table<OfflineRiskZoneRecord, string>;
  alerts!: Table<OfflineAlertRecord, number>;
  evacuationCenters!: Table<OfflineEvacuationCenterRecord, number>;
  citizenReports!: Table<OfflineCitizenReportRecord, string>; // primary key: local_id
  syncMetadata!: Table<SyncMetadataRecord, string>; // primary key: key

  constructor() {
    super('FlashFloodOfflineDB');

    // Define table schemas and indexes
    this.version(1).stores({
      sensors: 'id, sensor_code, sensor_type, status, watershed_id, cached_at',
      watersheds: 'id, name, district, state, risk_level, cached_at',
      riskZones: 'id, watershed_id, risk_category, cached_at',
      alerts: 'id, severity, status, created_at, cached_at',
      evacuationCenters: 'id, name, district, is_active, cached_at',
      citizenReports: 'local_id, server_id, report_type, sync_status, created_at',
      syncMetadata: 'key, last_synced_at, status'
    });
  }
}

export const offlineDb = new FlashFloodOfflineDB();
