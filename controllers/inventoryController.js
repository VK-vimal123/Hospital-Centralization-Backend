const db = require('../config/db');

// @desc    Get all available trays
// @route   GET /api/inventory/trays
// @access  Private
const getTrays = async (req, res) => {
    try {
        const { rows: trays } = await db.query('SELECT * FROM trays_inventory ORDER BY status ASC, created_at DESC');
        res.json(trays);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add a tray
// @route   POST /api/inventory/trays
// @access  Private
const addTray = async (req, res) => {
    try {
        const { barcode_id, name } = req.body;
        const { rows } = await db.query('INSERT INTO trays_inventory (barcode_id, name) VALUES ($1, $2) RETURNING id', [barcode_id, name]);
        res.status(201).json({ id: rows[0].id, message: 'Tray added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Scan and update tray status
// @route   PUT /api/inventory/trays/:barcode
// @access  Private
const updateTrayStatus = async (req, res) => {
    try {
        const { status, expiry_date } = req.body;
        await db.query('UPDATE trays_inventory SET status = $1, expiry_date = $2 WHERE barcode_id = $3', [status, expiry_date || null, req.params.barcode]);
        res.json({ message: 'Tray updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getTrays,
    addTray,
    updateTrayStatus
};
