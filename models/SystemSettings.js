import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    scratchDesignPrice: {
        type: Number,
        default: 99,
        required: true,
    },
    // Future global settings can be added here
}, { timestamps: true });

// Ensure only one document exists
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ scratchDesignPrice: 99 });
    }
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
