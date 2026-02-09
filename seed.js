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
                        colors: {
                            primary: '#4f46e5',
                            secondary: '#818cf8',
                            background: '#ffffff',
                            text: '#1f2937',
                            textLight: '#6b7280',
                            border: '#e5e7eb',
                        },
                        fonts: {
                            heading: 'Playfair Display',
                            body: 'Inter',
                            accent: 'Dancing Script',
                        },
                        borderRadius: '0px',
                    },
                    blocks: [
                        {
                            id: 'hero-1',
                            type: 'hero',
                            order: 0,
                            settings: {
                                height: '100vh',
                                backgroundType: 'image',
                                backgroundImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
                                overlayEnabled: true,
                                overlayOpacity: 0.4,
                                textAlign: 'center',
                            },
                            content: {
                                title: '{{eventName}}',
                                subtitle: '{{hostName}}',
                                showDate: true,
                                showButton: true,
                                buttonText: 'RSVP Now'
                            }
                        },
                        {
                            id: 'msg-1',
                            type: 'message',
                            order: 1,
                            settings: { padding: '4rem', textAlign: 'center' },
                            content: {
                                title: 'You Are Invited',
                                text: '{{message}}'
                            }
                        },
                        {
                            id: 'details-1',
                            type: 'eventDetails',
                            order: 2,
                            settings: { padding: '4rem', backgroundColor: '#f9fafb' },
                            content: {
                                title: 'The Details',
                                showDate: true,
                                showTime: true,
                                showVenue: true,
                                layout: 'horizontal'
                            }
                        },
                        {
                            id: 'rsvp-1',
                            type: 'rsvp',
                            order: 3,
                            settings: { padding: '4rem' },
                            content: {
                                title: 'Can You Make It?',
                                subtitle: 'Please let us know by {{rsvpDeadline}}',
                                buttonText: 'RSVP'
                            }
                        }
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
                        colors: {
                            primary: '#ec4899',
                            secondary: '#f472b6',
                            background: '#fff1f2',
                            text: '#831843',
                            textLight: '#be185d',
                            border: '#fbcfe8',
                        },
                        fonts: {
                            heading: 'Montserrat',
                            body: 'Poppins',
                            accent: 'Pacifico',
                        },
                        borderRadius: '1rem',
                    },
                    blocks: [
                        {
                            id: 'hero-2',
                            type: 'hero',
                            order: 0,
                            settings: {
                                height: '80vh',
                                backgroundType: 'gradient', // simple gradient simulation or default
                                backgroundColor: '#fce7f3',
                                textAlign: 'center',
                            },
                            content: {
                                title: '{{eventName}}', // e.g. "John's 30th Birthday"
                                subtitle: 'Hosted by {{hostName}}',
                                showDate: true,
                                showButton: true,
                                buttonText: 'Party Time!'
                            }
                        },
                        {
                            id: 'count-1',
                            type: 'countdown',
                            order: 1,
                            settings: { padding: '2rem', backgroundColor: '#ffffff' },
                            content: { title: 'Counting Down!' }
                        },
                        {
                            id: 'details-2',
                            type: 'eventDetails',
                            order: 2,
                            settings: { padding: '4rem' },
                            content: {
                                title: 'When & Where',
                                showDate: true,
                                showTime: true,
                                showVenue: true,
                                layout: 'vertical'
                            }
                        },
                        {
                            id: 'venue-1',
                            type: 'venue',
                            order: 3,
                            settings: { padding: '0', height: '400px' },
                            content: {
                                title: 'Location',
                                showMap: true
                            }
                        }
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
