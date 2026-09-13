const TrayInventory = require('../models/TrayInventory');

const getInventory = async (req, res) => {
    try {
        const inventory = await TrayInventory.find().lean();
        res.json({ success: true, data: inventory.map(i => ({ ...i, id: i._id })) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getInventory };
