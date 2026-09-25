import axios from 'axios';
import { 
  HealthResponse, 
  OverviewMetrics, 
  User, 
  AuthResponse, 
  LoginPayload, 
  RegisterPayload,
  RolePermissionInfo,
  SensorItem,
  SensorHealthOverview,
  SensorReadingsResponse,
  WatershedItem,
  GeoJSONFeatureCollection,
  MapSensorProperties,
  MapWatershedProperties,
  MapRiskZoneProperties,
  MapEvacuationCenterProperties,
  MapCitizenReportProperties,
  MapAlertProperties,
  WatershedRiskEvaluation,
  RiskConfigurationResponse,
  WatershedPredictionsResponse,
  ModelMetadata,
  AlertItem,
  NotificationLogItem,
  AlertZoneProperties,
  AlertEvaluationResponse,
  CitizenReportItem,
  CitizenReportDetail,
  CreateCitizenReportPayload,
  EvacuationCenterItem,
  EvacuationCenterCreatePayload,
  EvacuationCenterUpdatePayload,
  NearestCenterItem,
  EvacuationRouteResponse,
  CommandCenterOverviewKPIs,
  IncidentTimelineEvent,
  CommandCenterTrendsResponse,
  CommandCenterSensorHealthResponse,
  EdgeNetworkOverviewResponse,
  EdgeSimulationActionResponse,
  EdgeHazardTriggerResponse,
  AnalyticsSummaryKPIs,
  AnalyticsChartsResponse,
  DemoStatusResponse,
  DemoControlPayload
} from '../types';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `http://${window.location.hostname}:8000/api`;
    }
    // In production or cloud deployments (like Vercel), default to relative /api
    return '/api';
  }
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('flashflood_jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 Unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('flashflood_jwt_token');
        localStorage.removeItem('flashflood_user_profile');
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health Check
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  // Landing Overview Metrics
  getOverviewMetrics: async (): Promise<OverviewMetrics> => {
    const response = await apiClient.get<OverviewMetrics>('/overview/metrics');
    return response.data;
  },

  // Auth: Register
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  // Auth: Login
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  // Auth: Get Current Profile
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // RBAC: Permissions Matrix
  getPermissionsMatrix: async (): Promise<Record<string, RolePermissionInfo>> => {
    const response = await apiClient.get<Record<string, RolePermissionInfo>>('/rbac/permissions-matrix');
    return response.data;
  },

  // RBAC: Test Role Endpoint
  testRoleEndpoint: async (endpoint: string): Promise<any> => {
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Sensors: List with filters
  getSensors: async (params?: {
    sensor_type?: string;
    status?: string;
    watershed_id?: number;
    search?: string;
  }): Promise<SensorItem[]> => {
    const response = await apiClient.get<SensorItem[]>('/sensors', { params });
    return response.data;
  },

  // Sensors: Get by ID
  getSensorById: async (sensorId: number): Promise<SensorItem> => {
    const response = await apiClient.get<SensorItem>(`/sensors/${sensorId}`);
    return response.data;
  },

  // Sensors: Health Overview
  getSensorsHealth: async (): Promise<SensorHealthOverview> => {
    const response = await apiClient.get<SensorHealthOverview>('/sensors/health');
    return response.data;
  },

  // Sensors: Readings History
  getSensorReadings: async (sensorId: number, limit: number = 50): Promise<SensorReadingsResponse> => {
    const response = await apiClient.get<SensorReadingsResponse>(`/sensors/${sensorId}/readings`, {
      params: { limit }
    });
    return response.data;
  },

  // Watersheds: List
  getWatersheds: async (): Promise<WatershedItem[]> => {
    const response = await apiClient.get<WatershedItem[]>('/watersheds');
    return response.data;
  },

  // Telemetry: Ingest
  ingestTelemetry: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/sensors/ingest', payload);
    return response.data;
  },

  // Map: Sensors GeoJSON
  getMapSensors: async (): Promise<GeoJSONFeatureCollection<MapSensorProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapSensorProperties>>('/map/sensors');
    return response.data;
  },

  // Map: Watersheds GeoJSON
  getMapWatersheds: async (): Promise<GeoJSONFeatureCollection<MapWatershedProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapWatershedProperties>>('/map/watersheds');
    return response.data;
  },

  // Map: Risk Zones GeoJSON
  getMapRiskZones: async (): Promise<GeoJSONFeatureCollection<MapRiskZoneProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapRiskZoneProperties>>('/map/risk-zones');
    return response.data;
  },

  // Map: Evacuation Centers GeoJSON
  getMapEvacuationCenters: async (): Promise<GeoJSONFeatureCollection<MapEvacuationCenterProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapEvacuationCenterProperties>>('/map/evacuation-centers');
    return response.data;
  },

  // Map: Citizen Reports GeoJSON
  getMapCitizenReports: async (): Promise<GeoJSONFeatureCollection<MapCitizenReportProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapCitizenReportProperties>>('/map/citizen-reports');
    return response.data;
  },

  // Map: Alerts GeoJSON
  getMapAlerts: async (): Promise<GeoJSONFeatureCollection<MapAlertProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<MapAlertProperties>>('/map/alerts');
    return response.data;
  },

  // Explainable Risk Engine: Get Watershed Evaluation
  getWatershedRiskEvaluation: async (watershedId: number): Promise<WatershedRiskEvaluation> => {
    const response = await apiClient.get<WatershedRiskEvaluation>(`/risk/watershed/${watershedId}`);
    return response.data;
  },

  // Explainable Risk Engine: Get All Watersheds Matrix
  getAllWatershedsRisk: async (): Promise<WatershedRiskEvaluation[]> => {
    const response = await apiClient.get<WatershedRiskEvaluation[]>('/risk/all');
    return response.data;
  },

  // Explainable Risk Engine: Get Active Configuration
  getRiskConfiguration: async (): Promise<RiskConfigurationResponse> => {
    const response = await apiClient.get<RiskConfigurationResponse>('/risk/configuration');
    return response.data;
  },

  // Explainable Risk Engine: Update Configuration
  updateRiskConfiguration: async (payload: any): Promise<RiskConfigurationResponse> => {
    const response = await apiClient.put<RiskConfigurationResponse>('/risk/configuration', payload);
    return response.data;
  },

  // AI Forecasting Engine: Generate Predictions
  generatePredictions: async (watershedId?: number): Promise<{ message: string; count: number; results: WatershedPredictionsResponse[] }> => {
    const response = await apiClient.post<{ message: string; count: number; results: WatershedPredictionsResponse[] }>(
      '/predictions/generate',
      watershedId ? { watershed_id: watershedId } : {}
    );
    return response.data;
  },

  // AI Forecasting Engine: Get Predictions for Watershed
  getWatershedPredictions: async (watershedId: number): Promise<WatershedPredictionsResponse> => {
    const response = await apiClient.get<WatershedPredictionsResponse>(`/predictions/watershed/${watershedId}`);
    return response.data;
  },

  // AI Forecasting Engine: Get All Watershed Predictions
  getAllPredictions: async (): Promise<WatershedPredictionsResponse[]> => {
    const response = await apiClient.get<WatershedPredictionsResponse[]>('/predictions/all');
    return response.data;
  },

  // AI Forecasting Engine: Get Model Metadata
  getModelMetadata: async (): Promise<ModelMetadata> => {
    const response = await apiClient.get<ModelMetadata>('/predictions/metadata');
    return response.data;
  },

  // Real-Time Alert Engine: Get Alerts
  getAlerts: async (status?: string, severity?: string): Promise<AlertItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const response = await apiClient.get<AlertItem[]>(`/alerts?${params.toString()}`);
    return response.data;
  },

  // Real-Time Alert Engine: Get Active Alerts
  getActiveAlerts: async (): Promise<AlertItem[]> => {
    const response = await apiClient.get<AlertItem[]>('/alerts/active');
    return response.data;
  },

  // Real-Time Alert Engine: Acknowledge Alert
  acknowledgeAlert: async (alertId: number): Promise<{ message: string; alert: AlertItem }> => {
    const response = await apiClient.post<{ message: string; alert: AlertItem }>(`/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // Real-Time Alert Engine: Trigger Evaluation
  evaluateAlerts: async (watershedId?: number): Promise<AlertEvaluationResponse> => {
    const url = watershedId ? `/alerts/evaluate?watershed_id=${watershedId}` : '/alerts/evaluate';
    const response = await apiClient.post<AlertEvaluationResponse>(url);
    return response.data;
  },

  // Real-Time Alert Engine: Get Danger Zones GeoJSON
  getAlertZonesGeoJSON: async (): Promise<GeoJSONFeatureCollection<AlertZoneProperties>> => {
    const response = await apiClient.get<GeoJSONFeatureCollection<AlertZoneProperties>>('/alerts/zones/geojson');
    return response.data;
  },

  // Real-Time Alert Engine: Get Notification Audit Logs
  getNotificationLogs: async (limit: number = 50): Promise<NotificationLogItem[]> => {
    const response = await apiClient.get<NotificationLogItem[]>(`/alerts/notifications/log?limit=${limit}`);
    return response.data;
  },

  // Citizen Crowd-Sourcing: Submit Ground Report
  createCitizenReport: async (payload: CreateCitizenReportPayload): Promise<CitizenReportItem> => {
    const response = await apiClient.post<CitizenReportItem>('/reports', payload);
    return response.data;
  },

  // Citizen Crowd-Sourcing: Get All Reports
  getCitizenReports: async (status?: string, reportType?: string, verifiedOnly: boolean = false): Promise<CitizenReportItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('verification_status', status);
    if (reportType) params.append('report_type', reportType);
    if (verifiedOnly) params.append('verified_only', 'true');
    const response = await apiClient.get<CitizenReportItem[]>(`/reports?${params.toString()}`);
    return response.data;
  },

  // Citizen Crowd-Sourcing: Get Detailed Report with Nearby Sensors
  getCitizenReportById: async (reportId: number): Promise<CitizenReportDetail> => {
    const response = await apiClient.get<CitizenReportDetail>(`/reports/${reportId}`);
    return response.data;
  },

  // Citizen Crowd-Sourcing: Verify or Reject Report
  verifyCitizenReport: async (reportId: number, status: string, notes?: string): Promise<CitizenReportItem> => {
    const response = await apiClient.post<CitizenReportItem>(`/reports/${reportId}/verify`, {
      verification_status: status,
      verification_notes: notes
    });
    return response.data;
  },

  // Milestone 10: Evacuation Management & Hazard-Aware Routing
  getEvacuationCenters: async (activeOnly: boolean = false): Promise<EvacuationCenterItem[]> => {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active_only', 'true');
    const response = await apiClient.get<EvacuationCenterItem[]>(`/evacuation/centers?${params.toString()}`);
    return response.data;
  },

  createEvacuationCenter: async (payload: EvacuationCenterCreatePayload): Promise<EvacuationCenterItem> => {
    const response = await apiClient.post<EvacuationCenterItem>('/evacuation/centers', payload);
    return response.data;
  },

  updateEvacuationCenter: async (centerId: number, payload: EvacuationCenterUpdatePayload): Promise<EvacuationCenterItem> => {
    const response = await apiClient.put<EvacuationCenterItem>(`/evacuation/centers/${centerId}`, payload);
    return response.data;
  },

  getNearestShelters: async (lat: number, lng: number, limit: number = 5): Promise<NearestCenterItem[]> => {
    const response = await apiClient.get<NearestCenterItem[]>(`/evacuation/nearest?latitude=${lat}&longitude=${lng}&limit=${limit}`);
    return response.data;
  },

  getEvacuationRoute: async (originLat: number, originLng: number, destinationCenterId?: number, routeType?: string): Promise<EvacuationRouteResponse> => {
    let url = `/evacuation/routes?origin_lat=${originLat}&origin_lon=${originLng}`;
    if (destinationCenterId) {
      url += `&destination_id=${destinationCenterId}`;
    }
    if (routeType) {
      url += `&route_type=${encodeURIComponent(routeType)}`;
    }
    const response = await apiClient.get<EvacuationRouteResponse>(url);
    return response.data;
  },

  // Milestone 11: Disaster Response Command Center
  getCommandCenterOverview: async (): Promise<CommandCenterOverviewKPIs> => {
    const response = await apiClient.get<CommandCenterOverviewKPIs>('/command-center/overview');
    return response.data;
  },

  getIncidentTimeline: async (limit: number = 30, district?: string, watershedId?: number, riskLevel?: string): Promise<IncidentTimelineEvent[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (district) params.append('district', district);
    if (watershedId) params.append('watershed_id', watershedId.toString());
    if (riskLevel) params.append('risk_level', riskLevel);
    const response = await apiClient.get<IncidentTimelineEvent[]>(`/command-center/timeline?${params.toString()}`);
    return response.data;
  },

  getCommandCenterTrends: async (watershedId?: number, timeWindow: string = '24h'): Promise<CommandCenterTrendsResponse> => {
    const params = new URLSearchParams();
    if (watershedId) params.append('watershed_id', watershedId.toString());
    params.append('time_window', timeWindow);
    const response = await apiClient.get<CommandCenterTrendsResponse>(`/command-center/trends?${params.toString()}`);
    return response.data;
  },

  getCommandCenterSensorHealth: async (): Promise<CommandCenterSensorHealthResponse> => {
    const response = await apiClient.get<CommandCenterSensorHealthResponse>('/command-center/sensor-health');
    return response.data;
  },

  // Milestone 12: Edge & LoRaWAN Simulation
  getEdgeNetworkOverview: async (): Promise<EdgeNetworkOverviewResponse> => {
    const response = await apiClient.get<EdgeNetworkOverviewResponse>('/edge/overview');
    return response.data;
  },

  simulateEdgeNetworkFailure: async (): Promise<EdgeSimulationActionResponse> => {
    const response = await apiClient.post<EdgeSimulationActionResponse>('/edge/simulate-failure');
    return response.data;
  },

  restoreEdgeNetwork: async (): Promise<EdgeSimulationActionResponse> => {
    const response = await apiClient.post<EdgeSimulationActionResponse>('/edge/restore-network');
    return response.data;
  },

  triggerEdgeNodeHazard: async (nodeId: string): Promise<EdgeHazardTriggerResponse> => {
    const response = await apiClient.post<EdgeHazardTriggerResponse>(`/edge/nodes/${nodeId}/trigger-hazard`);
    return response.data;
  },

  // Milestone 13: Analytics & Historical Flood Analysis
  getAnalyticsSummary: async (params?: { date_range?: string; state?: string; district?: string; watershed_id?: number; sensor_id?: number }): Promise<AnalyticsSummaryKPIs> => {
    const query = new URLSearchParams();
    if (params?.date_range) query.append('date_range', params.date_range);
    if (params?.state) query.append('state', params.state);
    if (params?.district) query.append('district', params.district);
    if (params?.watershed_id) query.append('watershed_id', params.watershed_id.toString());
    if (params?.sensor_id) query.append('sensor_id', params.sensor_id.toString());
    const response = await apiClient.get<AnalyticsSummaryKPIs>(`/analytics/summary?${query.toString()}`);
    return response.data;
  },

  getAnalyticsCharts: async (params?: { date_range?: string; state?: string; district?: string; watershed_id?: number; sensor_id?: number }): Promise<AnalyticsChartsResponse> => {
    const query = new URLSearchParams();
    if (params?.date_range) query.append('date_range', params.date_range);
    if (params?.state) query.append('state', params.state);
    if (params?.district) query.append('district', params.district);
    if (params?.watershed_id) query.append('watershed_id', params.watershed_id.toString());
    if (params?.sensor_id) query.append('sensor_id', params.sensor_id.toString());
    const response = await apiClient.get<AnalyticsChartsResponse>(`/analytics/charts?${query.toString()}`);
    return response.data;
  },

  // Milestone 14: Demo Mode Orchestration
  getDemoStatus: async (): Promise<DemoStatusResponse> => {
    const response = await apiClient.get<DemoStatusResponse>('/demo/status');
    return response.data;
  },

  startDemo: async (payload?: DemoControlPayload): Promise<DemoStatusResponse> => {
    const response = await apiClient.post<DemoStatusResponse>('/demo/start', payload || {});
    return response.data;
  },

  stopDemo: async (): Promise<DemoStatusResponse> => {
    const response = await apiClient.post<DemoStatusResponse>('/demo/stop');
    return response.data;
  },

  advanceDemoStep: async (): Promise<DemoStatusResponse> => {
    const response = await apiClient.post<DemoStatusResponse>('/demo/advance-step');
    return response.data;
  },
};



