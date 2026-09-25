import { offlineDb } from './database';
import { 
  OfflineSensorRecord, 
  OfflineWatershedRecord, 
  OfflineAlertRecord, 
  OfflineEvacuationCenterRecord, 
  OfflineCitizenReportRecord,
  SyncMetadataRecord
} from './tables';
import { apiService } from '../services/api';
import { CreateCitizenReportPayload } from '../types';

export class OfflineSyncManager {
  private isSyncing = false;

  /**
   * Fetches latest state from FastAPI and stores in IndexedDB with timestamp.
   */
  async syncCloudToLocal(): Promise<SyncMetadataRecord> {
    if (this.isSyncing) {
      const existing = await offlineDb.syncMetadata.get('global_sync');
      return existing || {
        key: 'global_sync',
        last_synced_at: new Date().toISOString(),
        total_records_cached: 0,
        status: 'SYNCING'
      };
    }

    this.isSyncing = true;
    const nowStr = new Date().toISOString();

    try {
      // 1. Fetch from FastAPI in parallel
      const [sensors, watersheds, alerts, shelters, reports] = await Promise.all([
        apiService.getSensors().catch(() => []),
        apiService.getWatersheds().catch(() => []),
        apiService.getActiveAlerts().catch(() => []),
        apiService.getEvacuationCenters(false).catch(() => []),
        apiService.getCitizenReports().catch(() => [])
      ]);

      // 2. Commit into IndexedDB
      await offlineDb.transaction('rw', [
        offlineDb.sensors,
        offlineDb.watersheds,
        offlineDb.alerts,
        offlineDb.evacuationCenters,
        offlineDb.citizenReports,
        offlineDb.syncMetadata
      ], async () => {
        // Clear old cached snapshots (except pending citizen reports)
        await offlineDb.sensors.clear();
        await offlineDb.watersheds.clear();
        await offlineDb.alerts.clear();
        await offlineDb.evacuationCenters.clear();

        if (sensors.length > 0) {
          const sensorRecords: OfflineSensorRecord[] = sensors.map(s => ({ ...s, cached_at: nowStr }));
          await offlineDb.sensors.bulkPut(sensorRecords);
        }

        if (watersheds.length > 0) {
          const wsRecords: OfflineWatershedRecord[] = watersheds.map(w => ({ ...w, cached_at: nowStr }));
          await offlineDb.watersheds.bulkPut(wsRecords);
        }

        if (alerts.length > 0) {
          const alertRecords: OfflineAlertRecord[] = alerts.map(a => ({ ...a, cached_at: nowStr }));
          await offlineDb.alerts.bulkPut(alertRecords);
        }

        if (shelters.length > 0) {
          const shelterRecords: OfflineEvacuationCenterRecord[] = shelters.map(sh => ({ ...sh, cached_at: nowStr }));
          await offlineDb.evacuationCenters.bulkPut(shelterRecords);
        }

        // Merge server citizen reports without overwriting local PENDING reports
        for (const rep of reports) {
          const existing = await offlineDb.citizenReports.where('server_id').equals(rep.id).first();
          if (!existing) {
            await offlineDb.citizenReports.put({
              local_id: `server-${rep.id}`,
              server_id: rep.id,
              report_type: rep.report_type,
              description: rep.description,
              latitude: rep.latitude,
              longitude: rep.longitude,
              image_url: rep.image_url,
              verification_status: rep.verification_status,
              created_at: rep.created_at,
              sync_status: 'SYNCED',
              sync_attempts: 1,
              synced_at: nowStr
            });
          }
        }
      });

      const totalCached = sensors.length + watersheds.length + alerts.length + shelters.length + reports.length;
      const meta: SyncMetadataRecord = {
        key: 'global_sync',
        last_synced_at: nowStr,
        total_records_cached: totalCached,
        status: 'SUCCESS'
      };
      await offlineDb.syncMetadata.put(meta);
      return meta;
    } catch (err: any) {
      console.warn('Offline sync failed (device may be offline):', err);
      const meta: SyncMetadataRecord = {
        key: 'global_sync',
        last_synced_at: nowStr,
        total_records_cached: await this.getTotalCachedCount(),
        status: 'ERROR',
        error_message: err.message || 'Sync failed'
      };
      await offlineDb.syncMetadata.put(meta);
      return meta;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Submits a citizen report. If online, posts directly to server and saves SYNCED record.
   * If offline or API fails, saves to IndexedDB with sync_status = 'PENDING'.
   */
  async submitCitizenReport(payload: CreateCitizenReportPayload, isOnline: boolean): Promise<OfflineCitizenReportRecord> {
    const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowStr = new Date().toISOString();

    if (isOnline && navigator.onLine) {
      try {
        const serverReport = await apiService.createCitizenReport(payload);
        const record: OfflineCitizenReportRecord = {
          local_id: localId,
          server_id: serverReport.id,
          report_type: payload.report_type,
          description: payload.description,
          latitude: payload.latitude,
          longitude: payload.longitude,
          image_url: payload.image_url,
          verification_status: serverReport.verification_status,
          created_at: serverReport.created_at || nowStr,
          sync_status: 'SYNCED',
          sync_attempts: 1,
          synced_at: nowStr
        };
        await offlineDb.citizenReports.put(record);
        return record;
      } catch (err: any) {
        console.warn('Direct upload failed, saving report locally to IndexedDB queue:', err);
      }
    }

    // Save offline with PENDING status
    const pendingRecord: OfflineCitizenReportRecord = {
      local_id: localId,
      report_type: payload.report_type,
      description: payload.description,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image_url: payload.image_url,
      verification_status: 'PENDING',
      created_at: nowStr,
      sync_status: 'PENDING',
      sync_attempts: 0
    };
    await offlineDb.citizenReports.put(pendingRecord);
    return pendingRecord;
  }

  /**
   * Flushes and uploads all PENDING / FAILED reports when internet returns.
   */
  async syncPendingCitizenReports(): Promise<{ synced: number; failed: number; totalPending: number }> {
    const pendingList = await offlineDb.citizenReports
      .where('sync_status')
      .anyOf(['PENDING', 'FAILED'])
      .toArray();

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pendingList) {
      // Mark SYNCING
      await offlineDb.citizenReports.update(item.local_id, {
        sync_status: 'SYNCING',
        sync_attempts: item.sync_attempts + 1
      });

      try {
        const payload: CreateCitizenReportPayload = {
          report_type: item.report_type,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          image_url: item.image_url
        };

        const serverRes = await apiService.createCitizenReport(payload);

        // Mark SYNCED with server ID
        await offlineDb.citizenReports.update(item.local_id, {
          server_id: serverRes.id,
          sync_status: 'SYNCED',
          synced_at: new Date().toISOString(),
          last_sync_error: undefined
        });
        syncedCount++;
      } catch (err: any) {
        console.error(`Failed to sync offline report ${item.local_id}:`, err);
        await offlineDb.citizenReports.update(item.local_id, {
          sync_status: 'FAILED',
          last_sync_error: err.message || 'Upload failed'
        });
        failedCount++;
      }
    }

    return {
      synced: syncedCount,
      failed: failedCount,
      totalPending: pendingList.length - syncedCount
    };
  }

  /**
   * Returns stats on citizen report sync queue.
   */
  async getReportSyncStats(): Promise<{ pending: number; syncing: number; synced: number; failed: number; total: number }> {
    const all = await offlineDb.citizenReports.toArray();
    return {
      pending: all.filter(r => r.sync_status === 'PENDING').length,
      syncing: all.filter(r => r.sync_status === 'SYNCING').length,
      synced: all.filter(r => r.sync_status === 'SYNCED').length,
      failed: all.filter(r => r.sync_status === 'FAILED').length,
      total: all.length
    };
  }

  /**
   * Reads cached data from IndexedDB for offline UI.
   */
  async getOfflineSensors() {
    return offlineDb.sensors.toArray();
  }

  async getOfflineWatersheds() {
    return offlineDb.watersheds.toArray();
  }

  async getOfflineAlerts() {
    return offlineDb.alerts.toArray();
  }

  async getOfflineEvacuationCenters() {
    return offlineDb.evacuationCenters.toArray();
  }

  async getOfflineCitizenReports() {
    return offlineDb.citizenReports.reverse().sortBy('created_at');
  }

  async getLastSyncMetadata(): Promise<SyncMetadataRecord | undefined> {
    return offlineDb.syncMetadata.get('global_sync');
  }

  async getTotalCachedCount(): Promise<number> {
    const [s, w, a, sh, r] = await Promise.all([
      offlineDb.sensors.count(),
      offlineDb.watersheds.count(),
      offlineDb.alerts.count(),
      offlineDb.evacuationCenters.count(),
      offlineDb.citizenReports.count()
    ]);
    return s + w + a + sh + r;
  }
}

export const syncManager = new OfflineSyncManager();
