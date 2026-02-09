import SystemSettings from '../models/SystemSettings.js';

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public (Price needs to be visible)
const getSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const { scratchDesignPrice } = req.body;
        let settings = await SystemSettings.findOne();

        if (!settings) {
            settings = await SystemSettings.create({ scratchDesignPrice: 99 });
        }

        if (scratchDesignPrice !== undefined) settings.scratchDesignPrice = scratchDesignPrice;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update settings' });
    }
};

export { getSettings, updateSettings };
