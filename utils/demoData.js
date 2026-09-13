/**
 * Demo fallback data — mirrors the seed data in database/migrate.sql
 * Used when MySQL is unavailable so the app functions for demonstration.
 */

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'demoDataStore.json');

const seedEquipment = [
    { id: 1, equipment_id: 'EQ-001', name: 'Steam Autoclave Unit 1 - Pre-Vacuum', category: 'Steam Sterilizer', manufacturer: 'STERIS', model: 'AMSCO 400', serial_number: 'SN-STM-101', location: 'Sterile Processing Room A', installation_date: '2022-01-15', status: 'Active', last_maintenance_date: '2026-06-01', next_maintenance_date: '2026-09-15', created_at: '2024-01-15T00:00:00' },
    { id: 2, equipment_id: 'EQ-002', name: 'Steam Autoclave Unit 2 - Gravity', category: 'Steam Sterilizer', manufacturer: 'Getinge', model: 'GEV33', serial_number: 'SN-STM-102', location: 'Sterile Processing Room A', installation_date: '2022-03-10', status: 'Active', last_maintenance_date: '2026-05-20', next_maintenance_date: '2026-09-10', created_at: '2024-03-10T00:00:00' },
    { id: 3, equipment_id: 'EQ-003', name: 'Hydrogen Peroxide Plasma Sterilizer', category: 'Plasma Sterilizer', manufacturer: 'ASP', model: 'STERRAD 100S', serial_number: 'SN-PLS-201', location: 'OR Suite B', installation_date: '2021-08-20', status: 'Active', last_maintenance_date: '2026-04-15', next_maintenance_date: '2026-10-01', created_at: '2023-08-20T00:00:00' },
    { id: 4, equipment_id: 'EQ-004', name: 'Ethylene Oxide Chamber', category: 'EtO Sterilizer', manufacturer: '3M', model: 'Steri-Vac 5XL', serial_number: 'SN-ETO-301', location: 'Decontamination Room', installation_date: '2020-06-01', status: 'Under Maintenance', last_maintenance_date: '2026-07-10', next_maintenance_date: '2026-08-01', created_at: '2023-06-01T00:00:00' },
    { id: 5, equipment_id: 'EQ-005', name: 'Surgical Instrument Washer-Disinfector', category: 'Washer-Disinfector', manufacturer: 'Miele', model: 'G 7881', serial_number: 'SN-WSH-401', location: 'Decontamination Room', installation_date: '2023-01-05', status: 'Active', last_maintenance_date: '2026-08-01', next_maintenance_date: '2026-11-01', created_at: '2024-01-05T00:00:00' },
    { id: 6, equipment_id: 'EQ-006', name: 'Dry Heat Rapid Sterilizer', category: 'Dry Heat Sterilizer', manufacturer: 'Tuttnauer', model: '1730E', serial_number: 'SN-DRY-501', location: 'Dental Suite C', installation_date: '2021-12-10', status: 'Active', last_maintenance_date: '2026-07-01', next_maintenance_date: '2026-09-30', created_at: '2023-12-10T00:00:00' },
];

const seedCycles = [
    { id: 1, batch_number: 'BATCH-2026-001', cycle_type: 'Steam - Pre-Vacuum 134°C', start_time: '2026-09-01 08:00:00', end_time: '2026-09-01 08:45:00', temperature: 134.5, pressure: 30.0, duration: 4, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Routine cycle', created_at: '2026-09-01T08:00:00', equipment_name: 'Steam Autoclave Unit 1 - Pre-Vacuum', eq_code: 'EQ-001', operator_name: 'Sterilization Staff' },
    { id: 2, batch_number: 'BATCH-2026-002', cycle_type: 'Steam - Gravity 121°C', start_time: '2026-09-01 09:00:00', end_time: '2026-09-01 09:30:00', temperature: 121.0, pressure: 15.0, duration: 18, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Routine cycle', created_at: '2026-09-01T09:00:00', equipment_name: 'Steam Autoclave Unit 2 - Gravity', eq_code: 'EQ-002', operator_name: 'Sterilization Staff' },
    { id: 3, batch_number: 'BATCH-2026-003', cycle_type: 'Steam - Pre-Vacuum 134°C', start_time: '2026-09-02 08:00:00', end_time: '2026-09-02 08:45:00', temperature: 133.0, pressure: 30.5, duration: 3, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Normal operation', created_at: '2026-09-02T08:00:00', equipment_name: 'Steam Autoclave Unit 1 - Pre-Vacuum', eq_code: 'EQ-001', operator_name: 'Sterilization Staff' },
    { id: 4, batch_number: 'BATCH-2026-004', cycle_type: 'Hydrogen Peroxide Plasma', start_time: '2026-09-02 10:00:00', end_time: '2026-09-02 10:50:00', temperature: 50.0, pressure: 0.45, duration: 30, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'OR instruments', created_at: '2026-09-02T10:00:00', equipment_name: 'Hydrogen Peroxide Plasma Sterilizer', eq_code: 'EQ-003', operator_name: 'Sterilization Staff' },
    { id: 5, batch_number: 'BATCH-2026-005', cycle_type: 'Steam - Pre-Vacuum 134°C', start_time: '2026-09-03 08:00:00', end_time: '2026-09-03 08:45:00', temperature: 130.0, pressure: 29.0, duration: 3, chemical_indicator: 'FAIL', biological_indicator: 'PASS', result: 'FAIL', failure_reason: 'Temperature (130.0°C) below required minimum (132.0°C)', notes: 'Pressure drop detected', created_at: '2026-09-03T08:00:00', equipment_name: 'Steam Autoclave Unit 1 - Pre-Vacuum', eq_code: 'EQ-001', operator_name: 'Sterilization Staff' },
    { id: 6, batch_number: 'BATCH-2026-006', cycle_type: 'Steam - Gravity 121°C', start_time: '2026-09-04 08:00:00', end_time: '2026-09-04 08:30:00', temperature: 121.5, pressure: 15.2, duration: 20, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Routine', created_at: '2026-09-04T08:00:00', equipment_name: 'Steam Autoclave Unit 2 - Gravity', eq_code: 'EQ-002', operator_name: 'Sterilization Staff' },
    { id: 7, batch_number: 'BATCH-2026-007', cycle_type: 'Standard Wash', start_time: '2026-09-05 07:30:00', end_time: '2026-09-05 08:00:00', temperature: 93.0, pressure: 14.0, duration: 25, chemical_indicator: 'PASS', biological_indicator: null, result: 'PASS', failure_reason: null, notes: 'Washer-disinfector cycle', created_at: '2026-09-05T07:30:00', equipment_name: 'Surgical Instrument Washer-Disinfector', eq_code: 'EQ-005', operator_name: 'Sterilization Staff' },
    { id: 8, batch_number: 'BATCH-2026-008', cycle_type: 'Steam - Pre-Vacuum 134°C', start_time: '2026-09-06 08:00:00', end_time: '2026-09-06 08:45:00', temperature: 134.2, pressure: 30.1, duration: 4, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Normal', created_at: '2026-09-06T08:00:00', equipment_name: 'Steam Autoclave Unit 1 - Pre-Vacuum', eq_code: 'EQ-001', operator_name: 'Sterilization Staff' },
    { id: 9, batch_number: 'BATCH-2026-009', cycle_type: 'Hydrogen Peroxide Plasma', start_time: '2026-09-07 09:00:00', end_time: '2026-09-07 09:50:00', temperature: 50.5, pressure: 0.50, duration: 28, chemical_indicator: 'PASS', biological_indicator: 'PASS', result: 'PASS', failure_reason: null, notes: 'Ophthalmology instruments', created_at: '2026-09-07T09:00:00', equipment_name: 'Hydrogen Peroxide Plasma Sterilizer', eq_code: 'EQ-003', operator_name: 'Sterilization Staff' },
];

const seedMaintenanceRecords = [
    { id: 1, equipment_id: 1, technician_id: 3, maintenance_type: 'Preventive', service_date: '2026-06-01', description: 'Annual preventive maintenance — door gasket inspection, pressure check, calibration', parts_replaced: 'Door gasket', status: 'Completed', next_due_date: '2026-09-15', created_at: '2026-06-01T00:00:00', equipment_name: 'Steam Autoclave Unit 1 - Pre-Vacuum', eq_code: 'EQ-001', technician_name: 'Maintenance Tech' },
    { id: 2, equipment_id: 2, technician_id: 3, maintenance_type: 'Preventive', service_date: '2026-05-20', description: 'Semi-annual maintenance — temperature sensor calibration, drain valve check', parts_replaced: null, status: 'Completed', next_due_date: '2026-09-10', created_at: '2026-05-20T00:00:00', equipment_name: 'Steam Autoclave Unit 2 - Gravity', eq_code: 'EQ-002', technician_name: 'Maintenance Tech' },
    { id: 3, equipment_id: 4, technician_id: 3, maintenance_type: 'Corrective', service_date: '2026-07-10', description: 'EtO chamber seal replacement — unit taken offline for repair', parts_replaced: 'Chamber seals, O-rings', status: 'In Progress', next_due_date: '2026-08-01', created_at: '2026-07-10T00:00:00', equipment_name: 'Ethylene Oxide Chamber', eq_code: 'EQ-004', technician_name: 'Maintenance Tech' },
    { id: 4, equipment_id: 3, technician_id: 3, maintenance_type: 'Inspection', service_date: '2026-04-15', description: 'Quarterly inspection — plasma generator check, cycle log review', parts_replaced: null, status: 'Completed', next_due_date: '2026-10-01', created_at: '2026-04-15T00:00:00', equipment_name: 'Hydrogen Peroxide Plasma Sterilizer', eq_code: 'EQ-003', technician_name: 'Maintenance Tech' },
];

const seedNotifications = [
    { id: 1, user_id: null, title: 'Sterilization Cycle Failed', message: 'Cycle #5 on Steam Autoclave Unit 1 (EQ-001) FAILED. Temperature below minimum. Immediate review required.', type: 'critical', is_read: false, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 2, user_id: null, title: 'Maintenance Overdue', message: 'EtO Chamber (EQ-004) corrective maintenance is overdue. Immediate attention required.', type: 'critical', is_read: false, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 3, user_id: null, title: 'Equipment Added', message: 'Surgical Instrument Washer-Disinfector (EQ-005) has been successfully registered.', type: 'success', is_read: true, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 4, user_id: null, title: 'Maintenance Scheduled', message: 'Preventive maintenance scheduled for Steam Autoclave Unit 1. Next due: 2026-09-15.', type: 'warning', is_read: false, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 5, user_id: null, title: 'Cycle Completed Successfully', message: 'Cycle #8 on Steam Autoclave Unit 1 (EQ-001) completed with PASS result.', type: 'success', is_read: true, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
];

const seedAuditLogs = [
    { id: 1, action: 'System initialized and database configured', module: 'SYSTEM', record_id: null, previous_value: null, new_value: null, created_at: new Date(Date.now() - 30 * 86400000).toISOString(), user_name: 'System Admin', user_role: 'Admin' },
    { id: 2, action: 'Added equipment: Steam Autoclave Unit 1 - Pre-Vacuum (EQ-001)', module: 'EQUIPMENT', record_id: 1, previous_value: null, new_value: null, created_at: new Date(Date.now() - 25 * 86400000).toISOString(), user_name: 'System Admin', user_role: 'Admin' },
    { id: 3, action: 'Added equipment: Steam Autoclave Unit 2 - Gravity (EQ-002)', module: 'EQUIPMENT', record_id: 2, previous_value: null, new_value: null, created_at: new Date(Date.now() - 25 * 86400000).toISOString(), user_name: 'System Admin', user_role: 'Admin' },
    { id: 4, action: 'Recorded sterilization cycle #1 on Steam Autoclave Unit 1 (EQ-001) — Result: PASS', module: 'CYCLE', record_id: 1, previous_value: null, new_value: null, created_at: new Date(Date.now() - 6 * 86400000).toISOString(), user_name: 'Sterilization Staff', user_role: 'Sterilization Staff' },
    { id: 5, action: 'Recorded sterilization cycle #5 on Steam Autoclave Unit 1 (EQ-001) — Result: FAIL', module: 'CYCLE', record_id: 5, previous_value: null, new_value: null, created_at: new Date(Date.now() - 4 * 86400000).toISOString(), user_name: 'Sterilization Staff', user_role: 'Sterilization Staff' },
    { id: 6, action: 'Reviewed compliance report — overall 88.9%', module: 'COMPLIANCE', record_id: null, previous_value: null, new_value: null, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), user_name: 'System Admin', user_role: 'Admin' },
    { id: 7, action: 'Scheduled Corrective maintenance for equipment ID 4', module: 'MAINTENANCE', record_id: 3, previous_value: null, new_value: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString(), user_name: 'Maintenance Tech', user_role: 'Maintenance Staff' },
];

const seedCycleProfiles = [
    { id: 1, name: 'Steam - Pre-Vacuum 134°C', cycle_type: 'Steam', minimum_temperature: 132.00, maximum_temperature: 137.00, minimum_duration: 3, pressure_min: 28.00, pressure_max: 32.00, active: true },
    { id: 2, name: 'Steam - Gravity 121°C', cycle_type: 'Steam', minimum_temperature: 119.00, maximum_temperature: 124.00, minimum_duration: 15, pressure_min: 14.00, pressure_max: 16.00, active: true },
    { id: 3, name: 'Hydrogen Peroxide Plasma', cycle_type: 'Plasma', minimum_temperature: 45.00, maximum_temperature: 55.00, minimum_duration: 28, pressure_min: 0.30, pressure_max: 0.60, active: true },
    { id: 4, name: 'Ethylene Oxide (EtO)', cycle_type: 'EtO', minimum_temperature: 54.00, maximum_temperature: 60.00, minimum_duration: 60, pressure_min: 0.80, pressure_max: 1.20, active: true },
    { id: 5, name: 'Dry Heat - Rapid', cycle_type: 'Dry Heat', minimum_temperature: 168.00, maximum_temperature: 175.00, minimum_duration: 60, pressure_min: 0.00, pressure_max: 0.00, active: true },
];

const seedUsers = [
    { id: 1, name: 'System Admin', email: 'admin@hospital.com', role: 'Admin', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 2, name: 'Sterilization Staff', email: 'staff@hospital.com', role: 'Sterilization Staff', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 3, name: 'Maintenance Tech', email: 'maintenance@hospital.com', role: 'Maintenance Staff', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
];


const seedData = {
    equipment: seedEquipment,
    cycles: seedCycles,
    maintenanceRecords: seedMaintenanceRecords,
    notifications: seedNotifications,
    auditLogs: seedAuditLogs,
    cycleProfiles: seedCycleProfiles,
    users: seedUsers
};

let store;
if (fs.existsSync(dataFile)) {
    try {
        store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (e) {
        console.error('Failed to parse demoDataStore.json, falling back to seed');
        store = JSON.parse(JSON.stringify(seedData));
    }
} else {
    store = JSON.parse(JSON.stringify(seedData));
}

let saveTimeout;
const saveStore = () => {
    // Debounce save to prevent multiple writes
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
    }, 100);
};

// Create a proxy that intercepts push, pop, assignments, etc.
const createProxy = (arr) => {
    return new Proxy(arr, {
        set(target, property, value) {
            target[property] = value;
            saveStore();
            return true;
        },
        get(target, property) {
            const val = target[property];
            if (typeof val === 'function') {
                return function (...args) {
                    const result = val.apply(target, args);
                    if (['push', 'pop', 'splice', 'shift', 'unshift'].includes(property)) {
                        saveStore();
                    }
                    return result;
                }
            }
            return val;
        }
    });
};

module.exports = {
    equipment: createProxy(store.equipment),
    cycles: createProxy(store.cycles),
    maintenanceRecords: createProxy(store.maintenanceRecords),
    notifications: createProxy(store.notifications),
    auditLogs: createProxy(store.auditLogs),
    cycleProfiles: createProxy(store.cycleProfiles),
    users: createProxy(store.users)
};
