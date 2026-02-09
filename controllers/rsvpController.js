import RSVP from '../models/RSVP.js';
import Invitation from '../models/Invitation.js';

// @desc    Submit RSVP for an invitation
// @route   POST /api/rsvps
// @access  Public
const submitRSVP = async (req, res) => {
    const { invitation: invitationId, name, email, phone, response, numberOfGuests, message } = req.body;

    // Find invitation by ID or slug
    let invitation;
    if (invitationId) {
        invitation = await Invitation.findById(invitationId);
    }

    if (!invitation || !invitation.isPaid) {
        res.status(404);
        throw new Error('Invitation not found or not yet active');
    }

    // Check for duplicate RSVP
    const existingRSVP = await RSVP.findOne({ invitation: invitation._id, email });
    if (existingRSVP) {
        // Update existing RSVP
        existingRSVP.name = name;
        existingRSVP.phone = phone;
        existingRSVP.response = response || 'attending';
        existingRSVP.numberOfGuests = numberOfGuests || 1;
        existingRSVP.message = message;
        await existingRSVP.save();
        return res.json({ message: 'RSVP updated', rsvp: existingRSVP });
    }

    const rsvp = await RSVP.create({
        invitation: invitation._id,
        name,
        email,
        phone,
        response: response || 'attending',
        numberOfGuests: numberOfGuests || 1,
        message,
    });

    // Update RSVP count on invitation
    await Invitation.findByIdAndUpdate(invitation._id, { $inc: { rsvpCount: 1 } });

    res.status(201).json(rsvp);
};

// @desc    Get RSVPs for an invitation (Owner only)
// @route   GET /api/rsvps/invitation/:invitationId
// @access  Private
const getRSVPsByInvitation = async (req, res) => {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access these RSVPs');
    }

    const rsvps = await RSVP.find({ invitation: invitation._id }).sort({ createdAt: -1 });

    res.json(rsvps);
};

// @desc    Export RSVPs as CSV (Owner only)
// @route   GET /api/rsvps/invitation/:invitationId/export
// @access  Private
const exportRSVPsCSV = async (req, res) => {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to export these RSVPs');
    }

    const rsvps = await RSVP.find({ invitation: invitation._id }).sort({ createdAt: -1 });

    // Generate CSV
    const csvHeader = 'Name,Email,Phone,Response,Guests,Message,Date\n';
    const csvRows = rsvps.map(r =>
        `"${r.name}","${r.email || ''}","${r.phone || ''}","${r.response}","${r.numberOfGuests}","${(r.message || '').replace(/"/g, '""')}","${r.createdAt.toISOString()}"`
    ).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rsvps-${invitation.slug}.csv`);
    res.send(csv);
};

export {
    submitRSVP,
    getRSVPsByInvitation,
    exportRSVPsCSV,
};
