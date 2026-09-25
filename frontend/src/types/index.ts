export type UserRole = 
  | 'CITIZEN' 
  | 'RESEARCHER' 
  | 'RESPONSE_TEAM' 
  | 'GOVERNMENT_OFFICIAL' 
  | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  village?: string;
  ward?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  village?: string;
  ward?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface RolePermissionInfo {
  title: string;
  description: string;
  permissions: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface LiveSensorsMetric {
  total_active: number;
  rainfall_gauges: number;
  water_level_radars: number;
  soil_moisture_probes: number;
  health_percentage: number;
  status: string;
}

export interface FloodRiskMetric {
  current_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  highest_risk_zone: string;
  soil_saturation_avg: number;
  critical_micro_watersheds: number;
}

export interface AiForecastMetric {
  lead_time_minutes: number;
  model_confidence: number;
  forecast_peak_intensity_mm_hr: number;
  probability_of_inundation: number;
  trend: string;
}

export interface ActiveAlertsMetric {
  critical_count: number;
  warning_count: number;
  advisory_count: number;
  latest_alert: string;
}

export interface OverviewMetrics {
  live_sensors: LiveSensorsMetric;
  flood_risk: FloodRiskMetric;
  ai_forecast: AiForecastMetric;
  active_alerts: ActiveAlertsMetric;
}

export type NavigationTab = 
  | 'command-center'
  | 'live-map'
  | 'sensors'
  | 'predictions'
  | 'alerts'
  | 'citizen-reports'
  | 'evacuation'
  | 'edge-network'
  | 'analytics'
  | 'pwa-status'
  | 'settings'
  | 'rbac-matrix'
  | 'login'
  | 'register';

export interface SensorItem {
  id: number;
  sensor_code: string;
  name: string;
  sensor_type: 'RAINFALL' | 'RIVER_LEVEL' | 'SOIL_MOISTURE' | 'WEATHER' | 'MULTI_SENSOR';
  latitude: number;
  longitude: number;
  elevation: number;
  village?: string;
  watershed_id?: number;
  watershed_name?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  battery_level: number;
  signal_strength?: number;
  last_seen?: string;
  created_at?: string;
  latest_reading?: {
    type: string;
    value: number;
    unit: string;
    flow_rate?: number;
    timestamp: string;
  };
}

export interface SensorHealthSnapshot {
  id: number;
  sensor_code: string;
  name: string;
  sensor_type: string;
  status: string;
  battery_level: number;
  signal_strength: number;
  last_seen?: string;
  village?: string;
  watershed_name?: string;
}

export interface SensorHealthOverview {
  total_sensors: number;
  active_count: number;
  offline_count: number;
  maintenance_count: number;
  inactive_count: number;
  avg_battery: number;
  low_battery_count: number;
  avg_signal: number;
  sensors: SensorHealthSnapshot[];
}

export interface SensorReadingItem {
  id: number;
  value: number;
  rainfall_mm?: number;
  water_level_m?: number;
  moisture_percentage?: number;
  flow_rate?: number;
  timestamp: string;
}

export interface SensorReadingsResponse {
  sensor_id: number;
  sensor_code: string;
  sensor_type: string;
  name: string;
  unit: string;
  readings: SensorReadingItem[];
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature<P = Record<string, any>> {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: P;
}

export interface GeoJSONFeatureCollection<P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
}

export interface MapSensorProperties {
  id: number;
  sensor_code: string;
  name: string;
  sensor_type: 'RAINFALL' | 'RIVER_LEVEL' | 'SOIL_MOISTURE' | 'WEATHER' | 'MULTI_SENSOR';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  latitude: number;
  longitude: number;
  elevation: number;
  battery_level: number;
  signal_strength: number;
  last_seen?: string;
  watershed_id?: number;
  watershed_name?: string;
  latest_reading?: {
    value: number;
    unit: string;
    param: string;
    timestamp?: string;
    multi_values?: Record<string, number>;
  };
}

export interface MapWatershedProperties {
  id: number;
  name: string;
  code: string;
  district: string;
  state: string;
  area_sq_km: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sensor_count: number;
  rainfall_avg_mm: number;
  river_level_max_m: number;
  soil_moisture_avg_pct: number;
  prediction?: {
    forecast_for?: string;
    predicted_water_level: number;
    probability: number;
    risk_level: string;
    confidence: number;
  };
  active_alert?: {
    id: number;
    title: string;
    severity: string;
    message: string;
    radius_km: number;
  };
}

export interface MapRiskZoneProperties {
  id: string;
  name: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  expected_depth_m: number;
  hazard_type: string;
  evacuation_status: string;
  color: string;
}

export interface MapEvacuationCenterProperties {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  available_spaces: number;
  occupancy_rate: number;
  status: 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL';
  contact_number?: string;
  facilities?: string;
}

export interface MapCitizenReportProperties {
  id: number;
  report_type: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at?: string;
}

export interface MapAlertProperties {
  id: number;
  alert_type: string;
  severity: 'ADVISORY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  created_at?: string;
  expires_at?: string;
  status: string;
}

export interface WatershedItem {
  id: number;
  name: string;
  code: string;
  district: string;
  state: string;
  area_sq_km: number;
  risk_level: string;
}

export interface RiskFactorItem {
  score: number;
  weight: number;
  value: number;
  unit: string;
  description: string;
}

export interface HistoricalComparison {
  past_events_count: number;
  worst_event_name: string;
  worst_event_max_water_m: number;
  worst_event_rainfall_mm: number;
  similarity_index_pct: number;
}

export interface WatershedRiskEvaluation {
  watershed_id: number;
  watershed_name: string;
  watershed_code: string;
  district: string;
  state: string;
  area_sq_km: number;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: {
    rainfall: RiskFactorItem;
    accumulated_rain: RiskFactorItem;
    river_level: RiskFactorItem;
    rate_of_rise: RiskFactorItem;
    soil_moisture: RiskFactorItem;
    slope: RiskFactorItem;
    historical_risk: RiskFactorItem;
  };
  explanation: string[];
  historical_comparison: HistoricalComparison;
  recommendation: string;
  evaluated_at: string;
}

export interface RiskConfigurationResponse {
  id: number;
  config_name: string;
  is_active: boolean;
  weights: {
    rainfall: number;
    accumulated_rain: number;
    river_level: number;
    rate_of_rise: number;
    soil_moisture: number;
    slope: number;
    historical: number;
  };
  thresholds: {
    rainfall_moderate_mm: number;
    rainfall_critical_mm: number;
    accumulated_rain_3h_mm: number;
    river_danger_m: number;
    river_critical_m: number;
    rate_of_rise_m_hr: number;
    soil_critical_pct: number;
    slope_steep_deg: number;
  };
  updated_at?: string;
}

export interface PredictionHorizonItem {
  minutes_ahead: 30 | 60 | 90 | 120;
  target_time: string;
  predicted_water_level: number;
  confidence_score: number;
  flood_probability: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  delta_from_current: number;
  uncertainty_lower: number;
  uncertainty_upper: number;
}

export interface ModelMetadata {
  model_name: string;
  architecture: string;
  version: string;
  trained_date: string;
  features_used: string[];
  mean_confidence: number;
  lead_time_min: number;
  lead_time_max: number;
  disclaimer: string;
  target_variable?: string;
  evaluation_metrics?: {
    rmse_m: number;
    mae_m: number;
    nse: number;
    auc_roc: number;
  };
}

export interface WatershedPredictionsResponse {
  watershed_id: number;
  watershed_name: string;
  watershed_code: string;
  current_water_level_m: number;
  current_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  evaluated_at: string;
  predictions: PredictionHorizonItem[];
  model_metadata: ModelMetadata;
}

export interface PredictionOverviewItem {
  watershed_id: number;
  watershed_name: string;
  watershed_code: string;
  current_level: number;
  max_predicted_120min: number;
  max_flood_prob_120min: number;
  peak_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  peak_horizon_min: number;
  lead_time_buffer_min: number;
}

export type AlertSeverityType = 'INFO' | 'WARNING' | 'DANGER' | 'EMERGENCY' | 'ADVISORY' | 'WATCH';
export type AlertStatusType = 'ACTIVE' | 'ACKNOWLEDGED' | 'EXPIRED' | 'CANCELLED';

export interface AlertItem {
  id: number;
  alert_type: string;
  severity: AlertSeverityType;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  status: AlertStatusType;
  created_at: string;
  expires_at?: string;
  polygon_coordinates?: [number, number][];
}

export interface NotificationLogItem {
  dispatch_id: string;
  provider: string;
  channel: 'SMS' | 'VOICE_IVR' | 'PUSH' | 'SIREN';
  recipient: string;
  severity: AlertSeverityType;
  title: string;
  message: string;
  status: string;
  timestamp: string;
  latency_ms?: number;
  tone_pattern?: string;
  script_spoken?: string;
  active_devices_reached?: number;
  metadata?: Record<string, any>;
}

export interface AlertZoneProperties {
  alert_id: number;
  title: string;
  message: string;
  severity: AlertSeverityType;
  alert_type: string;
  center: [number, number];
  radius_km: number;
  status: AlertStatusType;
  created_at?: string;
  expires_at?: string;
  color: string;
  fill_opacity: number;
}

export interface AlertEvaluationResultItem {
  watershed_id: number;
  watershed_name: string;
  action: 'ALERT_CREATED' | 'ALERT_ESCALATED' | 'DUPLICATE_SUPPRESSED' | 'NO_ALERT_REQUIRED';
  alert_id?: number;
  severity?: string;
  reasons?: string[];
  dispatches?: number;
  existing_alert_id?: number;
}

export interface AlertEvaluationResponse {
  timestamp: string;
  total_evaluated: number;
  results: AlertEvaluationResultItem[];
}

export type CitizenReportCategory = 
  | 'RIVER_RISING'
  | 'FLASH_FLOOD'
  | 'ROAD_BLOCKAGE'
  | 'LANDSLIDE'
  | 'BRIDGE_DAMAGE'
  | 'HEAVY_RAINFALL'
  | 'OTHER_EMERGENCY'
  | 'WATER_OVERFLOW'
  | 'ROAD_BLOCKED'
  | 'STRUCTURAL_DAMAGE'
  | 'OTHER';

export type ReportVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface NearbySensorMatchItem {
  sensor_id: number;
  sensor_name: string;
  sensor_type: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  status: string;
  latest_reading?: {
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    flow_rate?: number;
  };
  is_corroborating: boolean;
  corroboration_note?: string;
}

export interface CitizenReportItem {
  id: number;
  user_id?: number;
  report_type: CitizenReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  verification_status: ReportVerificationStatus;
  confidence_score?: number;
  verified_by_user_id?: number;
  verified_at?: string;
  verification_notes?: string;
  created_at: string;
}

export interface CitizenReportDetail extends CitizenReportItem {
  nearby_sensors_count: number;
  corroborating_sensors_count: number;
  nearby_sensors: NearbySensorMatchItem[];
  matching_reasons: string[];
}

export interface CreateCitizenReportPayload {
  report_type: CitizenReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  user_id?: number;
}

// Milestone 10: Evacuation Management Types
export interface EvacuationCenterBase {
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  is_active: boolean;
  district?: string;
  elevation_m?: number;
  contact_number?: string;
  facilities?: string;
}

export interface EvacuationCenterItem extends EvacuationCenterBase {
  id: number;
  available_capacity: number;
  occupancy_percentage: number;
}

export interface EvacuationCenterCreatePayload extends EvacuationCenterBase {}

export interface EvacuationCenterUpdatePayload {
  name?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  current_occupancy?: number;
  is_active?: boolean;
  district?: string;
  elevation_m?: number;
  contact_number?: string;
  facilities?: string;
}

export interface NearestCenterItem extends EvacuationCenterItem {
  distance_km: number;
  safety_score: number;
}

export interface EvacuationRouteStep {
  step_number: number;
  instruction: string;
  distance_km: number;
  elevation_change_m: string;
  hazard_status: string;
}

export interface ElevationProfilePoint {
  distance_km: number;
  elevation_m: number;
  latitude: number;
  longitude: number;
}

export interface EvacuationRouteResponse {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    available_capacity: number;
    elevation_m?: number;
  };
  total_distance_km: number;
  estimated_walking_time_min: number;
  estimated_driving_time_min: number;
  safety_index_pct: number;
  waypoints: [number, number][]; // [lat, lng] pairs
  elevation_profile: ElevationProfilePoint[];
  turn_by_turn_steps: EvacuationRouteStep[];
  hazard_avoidance_logs: string[];
}

// Milestone 11: Disaster Response Command Center Types
export interface CommandCenterOverviewKPIs {
  active_emergencies: int_or_number;
  critical_watersheds: number;
  high_risk_zones: number;
  active_alerts: number;
  online_sensors: number;
  offline_sensors: number;
  citizen_reports: number;
  people_at_risk: number;
  threat_level: string;
  system_readiness_pct: number;
  last_updated: string;
}
type int_or_number = number;

export interface IncidentTimelineEvent {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  description: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  source: string;
  status: string;
}

export interface TimeSeriesTrendPoint {
  timestamp: string;
  rainfall_mm: number;
  river_level_m: number;
  soil_moisture_pct: number;
  predicted_level_m?: number;
  risk_score: number;
}

export interface CommandCenterTrendsResponse {
  watershed_id?: number;
  watershed_name?: string;
  time_window: string;
  series: TimeSeriesTrendPoint[];
}

export interface SensorHealthAuditItem {
  id: number;
  sensor_code: string;
  name: string;
  sensor_type: string;
  status: string;
  battery_level: number;
  signal_strength: number;
  last_communication?: string;
  has_battery_warning: boolean;
  has_signal_warning: boolean;
  offline_duration_hours: number;
}

export interface CommandCenterSensorHealthResponse {
  total_sensors: number;
  online_count: number;
  offline_count: number;
  battery_warnings_count: number;
  signal_warnings_count: number;
  sensors: SensorHealthAuditItem[];
}

// Milestone 12: Edge & LoRaWAN Simulation Types
export interface LoRaGatewayItem {
  gateway_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  backhaul_type: string;
  connected: bool_type;
  packets_received: number;
  packets_dropped: number;
  packet_delivery_rate_pct: number;
  last_uplink_at: string;
}
type bool_type = boolean;

export interface EdgeSensorNodeItem {
  node_id: string;
  name: string;
  sensor_type: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  battery: number;
  signal: number;
  rssi_dbm: number;
  snr_db: number;
  frequency_mhz: number;
  spreading_factor: number;
  connected: boolean;
  gateway_id: string;
  local_risk_score: number;
  local_threshold: number;
  siren_status: boolean;
  siren_reason?: string;
  rainfall_rate_mmh: number;
  river_level_m: number;
  soil_moisture_pct: number;
  offline_events_count: number;
  last_sampled_at: string;
  last_synced_at?: string;
}

export interface EdgeSyncLogItem {
  sync_id: string;
  node_id: string;
  events_synced: number;
  timestamp: string;
  gateway_id: string;
  status: string;
}

export interface EdgeNetworkOverviewResponse {
  disclaimer: string;
  network_online: boolean;
  total_nodes: number;
  connected_nodes: number;
  offline_nodes: number;
  total_gateways: number;
  sirens_active: number;
  battery_low_nodes: number;
  total_offline_queued_events: number;
  gateways: LoRaGatewayItem[];
  nodes: EdgeSensorNodeItem[];
  recent_sync_logs: EdgeSyncLogItem[];
}

export interface EdgeSimulationActionResponse {
  status: string;
  message: string;
  network_online: boolean;
  affected_nodes_count?: number;
  total_events_synced?: number;
  sync_timestamp?: string;
}

export interface EdgeHazardTriggerResponse {
  status: string;
  node_id: string;
  network_online: boolean;
  siren_active: boolean;
  local_risk_score: number;
  local_threshold: number;
  siren_reason?: string;
  stored_in_offline_buffer: boolean;
  current_offline_buffer_count: number;
}

// Milestone 13: Analytics & Historical Flood Analysis
export interface AnalyticsSummaryKPIs {
  date_range: string;
  total_rainfall_events: number;
  average_rainfall_intensity_mmh: number;
  maximum_rainfall_intensity_mmh: number;
  maximum_river_water_level_m: number;
  average_soil_moisture_pct: number;
  total_alerts_dispatched: number;
  critical_flood_events_count: number;
  sensor_uptime_pct: number;
  ai_model_rmse: number;
  ai_model_mae: number;
  ai_model_nse_efficiency: number;
}

export interface AnalyticsChartDataPoint {
  timestamp: string;
  label: string;
  value: number;
  secondary_value?: number;
  category?: string;
}

export interface AnalyticsChartsResponse {
  date_range: string;
  rainfall_history: AnalyticsChartDataPoint[];
  river_level_history: AnalyticsChartDataPoint[];
  soil_moisture_history: AnalyticsChartDataPoint[];
  flood_events: AnalyticsChartDataPoint[];
  risk_distribution: { category: string; count: number; percentage: number; color: string }[];
  sensor_availability: { sensor_code: string; name: string; type: string; uptime_pct: number; status: string }[];
  alert_frequency: { severity: string; count: number; color: string }[];
  prediction_vs_actual: { timestamp: string; actual_level_m: number; predicted_level_m: number; absolute_error: number }[];
}

// Milestone 14: Demo Mode & Scenario Orchestration
export interface DemoStageInfo {
  stage_number: number;
  stage_title: string;
  stage_category: string;
  description: string;
  system_effects: string[];
  rainfall_rate_mmh: number;
  river_water_level_m: number;
  soil_moisture_pct: number;
  risk_score: number;
  risk_level: string;
  predicted_level_m: number;
  active_alert_severity?: string;
  evacuation_status: string;
  edge_siren_active: boolean;
  network_online: boolean;
  offline_buffer_count: number;
}

export interface DemoStatusResponse {
  is_running: boolean;
  current_stage: number;
  total_stages: number;
  auto_play: boolean;
  seconds_per_stage: number;
  stage_info: DemoStageInfo;
  active_watershed_name: string;
  completed_stages: number[];
  last_action: string;
  message: string;
}

export interface DemoControlPayload {
  auto_play?: boolean;
  seconds_per_stage?: number;
  jump_to_stage?: number;
}

