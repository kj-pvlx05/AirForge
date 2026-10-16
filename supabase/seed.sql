-- =============================================================================
-- AEROSYNC — Synthetic Operational Seed Data
-- Database: Supabase PostgreSQL
-- Notice: ALL data is 100% fictional/synthetic. No real aircraft or military data.
-- =============================================================================

-- Clean up existing data in reverse dependency order
TRUNCATE TABLE ai_analysis CASCADE;
TRUNCATE TABLE recommendations CASCADE;
TRUNCATE TABLE optimization_runs CASCADE;
TRUNCATE TABLE simulation_events CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE mission_crew CASCADE;
TRUNCATE TABLE maintenance_records CASCADE;
TRUNCATE TABLE weather_conditions CASCADE;
TRUNCATE TABLE airspace_restrictions CASCADE;
TRUNCATE TABLE missions CASCADE;
TRUNCATE TABLE aircraft CASCADE;
TRUNCATE TABLE crew CASCADE;
TRUNCATE TABLE sectors CASCADE;
TRUNCATE TABLE airports CASCADE;

-- =============================================================================
-- 1. AIRPORTS (5 Fictional Facilities)
-- =============================================================================
INSERT INTO airports (id, code, name, latitude, longitude, elevation_ft, runway_length_m, status, region, fuel_available)
VALUES
('a0000000-0000-0000-0000-000000000001', 'SYN-ALPHA', 'Alpha Air Station', 28.6139, 77.2090, 710, 2400, 'operational', 'Northern Highlands', true),
('a0000000-0000-0000-0000-000000000002', 'SYN-BRAVO', 'Bravo Forward Base', 19.0760, 72.8777, 45, 1800, 'operational', 'Coastal Sector B', true),
('a0000000-0000-0000-0000-000000000003', 'SYN-CHARLIE', 'Charlie Logistics Hub', 22.7196, 75.8577, 1800, 2800, 'operational', 'Central Corridor', true),
('a0000000-0000-0000-0000-000000000004', 'SYN-DELTA', 'Delta Relief Staging Camp', 22.5726, 88.3639, 30, 1600, 'operational', 'Eastern Flood Zone', true),
('a0000000-0000-0000-0000-000000000005', 'SYN-ECHO', 'Echo Mountain Outpost', 30.7333, 76.7794, 2850, 1200, 'operational', 'Western Highlands', true);

-- =============================================================================
-- 2. OPERATIONAL SECTORS (6 Fictional Sectors with GeoJSON Polygons)
-- =============================================================================
INSERT INTO sectors (id, code, name, boundary, status, risk_level, notes)
VALUES
('b0000000-0000-0000-0000-000000000001', 'SEC-A', 'Sector A - Northern Highlands', 
 '{"type": "Polygon", "coordinates": [[[76.0, 28.0], [78.5, 28.0], [78.5, 30.5], [76.0, 30.5], [76.0, 28.0]]]}', 'active', 'low', 'Northern mountain approaches, generally stable weather.'),

('b0000000-0000-0000-0000-000000000002', 'SEC-B', 'Sector B - Coastal Corridor', 
 '{"type": "Polygon", "coordinates": [[[71.5, 18.0], [74.5, 18.0], [74.5, 20.5], [71.5, 20.5], [71.5, 18.0]]]}', 'active', 'medium', 'High maritime humidity; vulnerable to sudden tropical rain & convective squalls.'),

('b0000000-0000-0000-0000-000000000003', 'SEC-C', 'Sector C - Central Transit Corridor', 
 '{"type": "Polygon", "coordinates": [[[74.5, 21.5], [77.5, 21.5], [77.5, 24.0], [74.5, 24.0], [74.5, 21.5]]]}', 'active', 'low', 'Main logistics arterial connector between northern and coastal staging bases.'),

('b0000000-0000-0000-0000-000000000004', 'SEC-D', 'Sector D - Eastern River Delta', 
 '{"type": "Polygon", "coordinates": [[[87.0, 21.5], [89.5, 21.5], [89.5, 23.5], [87.0, 23.5], [87.0, 21.5]]]}', 'active', 'medium', 'Flood-relief operational sector; multiple remote landing zones.'),

('b0000000-0000-0000-0000-000000000005', 'SEC-E', 'Sector E - Western Ridge', 
 '{"type": "Polygon", "coordinates": [[[75.0, 29.5], [78.0, 29.5], [78.0, 31.5], [75.0, 31.5], [75.0, 29.5]]]}', 'active', 'high', 'High-altitude ridgelines; requires specialized mountain qualification.'),

('b0000000-0000-0000-0000-000000000006', 'SEC-F', 'Sector F - Southern Training Zone', 
 '{"type": "Polygon", "coordinates": [[[76.0, 16.5], [78.5, 16.5], [78.5, 18.5], [76.0, 18.5], [76.0, 16.5]]]}', 'active', 'low', 'Designated low-risk operational training and instrument practice box.');

-- =============================================================================
-- 3. AIRCRAFT (22 Synthetic Fleet Units — Non-Combat Only)
-- Models:
--   - AeroLift M1 (Medium utility helicopter)
--   - AeroLift H2 (Heavy transport helicopter)
--   - AeroTransport T1 (Fixed-wing transport)
--   - AeroUtility U1 (Light utility helicopter)
-- =============================================================================
INSERT INTO aircraft (id, tail_number, model, type, role, base_airport_id, current_airport_id, status, max_range_km, max_payload_kg, max_passengers, cruise_speed_kmh, fuel_capacity_liters, fuel_level_percent, flight_hours, last_maintenance_date, next_maintenance_due)
VALUES
-- 8 x AeroLift M1 (Medium utility helicopter)
('c0000000-0000-0000-0000-000000000001', 'AS-LM01', 'AeroLift M1', 'Medium utility helicopter', 'medevac', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'available', 850, 2400, 12, 260, 1600, 95, 342.5, now() - INTERVAL '15 days', now() + INTERVAL '45 days'),
('c0000000-0000-0000-0000-000000000002', 'AS-LM02', 'AeroLift M1', 'Medium utility helicopter', 'search-and-rescue', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'available', 850, 2400, 12, 260, 1600, 88, 410.2, now() - INTERVAL '20 days', now() + INTERVAL '40 days'),
('c0000000-0000-0000-0000-000000000003', 'AS-LM03', 'AeroLift M1', 'Medium utility helicopter', 'medevac', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'available', 850, 2400, 12, 260, 1600, 92, 280.8, now() - INTERVAL '10 days', now() + INTERVAL '50 days'),
('c0000000-0000-0000-0000-000000000004', 'AS-LM04', 'AeroLift M1', 'Medium utility helicopter', 'disaster-relief', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'available', 850, 2400, 12, 260, 1600, 78, 512.0, now() - INTERVAL '25 days', now() + INTERVAL '35 days'),
('c0000000-0000-0000-0000-000000000005', 'AS-LM05', 'AeroLift M1', 'Medium utility helicopter', 'disaster-relief', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'available', 850, 2400, 12, 260, 1600, 100, 195.4, now() - INTERVAL '5 days', now() + INTERVAL '55 days'),
('c0000000-0000-0000-0000-000000000006', 'AS-LM06', 'AeroLift M1', 'Medium utility helicopter', 'standby', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'available', 850, 2400, 12, 260, 1600, 85, 320.1, now() - INTERVAL '18 days', now() + INTERVAL '42 days'),
('c0000000-0000-0000-0000-000000000007', 'AS-LM07', 'AeroLift M1', 'Medium utility helicopter', 'search-and-rescue', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'available', 850, 2400, 12, 260, 1600, 90, 480.0, now() - INTERVAL '12 days', now() + INTERVAL '48 days'),
('c0000000-0000-0000-0000-000000000008', 'AS-LM08', 'AeroLift M1', 'Medium utility helicopter', 'training', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'maintenance', 850, 2400, 12, 260, 1600, 45, 620.5, now() - INTERVAL '32 days', now() - INTERVAL '2 days'),

-- 4 x AeroLift H2 (Heavy transport helicopter)
('c0000000-0000-0000-0000-000000000009', 'AS-LH01', 'AeroLift H2', 'Heavy transport helicopter', 'disaster-relief', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'available', 1100, 8500, 36, 290, 4200, 95, 280.0, now() - INTERVAL '14 days', now() + INTERVAL '46 days'),
('c0000000-0000-0000-0000-000000000010', 'AS-LH02', 'AeroLift H2', 'Heavy transport helicopter', 'transport', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'available', 1100, 8500, 36, 290, 4200, 82, 340.5, now() - INTERVAL '22 days', now() + INTERVAL '38 days'),
('c0000000-0000-0000-0000-000000000011', 'AS-LH03', 'AeroLift H2', 'Heavy transport helicopter', 'disaster-relief', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'available', 1100, 8500, 36, 290, 4200, 90, 190.2, now() - INTERVAL '8 days', now() + INTERVAL '52 days'),
('c0000000-0000-0000-0000-000000000012', 'AS-LH04', 'AeroLift H2', 'Heavy transport helicopter', 'transport', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'maintenance', 1100, 8500, 36, 290, 4200, 30, 710.0, now() - INTERVAL '40 days', now() - INTERVAL '5 days'),

-- 4 x AeroTransport T1 (Fixed-wing transport)
('c0000000-0000-0000-0000-000000000013', 'AS-TT01', 'AeroTransport T1', 'Fixed-wing transport', 'transport', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'available', 3600, 9200, 48, 480, 7800, 98, 520.4, now() - INTERVAL '15 days', now() + INTERVAL '45 days'),
('c0000000-0000-0000-0000-000000000014', 'AS-TT02', 'AeroTransport T1', 'Fixed-wing transport', 'disaster-relief', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'available', 3600, 9200, 48, 480, 7800, 90, 410.0, now() - INTERVAL '25 days', now() + INTERVAL '35 days'),
('c0000000-0000-0000-0000-000000000015', 'AS-TT03', 'AeroTransport T1', 'Fixed-wing transport', 'transport', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'available', 3600, 9200, 48, 480, 7800, 85, 315.6, now() - INTERVAL '10 days', now() + INTERVAL '50 days'),
('c0000000-0000-0000-0000-000000000016', 'AS-TT04', 'AeroTransport T1', 'Fixed-wing transport', 'training', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'grounded', 3600, 9200, 48, 480, 7800, 20, 890.1, now() - INTERVAL '50 days', now() - INTERVAL '10 days'),

-- 6 x AeroUtility U1 (Light utility helicopter)
('c0000000-0000-0000-0000-000000000017', 'AS-LU01', 'AeroUtility U1', 'Light utility helicopter', 'search-and-rescue', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'available', 680, 1100, 5, 240, 720, 92, 215.3, now() - INTERVAL '12 days', now() + INTERVAL '48 days'),
('c0000000-0000-0000-0000-000000000018', 'AS-LU02', 'AeroUtility U1', 'Light utility helicopter', 'medevac', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'available', 680, 1100, 5, 240, 720, 88, 305.8, now() - INTERVAL '19 days', now() + INTERVAL '41 days'),
('c0000000-0000-0000-0000-000000000019', 'AS-LU03', 'AeroUtility U1', 'Light utility helicopter', 'search-and-rescue', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'available', 680, 1100, 5, 240, 720, 95, 175.4, now() - INTERVAL '7 days', now() + INTERVAL '53 days'),
('c0000000-0000-0000-0000-000000000020', 'AS-LU04', 'AeroUtility U1', 'Light utility helicopter', 'standby', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'available', 680, 1100, 5, 240, 720, 84, 260.0, now() - INTERVAL '16 days', now() + INTERVAL '44 days'),
('c0000000-0000-0000-0000-000000000021', 'AS-LU05', 'AeroUtility U1', 'Light utility helicopter', 'search-and-rescue', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'available', 680, 1100, 5, 240, 720, 90, 390.2, now() - INTERVAL '21 days', now() + INTERVAL '39 days'),
('c0000000-0000-0000-0000-000000000022', 'AS-LU06', 'AeroUtility U1', 'Light utility helicopter', 'training', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'maintenance', 680, 1100, 5, 240, 720, 40, 145.0, now() - INTERVAL '6 days', now() - INTERVAL '1 day');

-- =============================================================================
-- 4. CREW (32 Synthetic Personnel)
-- =============================================================================
INSERT INTO crew (id, code, name, role, rank, base_airport_id, status, qualifications, max_duty_hours, current_duty_hours, rest_period_hours)
VALUES
-- Pilots (12)
('d0000000-0000-0000-0000-000000000001', 'CRW-P01', 'Elena Vance', 'pilot', 'Senior Flight Officer', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['IFR', 'NVG', 'SAR_CERT', 'MOUNTAIN_OPS'], 12.0, 2.5, 10.0),
('d0000000-0000-0000-0000-000000000002', 'CRW-P02', 'Marcus Finch', 'pilot', 'Flight Captain', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['IFR', 'HEAVY_LIFT', 'OVERWATER'], 12.0, 1.0, 10.0),
('d0000000-0000-0000-0000-000000000003', 'CRW-P03', 'Devon Rhodes', 'pilot', 'Senior Flight Officer', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['IFR', 'NVG', 'OVERWATER', 'MEDEVAC_OPS'], 12.0, 3.0, 10.0),
('d0000000-0000-0000-0000-000000000004', 'CRW-P04', 'Ananya Sen', 'pilot', 'Flight Captain', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['IFR', 'NVG', 'SAR_CERT'], 12.0, 0.0, 10.0),
('d0000000-0000-0000-0000-000000000005', 'CRW-P05', 'Liam Callahan', 'pilot', 'Senior Flight Officer', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['IFR', 'HEAVY_LIFT', 'FIXED_WING'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000006', 'CRW-P06', 'Sofia Mendez', 'pilot', 'Flight Captain', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['IFR', 'FIXED_WING', 'CARGO_OPS'], 12.0, 1.5, 10.0),
('d0000000-0000-0000-0000-000000000007', 'CRW-P07', 'Tariq Al-Mansoor', 'pilot', 'Flight Officer', 'a0000000-0000-0000-0000-000000000004', 'available', ARRAY['IFR', 'SAR_CERT', 'FLOOD_RELIEF'], 12.0, 4.0, 10.0),
('d0000000-0000-0000-0000-000000000008', 'CRW-P08', 'Kavita Nair', 'pilot', 'Senior Flight Officer', 'a0000000-0000-0000-0000-000000000004', 'available', ARRAY['IFR', 'NVG', 'MEDEVAC_OPS'], 12.0, 0.0, 10.0),
('d0000000-0000-0000-0000-000000000009', 'CRW-P09', 'Rohan Verma', 'pilot', 'Senior Flight Officer', 'a0000000-0000-0000-0000-000000000005', 'available', ARRAY['IFR', 'MOUNTAIN_OPS', 'SAR_CERT'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000010', 'CRW-P10', 'Ingrid Lindholm', 'pilot', 'Flight Officer', 'a0000000-0000-0000-0000-000000000005', 'available', ARRAY['IFR', 'NVG', 'MOUNTAIN_OPS'], 12.0, 1.0, 10.0),
('d0000000-0000-0000-0000-000000000011', 'CRW-P11', 'Gabriel Osei', 'pilot', 'Flight Captain', 'a0000000-0000-0000-0000-000000000001', 'off-duty', ARRAY['IFR', 'NVG', 'SAR_CERT'], 12.0, 11.5, 10.0),
('d0000000-0000-0000-0000-000000000012', 'CRW-P12', 'Chloe Mercier', 'pilot', 'Flight Officer', 'a0000000-0000-0000-0000-000000000002', 'medical', ARRAY['IFR', 'OVERWATER'], 12.0, 0.0, 10.0),

-- Co-Pilots (6)
('d0000000-0000-0000-0000-000000000013', 'CRW-CP01', 'Aiden Zhao', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['IFR', 'NVG'], 12.0, 2.5, 10.0),
('d0000000-0000-0000-0000-000000000014', 'CRW-CP02', 'Hannah Becker', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['IFR', 'OVERWATER'], 12.0, 3.0, 10.0),
('d0000000-0000-0000-0000-000000000015', 'CRW-CP03', 'Carlos Ortiz', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['IFR', 'FIXED_WING'], 12.0, 1.5, 10.0),
('d0000000-0000-0000-0000-000000000016', 'CRW-CP04', 'Zara Phillips', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000004', 'available', ARRAY['IFR', 'SAR_CERT'], 12.0, 4.0, 10.0),
('d0000000-0000-0000-0000-000000000017', 'CRW-CP05', 'Vikram Sethi', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000005', 'available', ARRAY['IFR', 'MOUNTAIN_OPS'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000018', 'CRW-CP06', 'Lucas Dubois', 'co-pilot', 'First Officer', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['IFR', 'HEAVY_LIFT'], 12.0, 0.5, 10.0),

-- Flight Engineers (4)
('d0000000-0000-0000-0000-000000000019', 'CRW-FE01', 'Arjun Das', 'flight-engineer', 'Chief Systems Specialist', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['HEAVY_LIFT_TECH', 'TURBINE_CERT'], 12.0, 1.0, 10.0),
('d0000000-0000-0000-0000-000000000020', 'CRW-FE02', 'Nadia Kowalski', 'flight-engineer', 'Systems Specialist', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['AVIONICS_CERT', 'OVERWATER_GEAR'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000021', 'CRW-FE03', 'Kenji Sato', 'flight-engineer', 'Senior Systems Specialist', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['FIXED_WING_TECH', 'CARGO_RIGGING'], 12.0, 1.5, 10.0),
('d0000000-0000-0000-0000-000000000022', 'CRW-FE04', 'Mira Al-Hashemi', 'flight-engineer', 'Systems Specialist', 'a0000000-0000-0000-0000-000000000004', 'available', ARRAY['WINCH_OPERATOR', 'TURBINE_CERT'], 12.0, 3.5, 10.0),

-- Flight Medics (5)
('d0000000-0000-0000-0000-000000000023', 'CRW-MD01', 'Dr. Rachel Vance', 'flight-medic', 'Lead Flight Paramedic', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['CRITICAL_CARE', 'PEDIATRIC_ADV', 'WINCH_RESCUE'], 12.0, 2.5, 10.0),
('d0000000-0000-0000-0000-000000000024', 'CRW-MD02', 'Siddharth Roy', 'flight-medic', 'Senior Paramedic', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['CRITICAL_CARE', 'OVERWATER_RESCUE'], 12.0, 3.0, 10.0),
('d0000000-0000-0000-0000-000000000025', 'CRW-MD03', 'Emily Thornton', 'flight-medic', 'Flight Paramedic', 'a0000000-0000-0000-0000-000000000004', 'available', ARRAY['CRITICAL_CARE', 'TRAUMA_LIFE_SUPPORT'], 12.0, 0.0, 10.0),
('d0000000-0000-0000-0000-000000000026', 'CRW-MD04', 'David Kim', 'flight-medic', 'Flight Paramedic', 'a0000000-0000-0000-0000-000000000005', 'available', ARRAY['MOUNTAIN_MEDIC', 'HYPOTHERMIA_CERT'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000027', 'CRW-MD05', 'Pooja Iyer', 'flight-medic', 'Lead Flight Paramedic', 'a0000000-0000-0000-0000-000000000002', 'off-duty', ARRAY['CRITICAL_CARE'], 12.0, 11.0, 10.0),

-- Loadmasters (3)
('d0000000-0000-0000-0000-000000000028', 'CRW-LM01', 'Derrick Boone', 'loadmaster', 'Master Cargo Controller', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['HEAVY_RIGGING', 'AIRDROP_CERT'], 12.0, 1.0, 10.0),
('d0000000-0000-0000-0000-000000000029', 'CRW-LM02', 'Fatima Zahra', 'loadmaster', 'Cargo Controller', 'a0000000-0000-0000-0000-000000000002', 'available', ARRAY['HAZMAT_RELIEF', 'RAPID_OFFLOAD'], 12.0, 2.5, 10.0),
('d0000000-0000-0000-0000-000000000030', 'CRW-LM03', 'Tomas Novak', 'loadmaster', 'Master Cargo Controller', 'a0000000-0000-0000-0000-000000000003', 'available', ARRAY['FIXED_WING_CARGO', 'HEAVY_RIGGING'], 12.0, 1.5, 10.0),

-- Operations Observers (2)
('d0000000-0000-0000-0000-000000000031', 'CRW-OB01', 'Maya Lin', 'operations-observer', 'Mission Specialist', 'a0000000-0000-0000-0000-000000000001', 'available', ARRAY['SAR_GRID_MAPPING', 'SENSOR_OPERATOR'], 12.0, 2.0, 10.0),
('d0000000-0000-0000-0000-000000000032', 'CRW-OB02', 'Owen Gallagher', 'operations-observer', 'Mission Specialist', 'a0000000-0000-0000-0000-000000000005', 'available', ARRAY['FLIR_OPERATOR', 'MOUNTAIN_LOOKOUT'], 12.0, 1.5, 10.0);

-- =============================================================================
-- 5. MISSIONS (16 Synthetic Tasks — Non-Combat Only)
-- =============================================================================
INSERT INTO missions (id, code, title, type, priority, status, origin_airport_id, destination_airport_id, sector_id, assigned_aircraft_id, required_aircraft_model, required_crew_composition, passenger_count, cargo_weight_kg, urgency_score, scheduled_start, scheduled_end, notes)
VALUES
-- Critical missions
('e0000000-0000-0000-0000-000000000001', 'MSN-2026-01', 'Emergency Pediatric Medevac - Coastal Clinic', 'medevac', 'critical', 'scheduled', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'AeroLift M1', '{"pilot": 1, "co-pilot": 1, "flight-medic": 1}', 2, 80.0, 95, now() + INTERVAL '1 hour', now() + INTERVAL '4 hours', 'Urgent medical airlift from Sector B coastal zone to Alpha General Care.'),
('e0000000-0000-0000-0000-000000000002', 'MSN-2026-02', 'High-Altitude Hiker Evacuation - Echo Ridge', 'search-and-rescue', 'critical', 'scheduled', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007', 'AeroLift M1', '{"pilot": 1, "flight-medic": 1, "operations-observer": 1}', 3, 120.0, 92, now() + INTERVAL '2 hours', now() + INTERVAL '5 hours', 'Winch-assisted rescue in Western Ridge high-altitude sector.'),
('e0000000-0000-0000-0000-000000000003', 'MSN-2026-03', 'Critical Water Purification Airlift - Delta Post', 'disaster-relief', 'critical', 'scheduled', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000011', 'AeroLift H2', '{"pilot": 1, "co-pilot": 1, "loadmaster": 1}', 0, 6200.0, 90, now() + INTERVAL '1 hour', now() + INTERVAL '5 hours', 'Heavy delivery of mobile water filters to flooded river staging camps.'),

-- High-priority missions
('e0000000-0000-0000-0000-000000000004', 'MSN-2026-04', 'Coastal Storm Surge Medical Evac Support', 'medevac', 'high', 'scheduled', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000018', 'AeroUtility U1', '{"pilot": 1, "flight-medic": 1}', 1, 40.0, 82, now() + INTERVAL '2 hours', now() + INTERVAL '4 hours', 'Pre-emptive evacuation of vulnerable patients along Sector B shoreline.'),
('e0000000-0000-0000-0000-000000000005', 'MSN-2026-05', 'Central Food Rations Bulk Distribution', 'disaster-relief', 'high', 'scheduled', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000013', 'AeroTransport T1', '{"pilot": 1, "co-pilot": 1, "loadmaster": 1}', 4, 8500.0, 78, now() + INTERVAL '3 hours', now() + INTERVAL '7 hours', 'Fixed-wing tactical supply bridging northern storage to delta relief.'),
('e0000000-0000-0000-0000-000000000006', 'MSN-2026-06', 'Maritime Distress Beacon Reconnaissance', 'search-and-rescue', 'high', 'scheduled', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'AeroLift M1', '{"pilot": 1, "co-pilot": 1, "operations-observer": 1}', 0, 200.0, 85, now() + INTERVAL '1 hour', now() + INTERVAL '4 hours', 'Sweep Sector B coastal box for reported disabled research vessel.'),
('e0000000-0000-0000-0000-000000000007', 'MSN-2026-07', 'Northern Medical Team Relocation', 'transport', 'high', 'scheduled', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'AeroLift M1', '{"pilot": 1, "flight-medic": 1}', 8, 350.0, 75, now() + INTERVAL '4 hours', now() + INTERVAL '7 hours', 'Transport 8 specialized epidemiologists to Highland staging post.'),

-- Medium-priority missions
('e0000000-0000-0000-0000-000000000008', 'MSN-2026-08', 'Emergency Blanket & Tent Dispatch', 'disaster-relief', 'medium', 'scheduled', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000014', 'AeroTransport T1', '{"pilot": 1, "co-pilot": 1, "loadmaster": 1}', 2, 7000.0, 65, now() + INTERVAL '5 hours', now() + INTERVAL '9 hours', 'Logistics supply transit across Central Corridor.'),
('e0000000-0000-0000-0000-000000000009', 'MSN-2026-09', 'Power Generator Deployment - Delta Substation', 'transport', 'medium', 'scheduled', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000009', 'AeroLift H2', '{"pilot": 1, "flight-engineer": 1, "loadmaster": 1}', 0, 7500.0, 60, now() + INTERVAL '6 hours', now() + INTERVAL '10 hours', 'Transport heavy diesel generators to flood-affected micro-grids.'),
('e0000000-0000-0000-0000-000000000010', 'MSN-2026-10', 'Coastal Sector Environmental Reconnaissance', 'search-and-rescue', 'medium', 'scheduled', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 'AeroLift H2', '{"pilot": 1, "co-pilot": 1}', 0, 300.0, 55, now() + INTERVAL '4 hours', now() + INTERVAL '8 hours', 'Aerial survey of coastline levees in Sector B before impending squall.'),
('e0000000-0000-0000-0000-000000000011', 'MSN-2026-11', 'Highland Weather Station Diagnostic Team', 'transport', 'medium', 'scheduled', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000021', 'AeroUtility U1', '{"pilot": 1, "operations-observer": 1}', 3, 150.0, 50, now() + INTERVAL '5 hours', now() + INTERVAL '8 hours', 'Routine sensor servicing run to mountain automatic weather station.'),
('e0000000-0000-0000-0000-000000000012', 'MSN-2026-12', 'Relief Fuel Bladders Transfer', 'disaster-relief', 'medium', 'scheduled', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'AeroLift M1', '{"pilot": 1, "flight-engineer": 1}', 0, 2100.0, 58, now() + INTERVAL '3 hours', now() + INTERVAL '6 hours', 'Deliver emergency kerosene & avgas containers to forward refueling cache.'),

-- Low-priority / Training / Standby missions
('e0000000-0000-0000-0000-000000000013', 'MSN-2026-13', 'Night Vision Goggle Recertification Flight', 'training', 'low', 'scheduled', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000022', 'AeroUtility U1', '{"pilot": 1, "co-pilot": 1}', 0, 0.0, 25, now() + INTERVAL '8 hours', now() + INTERVAL '10 hours', 'Standard NVG flight pattern training in Sector F.'),
('e0000000-0000-0000-0000-000000000014', 'MSN-2026-14', 'Northern Sector Medevac Standby Readiness', 'standby', 'low', 'active', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'AeroLift M1', '{"pilot": 1, "flight-medic": 1}', 0, 0.0, 30, now() - INTERVAL '2 hours', now() + INTERVAL '6 hours', 'Hot standby 15-minute launch window for northern emergencies.'),
('e0000000-0000-0000-0000-000000000015', 'MSN-2026-15', 'Delta Relief Reserve Standby', 'standby', 'low', 'active', 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 'AeroLift M1', '{"pilot": 1, "co-pilot": 1}', 0, 0.0, 30, now() - INTERVAL '1 hour', now() + INTERVAL '7 hours', 'Standby resource designated for urgent callout in river delta.'),
('e0000000-0000-0000-0000-000000000016', 'MSN-2026-16', 'Mountain Route Instrument Check Flight', 'training', 'low', 'scheduled', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000017', 'AeroUtility U1', '{"pilot": 1}', 0, 0.0, 20, now() + INTERVAL '9 hours', now() + INTERVAL '11 hours', 'IFR precision approach verification for high-altitude passes.');

-- =============================================================================
-- 6. MISSION CREW ASSIGNMENTS (Junction Data)
-- =============================================================================
INSERT INTO mission_crew (id, mission_id, crew_id, role_on_mission)
VALUES
-- Mission 1: Coastal Medevac
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'pilot'),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000014', 'co-pilot'),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000024', 'flight-medic'),

-- Mission 2: Mountain SAR
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000009', 'pilot'),
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000026', 'flight-medic'),
('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000032', 'operations-observer'),

-- Mission 3: Delta Water Relief
('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000007', 'pilot'),
('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000016', 'co-pilot'),
('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000028', 'loadmaster'),

-- Mission 5: Food Rations (Fixed-wing)
('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'pilot'),
('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000015', 'co-pilot'),
('f0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000030', 'loadmaster');

-- =============================================================================
-- 7. MAINTENANCE RECORDS (11 Synthetic Maintenance Events)
-- =============================================================================
INSERT INTO maintenance_records (id, aircraft_id, type, description, status, scheduled_start, scheduled_end, actual_end, technician_notes)
VALUES
('70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'scheduled', '600-hour comprehensive rotorhead inspection', 'in-progress', now() - INTERVAL '2 days', now() + INTERVAL '3 days', NULL, 'Disassembly complete, torque links within tolerance.'),
('70000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012', 'unscheduled', 'Auxiliary Power Unit turbine seal oil leak', 'delayed', now() - INTERVAL '3 days', now() + INTERVAL '2 days', NULL, 'Awaiting specialized seal replacement shipment at Charlie hub.'),
('70000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000016', 'engine-overhaul', 'Port turboprop hot-section inspection', 'in-progress', now() - INTERVAL '5 days', now() + INTERVAL '10 days', NULL, 'Grounded for scheduled engine overhaul protocol.'),
('70000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'avionics-check', 'Periodic weather radar calibration', 'completed', now() - INTERVAL '16 days', now() - INTERVAL '15 days', now() - INTERVAL '15 days', 'Transceiver power tested 100% nominal.'),
('70000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'airframe-inspection', 'Hoist cable tensile load calibration', 'completed', now() - INTERVAL '21 days', now() - INTERVAL '20 days', now() - INTERVAL '20 days', 'New rescue cable certified for 280 kg live load.'),
('70000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'scheduled', 'Routine 100-hour airframe check', 'completed', now() - INTERVAL '11 days', now() - INTERVAL '10 days', now() - INTERVAL '10 days', 'All flight controls lubricated, filter elements replaced.'),
('70000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'avionics-check', 'GPS / RNAV flight computer firmware update', 'completed', now() - INTERVAL '6 days', now() - INTERVAL '5 days', now() - INTERVAL '5 days', 'Navigation database cycle 2610 applied.'),
('70000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000010', 'airframe-inspection', 'Ramp hydraulic cylinder seal flush', 'completed', now() - INTERVAL '23 days', now() - INTERVAL '22 days', now() - INTERVAL '22 days', 'Zero pressure loss detected after test cycling.'),
('70000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000014', 'scheduled', 'Tire wear inspection and brake pack test', 'completed', now() - INTERVAL '26 days', now() - INTERVAL '25 days', now() - INTERVAL '25 days', 'Nosewheel assembly torqued and aligned.'),
('70000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000018', 'avionics-check', 'Medical oxygen onboard distribution check', 'completed', now() - INTERVAL '20 days', now() - INTERVAL '19 days', now() - INTERVAL '19 days', 'Flow regulators passed high-pressure test.'),
('70000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000021', 'airframe-inspection', 'Tail rotor gearbox oil analysis', 'completed', now() - INTERVAL '22 days', now() - INTERVAL '21 days', now() - INTERVAL '21 days', 'Zero metallic particulates found in chip detector.');

-- =============================================================================
-- 8. WEATHER CONDITIONS (Environmental Baseline)
-- =============================================================================
INSERT INTO weather_conditions (id, region, sector_id, airport_id, condition, severity, visibility_km, wind_speed_kts, wind_direction_deg, ceiling_ft, temperature_c, is_vfr, valid_from, valid_until)
VALUES
('80000000-0000-0000-0000-000000000001', 'Northern Highlands', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'clear', 'none', 10.0, 8, 310, 8500, 22.5, true, now() - INTERVAL '1 hour', now() + INTERVAL '12 hours'),
('80000000-0000-0000-0000-000000000002', 'Coastal Sector B', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'scattered-clouds', 'none', 8.5, 14, 240, 4200, 29.0, true, now() - INTERVAL '1 hour', now() + INTERVAL '8 hours'),
('80000000-0000-0000-0000-000000000003', 'Central Corridor', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'clear', 'none', 10.0, 6, 180, 9000, 27.2, true, now() - INTERVAL '1 hour', now() + INTERVAL '12 hours'),
('80000000-0000-0000-0000-000000000004', 'Eastern Flood Zone', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'light-rain', 'moderate', 5.2, 18, 120, 1800, 26.0, false, now() - INTERVAL '1 hour', now() + INTERVAL '6 hours'),
('80000000-0000-0000-0000-000000000005', 'Western Ridge', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'overcast', 'none', 7.0, 16, 280, 3100, 14.5, true, now() - INTERVAL '1 hour', now() + INTERVAL '8 hours'),
('80000000-0000-0000-0000-000000000006', 'Southern Training Zone', 'b0000000-0000-0000-0000-000000000006', NULL, 'clear', 'none', 10.0, 5, 200, 10000, 30.5, true, now() - INTERVAL '1 hour', now() + INTERVAL '12 hours');

-- =============================================================================
-- 9. AIRSPACE RESTRICTIONS (4 Synthetic Restrictions)
-- =============================================================================
INSERT INTO airspace_restrictions (id, identifier, name, type, sector_id, boundary, altitude_floor_ft, altitude_ceiling_ft, status, reason, active_from, active_until)
VALUES
('90000000-0000-0000-0000-000000000001', 'NOTAM-SEC-D-01', 'Delta Flood Relief Transit Corridor', 'relief-corridor', 'b0000000-0000-0000-0000-000000000004',
 '{"type": "Polygon", "coordinates": [[[87.5, 22.0], [88.5, 22.0], [88.5, 23.0], [87.5, 23.0], [87.5, 22.0]]]}', 500, 6000, 'active', 'Dedicated low-altitude humanitarian airlift corridor for flood operations.', now() - INTERVAL '1 day', now() + INTERVAL '5 days'),

('90000000-0000-0000-0000-000000000002', 'NOTAM-SEC-E-02', 'High-Altitude Pass Wind Shear Warning Zone', 'weather-hazard', 'b0000000-0000-0000-0000-000000000005',
 '{"type": "Polygon", "coordinates": [[[76.2, 30.0], [77.5, 30.0], [77.5, 31.0], [76.2, 31.0], [76.2, 30.0]]]}', 7000, 16000, 'active', 'Severe mountain downdrafts reported near Echo Pass.', now() - INTERVAL '6 hours', now() + INTERVAL '18 hours'),

('90000000-0000-0000-0000-000000000003', 'NOTAM-SEC-F-03', 'Aviation Cadet Low-Level Training Box', 'civil-protection-zone', 'b0000000-0000-0000-0000-000000000006',
 '{"type": "Polygon", "coordinates": [[[76.5, 17.0], [78.0, 17.0], [78.0, 18.0], [76.5, 18.0], [76.5, 17.0]]]}', 0, 4500, 'active', 'Restricted to scheduled training operations.', now() - INTERVAL '2 days', now() + INTERVAL '10 days'),

('90000000-0000-0000-0000-000000000004', 'NOTAM-SEC-B-04', 'Coastal Offshore Sea Search Grid', 'search-grid', 'b0000000-0000-0000-0000-000000000002',
 '{"type": "Polygon", "coordinates": [[[72.0, 18.5], [73.5, 18.5], [73.5, 19.5], [72.0, 19.5], [72.0, 18.5]]]}', 0, 3000, 'pending', 'Reserved grid for marine distress beacon sweep if weather deteriorates.', now() + INTERVAL '2 hours', now() + INTERVAL '10 hours');

-- =============================================================================
-- 10. SIMULATION EVENTS (Baseline Snapshot)
-- =============================================================================
INSERT INTO simulation_events (id, scenario_type, title, description, parameters, state_before, state_after, affected_aircraft_ids, affected_crew_ids, affected_mission_ids, status, triggered_at, completed_at)
VALUES
('10000000-0000-0000-0000-000000000001', 'weather_deterioration', 'Baseline Calibration - Sector B Weather Watch',
 'Initial baseline calibration of operational readiness under normal atmospheric conditions.',
 '{"sector_id": "b0000000-0000-0000-0000-000000000002", "target_severity": "severe", "forecast_visibility_km": 1.2, "duration_hours": 3}',
 '{"aircraft_total": 22, "aircraft_available": 18, "crew_total": 32, "crew_available": 28, "missions_active": 12, "readiness_score": 0.87}',
 '{"aircraft_total": 22, "aircraft_available": 18, "crew_total": 32, "crew_available": 28, "missions_active": 12, "readiness_score": 0.87}',
 '{}', '{}', '{}',
 'completed', now() - INTERVAL '1 hour', now() - INTERVAL '1 hour');

-- =============================================================================
-- 11. OPTIMIZATION RUNS (Baseline Optimization Record)
-- =============================================================================
INSERT INTO optimization_runs (id, simulation_event_id, trigger_reason, solver_status, objective_value, solve_time_ms, total_missions, assigned_missions, unassigned_missions, constraints_applied, constraint_violations_avoided, raw_result)
VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'baseline_init', 'OPTIMAL', 0.8750, 48, 16, 15, 1,
 '["aircraft_availability", "aircraft_capability", "crew_availability", "crew_qualification", "airport_availability", "weather_restrictions", "airspace_restrictions", "mission_priority"]',
 '["Aircraft AS-LM08 excluded due to active maintenance", "Aircraft AS-LH04 excluded due to APU delay", "Aircraft AS-TT04 excluded due to grounded status", "Crew CRW-P11 excluded due to 11.5 duty hours"]',
 '{"status": "OPTIMAL", "solve_time_ms": 48, "assigned_count": 15, "unassigned_count": 1}');

-- =============================================================================
-- 12. RECOMMENDATIONS (Baseline Recommendation)
-- =============================================================================
INSERT INTO recommendations (id, optimization_run_id, simulation_event_id, title, summary, action_type, allocations, impact_summary, ai_explanation, status)
VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Optimal Baseline Fleet Deployment',
 'All critical medevac and high-priority relief sorties are fully staffed and assigned to certified airframes.',
 'reallocate_aircraft',
 '[{"mission_code": "MSN-2026-01", "tail_number": "AS-LM03", "crew_codes": ["CRW-P03", "CRW-CP02", "CRW-MD02"]}, {"mission_code": "MSN-2026-02", "tail_number": "AS-LM07", "crew_codes": ["CRW-P09", "CRW-MD04", "CRW-OB02"]}, {"mission_code": "MSN-2026-03", "tail_number": "AS-LH03", "crew_codes": ["CRW-P07", "CRW-CP04", "CRW-LM01"]}]',
 '{"aircraft_utilization": 0.82, "crew_utilization": 0.76, "critical_coverage": 1.0, "high_coverage": 1.0}',
 'Baseline operational posture is healthy with 87% overall readiness. Three aircraft are undergoing routine scheduled maintenance at Charlie and Alpha bases. High-priority disaster relief and medevac commitments are fully covered with sufficient standby reserves in Northern and Delta sectors.',
 'applied');

-- =============================================================================
-- 13. SYSTEM EVENTS LOG (Audit Feed)
-- =============================================================================
INSERT INTO events (id, type, category, title, description, metadata)
VALUES
('40000000-0000-0000-0000-000000000001', 'info', 'system', 'AEROSYNC Operational Session Initialized', 'Decision-support prototype connected to operational data streams.', '{"version": "0.1.0", "mode": "synthetic"}'),
('40000000-0000-0000-0000-000000000002', 'info', 'fleet', 'Fleet Readiness Diagnostic Complete', '18 of 22 aircraft available across 5 staging stations.', '{"available": 18, "total": 22}'),
('40000000-0000-0000-0000-000000000003', 'warning', 'weather', 'Convective Activity Monitored in Sector B', 'Atmospheric sensors indicate rising humidity and localized wind gusts up to 18 kts near Bravo Base.', '{"sector": "SEC-B", "gusts_kts": 18}'),
('40000000-0000-0000-0000-000000000004', 'optimization', 'mission', 'Baseline Resource Allocation Computed', 'OR-Tools CP-SAT solver successfully assigned 15 active missions in 48ms.', '{"solver": "CP-SAT", "solve_time_ms": 48}');
