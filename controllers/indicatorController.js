const Indicator = require('../models/Indicator');
const SterilizationCycle = require('../models/SterilizationCycle');

const getIndicators = async (req, res) => {
    try {
        const indicators = await Indicator.find().populate('cycle_id').lean();
        const formatted = indicators.map(i => ({ ...i, id: i._id }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addIndicator = async (req, res) => {
    try {
        const { type, result, cycle_id, notes } = req.body;
        const newInd = await Indicator.create({ type, result, cycle_id, notes, recorded_by: req.user.id });
        res.json({ success: true, id: newInd._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getIndicators, addIndicator };
