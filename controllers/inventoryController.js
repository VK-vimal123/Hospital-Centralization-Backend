const TrayInventory = require('../models/TrayInventory');

const getTrays = async (req, res) => {
    try {
        const inventory = await TrayInventory.find().lean();
        res.json({ success: true, data: inventory.map(i => ({ ...i, id: i._id })) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addTray = async (req, res) => {
    try {
        const { barcode, name, status, location } = req.body;
        const newTray = await TrayInventory.create({ barcode, name, status, location });
        res.json({ success: true, id: newTray._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateTrayStatus = async (req, res) => {
    try {
        const { status, location } = req.body;
        await TrayInventory.findOneAndUpdate({ barcode: req.params.barcode }, { status, location });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getTrays, addTray, updateTrayStatus };
