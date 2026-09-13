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

module.exports = { getIndicators };
