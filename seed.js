import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Template from './models/Template.js';
import Invitation from './models/Invitation.js';

dotenv.config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@nileshblog.tech',
        password: 'Admin@123',
        role: 'admin',
    },
    {
        name: 'Customer User',
        email: 'customer@nileshblog.tech',
        password: 'Customer@123',
        role: 'customer',
    },
];

const categories = [
    {
        name: 'Wedding',
        slug: 'wedding',
        description: 'Beautiful wedding invitation templates for your special day',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        isPublished: true,
    },
    {
        name: 'Birthday',
        slug: 'birthday',
        description: 'Fun and colorful birthday party invitations',
        image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400',
        isPublished: true,
    },
    {
        name: 'Party',
        slug: 'party',
        description: 'General party and celebration invitations',
        image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
        isPublished: true,
    },
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Template.deleteMany({});
        await Invitation.deleteMany({});
        console.log('🗑️  Cleared existing data (Users, Categories, Templates, Invitations)');

        // Seed Users
        const hashedUsers = await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 10),
            }))
        );
        const createdUsers = await User.insertMany(hashedUsers);
        console.log('✅ Users seeded');

        // Seed Categories
        const createdCategories = await Category.insertMany(categories);
        console.log('✅ Categories seeded');

        // Helper to get category ID
        const getCatId = (slug) => createdCategories.find(c => c.slug === slug)?._id;

        // Seed Templates with NEW Design Schema
        const templates = [
            {
                name: 'Minimal Wedding',
                category: getCatId('wedding'),
                previewImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600',
                isPremium: false,
                price: 0,
                isActive: true,
                design: {
                    theme: {
                        colors: { primary: '#4f46e5', secondary: '#818cf8', background: '#ffffff', text: '#1f2937', textLight: '#6b7280', border: '#e5e7eb' },
                        fonts: { heading: 'Playfair Display', body: 'Inter', accent: 'Dancing Script' },
                        borderRadius: '0px',
                    },
                    blocks: [
                        { id: 'hero-1', type: 'hero', order: 0, settings: { height: '100vh', backgroundType: 'image', backgroundImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80', overlayEnabled: true, overlayOpacity: 0.4, overlayColor: '#000000', textAlign: 'center' }, content: { title: '{{eventName}}', subtitle: '{{hostName}}', showDate: true, showButton: true, buttonText: 'RSVP Now' } },
                        { id: 'msg-1', type: 'message', order: 1, settings: { padding: '4rem', textAlign: 'center' }, content: { title: 'You Are Invited', text: '{{message}}' } },
                        { id: 'details-1', type: 'eventDetails', order: 2, settings: { padding: '4rem', backgroundColor: '#f9fafb' }, content: { title: 'The Details', showDate: true, showTime: true, showVenue: true, layout: 'horizontal' } },
                        { id: 'rsvp-1', type: 'rsvp', order: 3, settings: { padding: '4rem' }, content: { title: 'Can You Make It?', subtitle: 'Please let us know by {{rsvpDeadline}}', buttonText: 'RSVP' } }
                    ]
                }
            },
            {
                name: 'Fun Birthday Bash',
                category: getCatId('birthday'),
                previewImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600',
                isPremium: true,
                price: 99,
                isActive: true,
                design: {
                    theme: {
                        colors: { primary: '#ec4899', secondary: '#f472b6', background: '#fff1f2', text: '#831843', textLight: '#be185d', border: '#fbcfe8' },
                        fonts: { heading: 'Montserrat', body: 'Poppins', accent: 'Pacifico' },
                        borderRadius: '1rem',
                    },
                    blocks: [
                        { id: 'hero-2', type: 'hero', order: 0, settings: { height: '80vh', backgroundType: 'solid', backgroundColor: '#fce7f3', textAlign: 'center' }, content: { title: '{{eventName}}', subtitle: 'Hosted by {{hostName}}', showDate: true, showButton: true, buttonText: 'Party Time!' } },
                        { id: 'count-1', type: 'countdown', order: 1, settings: { padding: '2rem', backgroundColor: '#ffffff' }, content: { title: 'Counting Down!' } },
                        { id: 'yt-1', type: 'youtube', order: 2, settings: { padding: '2rem' }, content: { title: 'A Special Message', videoUrl: 'https://youtube.com/shorts/xcJtL7QggTI' } },
                        { id: 'venue-1', type: 'venue', order: 3, settings: { padding: '0', height: '400px' }, content: { title: 'Location', showMap: true } }
                    ]
                }
            },
            {
                name: 'Elegant Royal Wedding',
                category: getCatId('wedding'),
                previewImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
                isPremium: true,
                price: 299,
                isActive: true,
                design: {
                    theme: {
                        colors: { primary: '#d4af37', secondary: '#f9f1dc', background: '#111827', text: '#f3f4f6', textLight: '#9ca3af', border: '#374151' },
                        fonts: { heading: 'Cinzel', body: 'Lora', accent: 'Great Vibes' },
                        borderRadius: '4px',
                    },
                    blocks: [
                        { id: 'fimg-1', type: 'fullImage', order: 0, settings: {}, content: { fitScreen: true, imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80', title: 'The Royal Wedding', objectFit: 'cover' } },
                        { id: 'msg-3', type: 'message', order: 1, settings: { padding: '4rem', backgroundType: 'solid', backgroundColor: '#111827', textAlign: 'center' }, content: { title: 'Join Us', text: 'We gracefully request the honor of your presence at our wedding.' } },
                        { id: 'gal-1', type: 'gallery', order: 2, settings: { padding: '2rem' }, content: { title: 'Our Moments', columns: 3, images: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc', 'https://images.unsplash.com/photo-1519741497674-611481863552', 'https://images.unsplash.com/photo-1606800052052-a08af7148866'] } },
                        { id: 'rsvp-2', type: 'rsvp', order: 3, settings: { padding: '4rem', backgroundType: 'solid', backgroundColor: '#1f2937' }, content: { title: 'Will you attend?', subtitle: 'Please bless us with your presence', buttonText: 'Accept Invitation' } }
                    ]
                }
            },
            {
                name: 'Corporate Summit',
                category: getCatId('party'),
                previewImage: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?w=600',
                isPremium: true,
                price: 149,
                isActive: true,
                design: {
                    theme: {
                        colors: { primary: '#2563eb', secondary: '#3b82f6', background: '#f8fafc', text: '#0f172a', textLight: '#475569', border: '#cbd5e1' },
                        fonts: { heading: 'Inter', body: 'Roboto', accent: 'Inter' },
                        borderRadius: '8px',
                    },
                    blocks: [
                        { id: 'hero-3', type: 'hero', order: 0, settings: { height: '80vh', backgroundType: 'image', backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80', overlayEnabled: true, overlayOpacity: 0.7, overlayColor: '#0f172a', textAlign: 'left' }, content: { title: '{{eventName}}', subtitle: 'Annual Leadership Summit', showDate: true, showButton: true, buttonText: 'Register Now' } },
                        { id: 'pdf-1', type: 'pdf', order: 1, settings: { padding: '2rem', backgroundType: 'solid', backgroundColor: '#ffffff' }, content: { title: 'Event Schedule & Agenda', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fitScreen: false, height: '600px', caption: 'Download or view the official schedule above.' } },
                        { id: 'details-3', type: 'eventDetails', order: 2, settings: { padding: '4rem', backgroundColor: '#f1f5f9' }, content: { title: 'Summit Information', showDate: true, showTime: true, showVenue: true, layout: 'vertical' } }
                    ]
                }
            }
        ];

        await Template.insertMany(templates);
        console.log('✅ Templates seeded (New Design Schema)');

        console.log('\n========================================');
        console.log('🎉 Database seeded successfully!');
        console.log('========================================');
        console.log('   Admin:    admin@nileshblog.tech / Admin@123');
        console.log('   Customer: customer@nileshblog.tech / Customer@123');
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
