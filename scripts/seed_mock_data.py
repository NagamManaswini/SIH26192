import sys
import os
from datetime import datetime, timedelta, timezone
import random

# Add backend directory to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.enums import (
    UserRole,
    SensorType,
    SensorStatus,
    RiskLevel,
    AlertType,
    AlertSeverity,
    AlertStatus,
    CitizenReportType,
    VerificationStatus,
)
from app.models.user import User
from app.models.watershed import Watershed
from app.models.sensor import Sensor
from app.models.readings import RainfallReading, RiverReading, SoilMoistureReading
from app.models.prediction import FloodPrediction
from app.models.alert import Alert
from app.models.citizen_report import CitizenReport
from app.models.evacuation import EvacuationCenter
from app.models.historical import HistoricalFloodEvent
from app.models.sensor_health import SensorHealth

def seed_database():
    print("[INIT] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Sensor).count() >= 10:
            print("[INFO] Database already contains seed sensors. Refreshing data...")
        
        # 1. Seed Users
        print("[USERS] Seeding Users...")
        from app.core.security import get_password_hash
        demo_password_hash = get_password_hash("password123")
        
        sample_users = [
            User(
                name="Admin Disaster Operations",
                email="admin@flashflood.gov.in",
                password_hash=demo_password_hash,
                role=UserRole.ADMIN,
                phone="+91-11-23456789",
                district="Dehradun",
                state="Uttarakhand",
                latitude=30.3165,
                longitude=78.0322,
            ),
            User(
                name="District Disaster Officer",
                email="officer.sharma@disastermgmt.gov.in",
                role=UserRole.GOVERNMENT_OFFICIAL,
                password_hash=demo_password_hash,
                phone="+91-9876543210",
                district="Rudraprayag",
                state="Uttarakhand",
                latitude=30.2844,
                longitude=78.9811,
            ),
            User(
                name="NDRF Battalion Commander",
                email="commander.ndrf@response.gov.in",
                role=UserRole.RESPONSE_TEAM,
                password_hash=demo_password_hash,
                phone="+91-9412345678",
                district="Chamoli",
                state="Uttarakhand",
                latitude=30.5562,
                longitude=79.5663,
            ),
            User(
                name="Dr. Anita Hydrologist",
                email="dr.anita.hydrology@research.ac.in",
                role=UserRole.RESEARCHER,
                password_hash=demo_password_hash,
                phone="+91-9811223344",
                district="Nainital",
                state="Uttarakhand",
                latitude=29.3919,
                longitude=79.4542,
            ),
            User(
                name="Citizen Volunteer 1",
                email="volunteer.sonprayag@community.in",
                role=UserRole.CITIZEN,
                password_hash=demo_password_hash,
                phone="+91-9899887766",
                village="Sonprayag",
                ward="Ward 3",
                district="Rudraprayag",
                state="Uttarakhand",
                latitude=30.6300,
                longitude=78.9980,
            ),
            User(
                name="Citizen Volunteer 2",
                email="volunteer.manali@community.in",
                role=UserRole.CITIZEN,
                password_hash=demo_password_hash,
                phone="+91-9788776655",
                village="Old Manali",
                ward="Ward 1",
                district="Kullu",
                state="Himachal Pradesh",
                latitude=32.2432,
                longitude=77.1892,
            ),
        ]
        
        for user in sample_users:
            existing = db.query(User).filter(User.email == user.email).first()
            if not existing:
                db.add(user)
            else:
                existing.password_hash = demo_password_hash
        db.commit()

        # 2. Seed 5 Watersheds
        print("[WATERSHEDS] Seeding 5 Watersheds...")
        watersheds_data = [
            Watershed(
                name="Mandakini Upper Catchment",
                code="WS-MAN-01",
                district="Rudraprayag",
                state="Uttarakhand",
                area_sq_km=142.5,
                risk_level=RiskLevel.HIGH,
                geometry='{"type":"Polygon","coordinates":[[[78.90,30.55],[79.02,30.50],[79.18,30.58],[79.22,30.72],[79.14,30.82],[78.98,30.80],[78.88,30.68],[78.90,30.55]]]}'
            ),
            Watershed(
                name="Alaknanda Gorge Basin",
                code="WS-ALA-02",
                district="Chamoli",
                state="Uttarakhand",
                area_sq_km=230.8,
                risk_level=RiskLevel.CRITICAL,
                geometry='{"type":"Polygon","coordinates":[[[79.35,30.38],[79.55,30.32],[79.72,30.45],[79.78,30.65],[79.62,30.78],[79.42,30.70],[79.32,30.52],[79.35,30.38]]]}'
            ),
            Watershed(
                name="Bhagirathi Headwaters",
                code="WS-BHA-03",
                district="Uttarkashi",
                state="Uttarakhand",
                area_sq_km=310.2,
                risk_level=RiskLevel.MODERATE,
                geometry='{"type":"Polygon","coordinates":[[[78.25,30.58],[78.50,30.52],[78.75,30.68],[78.82,30.88],[78.60,30.98],[78.35,30.85],[78.20,30.70],[78.25,30.58]]]}'
            ),
            Watershed(
                name="Pindar River Valley",
                code="WS-PIN-04",
                district="Bageshwar",
                state="Uttarakhand",
                area_sq_km=185.0,
                risk_level=RiskLevel.HIGH,
                geometry='{"type":"Polygon","coordinates":[[[79.32,29.95],[79.58,29.90],[79.75,30.08],[79.68,30.28],[79.48,30.25],[79.30,30.10],[79.32,29.95]]]}'
            ),
            Watershed(
                name="Beas Mountain Catchment",
                code="WS-BEA-05",
                district="Kullu",
                state="Himachal Pradesh",
                area_sq_km=275.4,
                risk_level=RiskLevel.MODERATE,
                geometry='{"type":"Polygon","coordinates":[[[77.05,31.75],[77.28,31.72],[77.42,31.95],[77.38,32.35],[77.12,32.40],[76.98,32.10],[77.05,31.75]]]}'
            ),
        ]

        created_watersheds = []
        for ws in watersheds_data:
            existing = db.query(Watershed).filter(Watershed.code == ws.code).first()
            if not existing:
                db.add(ws)
                db.flush()
                created_watersheds.append(ws)
            else:
                created_watersheds.append(existing)
        db.commit()

        # 3. Seed 10 Sensors
        print("[SENSORS] Seeding 10 Sensors...")
        sensors_data = [
            Sensor(
                sensor_code="S-RAIN-01",
                name="Kedarnath Peak Rain Gauge",
                sensor_type=SensorType.RAINFALL,
                latitude=30.7346,
                longitude=79.0669,
                elevation=3584.0,
                village="Kedarnath",
                watershed_id=created_watersheds[0].id,
                status=SensorStatus.ACTIVE,
                battery_level=94.5,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-RAIN-02",
                name="Gaurikund Precipitation Station",
                sensor_type=SensorType.RAINFALL,
                latitude=30.6512,
                longitude=79.0284,
                elevation=1982.0,
                village="Gaurikund",
                watershed_id=created_watersheds[0].id,
                status=SensorStatus.ACTIVE,
                battery_level=88.0,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-RIV-01",
                name="Sonprayag River Level Radar",
                sensor_type=SensorType.RIVER_LEVEL,
                latitude=30.6300,
                longitude=78.9980,
                elevation=1829.0,
                village="Sonprayag",
                watershed_id=created_watersheds[0].id,
                status=SensorStatus.ACTIVE,
                battery_level=97.2,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-RIV-02",
                name="Joshimath Alaknanda Acoustic Gauge",
                sensor_type=SensorType.RIVER_LEVEL,
                latitude=30.5562,
                longitude=79.5663,
                elevation=1890.0,
                village="Joshimath",
                watershed_id=created_watersheds[1].id,
                status=SensorStatus.ACTIVE,
                battery_level=91.0,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-SOIL-01",
                name="Tungnath Slope Saturation Sensor",
                sensor_type=SensorType.SOIL_MOISTURE,
                latitude=30.4889,
                longitude=79.2178,
                elevation=3680.0,
                village="Chopta",
                watershed_id=created_watersheds[0].id,
                status=SensorStatus.ACTIVE,
                battery_level=85.4,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-SOIL-02",
                name="Mana Gorge Moisture Probe",
                sensor_type=SensorType.SOIL_MOISTURE,
                latitude=30.7725,
                longitude=79.4952,
                elevation=3200.0,
                village="Mana",
                watershed_id=created_watersheds[1].id,
                status=SensorStatus.ACTIVE,
                battery_level=92.8,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-WEATH-01",
                name="Uttarkashi Meteorological Node",
                sensor_type=SensorType.WEATHER,
                latitude=30.7268,
                longitude=78.4354,
                elevation=1158.0,
                village="Uttarkashi",
                watershed_id=created_watersheds[2].id,
                status=SensorStatus.ACTIVE,
                battery_level=99.1,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-MULTI-01",
                name="Tharali Multi-Parameter Edge Station",
                sensor_type=SensorType.MULTI_SENSOR,
                latitude=30.0765,
                longitude=79.5080,
                elevation=1250.0,
                village="Tharali",
                watershed_id=created_watersheds[3].id,
                status=SensorStatus.ACTIVE,
                battery_level=89.0,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-RAIN-03",
                name="Solang Valley Precipitation Gauge",
                sensor_type=SensorType.RAINFALL,
                latitude=32.3160,
                longitude=77.1575,
                elevation=2560.0,
                village="Solang",
                watershed_id=created_watersheds[4].id,
                status=SensorStatus.ACTIVE,
                battery_level=96.3,
                last_seen=datetime.now(timezone.utc),
            ),
            Sensor(
                sensor_code="S-RIV-03",
                name="Bhuntar Beas Confluence Radar",
                sensor_type=SensorType.RIVER_LEVEL,
                latitude=31.8790,
                longitude=77.1540,
                elevation=1089.0,
                village="Bhuntar",
                watershed_id=created_watersheds[4].id,
                status=SensorStatus.ACTIVE,
                battery_level=93.7,
                last_seen=datetime.now(timezone.utc),
            ),
        ]

        created_sensors = []
        for s in sensors_data:
            existing = db.query(Sensor).filter(Sensor.sensor_code == s.sensor_code).first()
            if not existing:
                db.add(s)
                db.flush()
                created_sensors.append(s)
            else:
                created_sensors.append(existing)
        db.commit()

        # 4. Seed 20 Rainfall Readings
        print("[READINGS] Seeding 20 Rainfall Readings...")
        rain_sensors = [s for s in created_sensors if s.sensor_type in (SensorType.RAINFALL, SensorType.MULTI_SENSOR)]
        now = datetime.now(timezone.utc)
        for i in range(20):
            sensor = rain_sensors[i % len(rain_sensors)]
            reading_time = now - timedelta(minutes=(20 - i) * 15)
            # Simulated realistic mm/hr spikes
            rainfall_val = round(random.uniform(5.0, 48.5) if i > 12 else random.uniform(0.5, 12.0), 2)
            db.add(RainfallReading(
                sensor_id=sensor.id,
                rainfall_mm=rainfall_val,
                timestamp=reading_time
            ))
        db.commit()

        # 5. Seed 20 River Readings
        print("[READINGS] Seeding 20 River Water Level Readings...")
        river_sensors = [s for s in created_sensors if s.sensor_type in (SensorType.RIVER_LEVEL, SensorType.MULTI_SENSOR)]
        for i in range(20):
            sensor = river_sensors[i % len(river_sensors)]
            reading_time = now - timedelta(minutes=(20 - i) * 15)
            water_level = round(random.uniform(1.8, 5.2), 2)
            flow = round(water_level * random.uniform(25.0, 40.0), 1)
            db.add(RiverReading(
                sensor_id=sensor.id,
                water_level_m=water_level,
                flow_rate=flow,
                timestamp=reading_time
            ))
        db.commit()

        # 6. Seed 10 Soil Moisture Readings
        print("[READINGS] Seeding 10 Soil Moisture Readings...")
        soil_sensors = [s for s in created_sensors if s.sensor_type in (SensorType.SOIL_MOISTURE, SensorType.MULTI_SENSOR)]
        for i in range(10):
            sensor = soil_sensors[i % len(soil_sensors)]
            reading_time = now - timedelta(minutes=(10 - i) * 30)
            moisture_val = round(random.uniform(62.0, 91.5), 1)
            db.add(SoilMoistureReading(
                sensor_id=sensor.id,
                moisture_percentage=moisture_val,
                timestamp=reading_time
            ))
        db.commit()

        # 7. Seed 5 Evacuation Centers
        print("[EVACUATION] Seeding 5 Evacuation Centers...")
        evacuation_data = [
            EvacuationCenter(
                name="Guptkashi High School Relief Center",
                latitude=30.5228,
                longitude=79.0769,
                capacity=500,
                current_occupancy=45,
                contact_number="+91-1364-267890",
                facilities="Medical bay, Emergency generator, Potable water storage, High-frequency radio"
            ),
            EvacuationCenter(
                name="Joshimath Municipal Community Hall",
                latitude=30.5570,
                longitude=79.5680,
                capacity=350,
                current_occupancy=120,
                contact_number="+91-1389-222111",
                facilities="Helipad access, First-aid supplies, 500 blankets, Solar backup"
            ),
            EvacuationCenter(
                name="Uttarkashi District Sports Complex",
                latitude=30.7280,
                longitude=78.4390,
                capacity=800,
                current_occupancy=80,
                contact_number="+91-1374-245100",
                facilities="Ambulance bay, Commercial kitchen, Satellite phone, 24/7 paramedic crew"
            ),
            EvacuationCenter(
                name="Karnaprayag Polytechnic Ground Shelter",
                latitude=30.2580,
                longitude=79.2190,
                capacity=400,
                current_occupancy=10,
                contact_number="+91-1363-255400",
                facilities="Water purification unit, Flood rescue inflatable boats, Emergency shelter tents"
            ),
            EvacuationCenter(
                name="Kullu Municipal Ground Center",
                latitude=31.9578,
                longitude=77.1095,
                capacity=600,
                current_occupancy=0,
                contact_number="+91-1902-222500",
                facilities="Disaster response command truck, Wireless LoRa relay, Dry rations storage"
            ),
        ]
        for ec in evacuation_data:
            existing = db.query(EvacuationCenter).filter(EvacuationCenter.name == ec.name).first()
            if not existing:
                db.add(ec)
        db.commit()

        # 8. Seed Flood Predictions, Alerts, Historical Events, Citizen Reports, Sensor Health
        print("[ALERTS & PREDICTIONS] Seeding sample Predictions, Alerts, and Health Logs...")
        if db.query(FloodPrediction).count() == 0:
            db.add(FloodPrediction(
                watershed_id=created_watersheds[0].id,
                prediction_time=now,
                forecast_for=now + timedelta(minutes=60),
                predicted_water_level=4.85,
                probability=82.5,
                risk_level=RiskLevel.HIGH,
                confidence=91.2,
                model_version="v1.0-temporal"
            ))
            db.add(FloodPrediction(
                watershed_id=created_watersheds[1].id,
                prediction_time=now,
                forecast_for=now + timedelta(minutes=45),
                predicted_water_level=6.10,
                probability=94.0,
                risk_level=RiskLevel.CRITICAL,
                confidence=93.8,
                model_version="v1.0-temporal"
            ))

        if db.query(Alert).count() == 0:
            db.add(Alert(
                alert_type=AlertType.FLASH_FLOOD,
                severity=AlertSeverity.WARNING,
                title="Flash Flood Warning: Upper Mandakini Valley",
                message="Heavy rainfall exceeding 45mm/hr detected. High runoff expected in Sonprayag within 45 minutes.",
                latitude=30.6300,
                longitude=78.9980,
                radius_km=7.5,
                created_at=now,
                expires_at=now + timedelta(hours=3),
                status=AlertStatus.ACTIVE
            ))
            db.add(Alert(
                alert_type=AlertType.CLOUDBURST,
                severity=AlertSeverity.EMERGENCY,
                title="Cloudburst Inundation Warning: Alaknanda Valley",
                message="Extreme convective precipitation detected upstream of Joshimath. Immediate riverbank clearance required.",
                latitude=30.5562,
                longitude=79.5663,
                radius_km=10.0,
                created_at=now,
                expires_at=now + timedelta(hours=2),
                status=AlertStatus.ACTIVE
            ))

        if db.query(CitizenReport).count() == 0:
            citizen_user = db.query(User).filter(User.role == UserRole.CITIZEN).first()
            user_id = citizen_user.id if citizen_user else None
            db.add(CitizenReport(
                user_id=user_id,
                report_type=CitizenReportType.WATER_OVERFLOW,
                description="Mandakini river water has breached the lower footpath near Sonprayag bridge by 0.5m.",
                latitude=30.6320,
                longitude=79.0010,
                image_url="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
                verification_status=VerificationStatus.VERIFIED,
                created_at=now - timedelta(minutes=25)
            ))
            db.add(CitizenReport(
                user_id=user_id,
                report_type=CitizenReportType.LANDSLIDE,
                description="Minor rockfall and mud debris sliding onto Badrinath National Highway near Helang.",
                latitude=30.5120,
                longitude=79.5100,
                image_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
                verification_status=VerificationStatus.VERIFIED,
                created_at=now - timedelta(minutes=45)
            ))
            db.add(CitizenReport(
                user_id=user_id,
                report_type=CitizenReportType.RIVER_BANK_EROSION,
                description="Beas river bank cutting heavily into agricultural fields near Old Manali bridge.",
                latitude=32.2470,
                longitude=77.1850,
                image_url=None,
                verification_status=VerificationStatus.PENDING,
                created_at=now - timedelta(minutes=15)
            ))

        if db.query(HistoricalFloodEvent).count() == 0:
            db.add(HistoricalFloodEvent(
                name="2013 Kedarnath Flash Flood Disaster",
                location="Mandakini River Valley, Uttarakhand",
                start_time=datetime(2013, 6, 16, 14, 0, 0),
                end_time=datetime(2013, 6, 18, 18, 0, 0),
                maximum_rainfall=325.0,
                maximum_water_level=12.4,
                affected_area="120 sq km catchment in Rudraprayag & Chamoli",
                severity=RiskLevel.CRITICAL
            ))

        for sensor in created_sensors:
            db.add(SensorHealth(
                sensor_id=sensor.id,
                battery_level=sensor.battery_level,
                signal_strength=-68.5,
                last_seen=now,
                status=sensor.status,
                recorded_at=now
            ))

        db.commit()

        print("\n[SUCCESS] Database Seeding Successfully Completed:")
        print(f"   * Watersheds: {db.query(Watershed).count()} (Expected >= 5)")
        print(f"   * Sensors: {db.query(Sensor).count()} (Expected >= 10)")
        print(f"   * Rainfall Readings: {db.query(RainfallReading).count()} (Expected >= 20)")
        print(f"   * River Readings: {db.query(RiverReading).count()} (Expected >= 20)")
        print(f"   * Soil Moisture Readings: {db.query(SoilMoistureReading).count()} (Expected >= 10)")
        print(f"   * Evacuation Centers: {db.query(EvacuationCenter).count()} (Expected >= 5)")
        print(f"   * Users: {db.query(User).count()}")
        print(f"   * Predictions: {db.query(FloodPrediction).count()}")
        print(f"   * Alerts: {db.query(Alert).count()}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
