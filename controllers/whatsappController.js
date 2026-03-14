import GuestList from '../models/GuestList.js';
import Invitation from '../models/Invitation.js';

// @desc    Get or create guest list for an invitation
// @route   GET /api/whatsapp/guests/:invitationId
// @access  Private
const getGuestList = async (req, res, next) => {
    try {
        let guestList = await GuestList.findOne({
            user: req.user._id,
            invitation: req.params.invitationId,
        });

        if (!guestList) {
            guestList = await GuestList.create({
                user: req.user._id,
                invitation: req.params.invitationId,
                guests: [],
            });
        }

        res.json(guestList);
    } catch (error) {
        next(error);
    }
};

// @desc    Save/update guest list
// @route   PUT /api/whatsapp/guests/:invitationId
// @access  Private
const saveGuestList = async (req, res, next) => {
    try {
        const { guests } = req.body;

        let guestList = await GuestList.findOne({
            user: req.user._id,
            invitation: req.params.invitationId,
        });

        if (!guestList) {
            guestList = await GuestList.create({
                user: req.user._id,
                invitation: req.params.invitationId,
                guests,
            });
        } else {
            guestList.guests = guests;
            await guestList.save();
        }

        res.json(guestList);
    } catch (error) {
        next(error);
    }
};

// @desc    Generate WhatsApp share links for all pending guests (FREE)
// @route   POST /api/whatsapp/blast/:invitationId
// @access  Private
const sendBlast = async (req, res, next) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);
        if (!invitation) {
            res.status(404);
            throw new Error('Invitation not found');
        }

        if (invitation.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized');
        }

        const guestList = await GuestList.findOne({
            user: req.user._id,
            invitation: req.params.invitationId,
        });

        if (!guestList || guestList.guests.length === 0) {
            res.status(400);
            throw new Error('No guests in the list');
        }

        const pendingGuests = guestList.guests.filter(g => g.status === 'pending');

        if (pendingGuests.length === 0) {
            res.status(400);
            throw new Error('All guests have already been contacted');
        }

        // Build WhatsApp Web URLs for each guest
        const inviteUrl = `${process.env.CLIENT_URL}/invite/${invitation.slug}`;
        const eventName = invitation.content?.eventName || 'our event';
        const whatsappLinks = [];

        for (const guest of guestList.guests) {
            if (guest.status !== 'pending') continue;

            // Format phone number (remove spaces, dashes, ensure country code)
            let phone = guest.phone.replace(/[\s\-()]/g, '');
            if (!phone.startsWith('+')) phone = '+91' + phone;

            const message = encodeURIComponent(
                `Hi ${guest.name}! 🎉\n\nYou're cordially invited to ${eventName}!\n\nView your invitation here:\n${inviteUrl}\n\nWe hope to see you there! 💐`
            );

            whatsappLinks.push({
                name: guest.name,
                phone: guest.phone,
                url: `https://wa.me/${phone.replace('+', '')}?text=${message}`,
            });

            guest.status = 'sent';
            guest.sentAt = new Date();
        }

        await guestList.save();

        res.json({
            success: true,
            message: `${whatsappLinks.length} WhatsApp links generated`,
            sentCount: whatsappLinks.length,
            whatsappLinks,
        });
    } catch (error) {
        next(error);
    }
};

export {
    getGuestList,
    saveGuestList,
    sendBlast,
};
