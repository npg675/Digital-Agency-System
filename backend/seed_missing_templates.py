"""
Seed script: Eye-catching templates for missing industries and all Thank You Funnels.
Run with: python seed_missing_templates.py
"""
import sys
import os
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.template import Template, TemplateSection, TemplateCategory

TEMPLATES = [
    # ─────────────────────────────────────────────────────────────────────────
    # 1. REAL ESTATE LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Luxury Real Estate Agency",
        "category": TemplateCategory.REAL_ESTATE,
        "thumbnail_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Find the Home That Matches Your Ambition.",
                    "subtitle": "Exclusive access to off-market luxury properties, waterfront estates, and architectural masterpieces. We don't just sell homes; we curate lifestyles.",
                    "ctaText": "View Exclusive Listings",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.55,
                    "buttonColor": "#0f172a"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "A Different Caliber of Real Estate",
                    "subtitle": "Why high-net-worth individuals trust us with their most valuable assets.",
                    "features": [
                        {"icon": "🗝️", "title": "Off-Market Access", "description": "Over 40% of our luxury transactions happen privately, giving you access to homes nobody else even knows exist."},
                        {"icon": "📊", "title": "Data-Driven Appraisals", "description": "We leverage proprietary market data to ensure you never overpay and always maximize your return on investment."},
                        {"icon": "🤝", "title": "White-Glove Concierge", "description": "From interior designers to private movers, our concierge team handles every detail of your transition seamlessly."},
                        {"icon": "🌐", "title": "Global Network", "description": "Looking to buy internationally? We are partnered with elite brokerages in 45 countries to facilitate global acquisitions."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Recently Sold Masterpieces",
                    "subtitle": "A glimpse into our recent luxury transactions.",
                    "images": [
                        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Trusted by Visionaries",
                    "subtitle": "What our clients say about our discretion and results.",
                    "testimonials": [
                        {"name": "Arthur Pendelton", "role": "CEO, Horizon Capital", "content": "They secured our $12M waterfront estate entirely off-market. The negotiation was flawless, and their discretion was absolute.", "avatar": "https://i.pravatar.cc/150?img=11"},
                        {"name": "Elena Rostova", "role": "International Investor", "content": "I've worked with top agencies globally. None have matched the deep market intelligence and white-glove service I received here.", "avatar": "https://i.pravatar.cc/150?img=44"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Request a Private Consultation",
                    "subtitle": "Tell us what you're looking for, and one of our Senior Partners will reach out confidentially.",
                    "buttonText": "Submit Inquiry",
                    "backgroundColor": "#0f172a",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Property Preference (Buying / Selling / Investing)", "Budget Range"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 2. HOTEL LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Boutique Luxury Hotel",
        "category": TemplateCategory.HOTEL,
        "thumbnail_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "An Escape From the Ordinary.",
                    "subtitle": "Experience unparalleled luxury, breathtaking views, and intuitive service that anticipates your needs before you even ask.",
                    "ctaText": "Check Availability",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.45,
                    "buttonColor": "#c2410c"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Immerse Yourself in Elegance",
                    "subtitle": "Every detail has been intentionally designed for your ultimate comfort.",
                    "features": [
                        {"icon": "🛏️", "title": "Egyptian Cotton Linens", "description": "Drift into perfect sleep on our custom mattresses layered with 1000-thread-count Egyptian cotton."},
                        {"icon": "🍽️", "title": "Michelin-Star Dining", "description": "Our in-house restaurant, led by Chef Antoine, offers a sensory journey through locally sourced, world-class cuisine."},
                        {"icon": "💆", "title": "Award-Winning Spa", "description": "Melt away stress with our hydrotherapy circuits and bespoke massage treatments."},
                        {"icon": "🌊", "title": "Infinity Pool & Cabanas", "description": "Relax by our temperature-controlled infinity pool with sweeping panoramic views of the coast."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Discover Our Property",
                    "subtitle": "Where modern architecture meets natural beauty.",
                    "images": [
                        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1542314831-c6a4d14abace?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1551882547-ff40c0d12c56?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Secure Your Reservation",
                    "subtitle": "Book directly with us for the best rates, guaranteed room upgrades (when available), and complimentary breakfast.",
                    "buttonText": "Request Booking",
                    "backgroundColor": "#c2410c",
                    "fields": ["Full Name", "Email Address", "Check-in Date", "Check-out Date", "Number of Guests"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 3. TRAVEL LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Exotic Travel & Tour Agency",
        "category": TemplateCategory.TRAVEL,
        "thumbnail_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Stop Dreaming. Start Exploring.",
                    "subtitle": "We curate breathtaking, once-in-a-lifetime travel itineraries tailored perfectly to your tastes. You pack the bags, we handle the rest.",
                    "ctaText": "Plan My Adventure",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.60,
                    "buttonColor": "#059669"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Why Travel With Us?",
                    "subtitle": "We take the stress out of travel so you can focus entirely on the experience.",
                    "features": [
                        {"icon": "🗺️", "title": "Bespoke Itineraries", "description": "No cookie-cutter tours. Every trip is custom-designed based on your exact preferences and travel style."},
                        {"icon": "⭐", "title": "VIP Access & Perks", "description": "Skip the lines. Get exclusive access to hidden gems, private tours, and complimentary hotel room upgrades."},
                        {"icon": "🛡️", "title": "24/7 On-Trip Support", "description": "Flight cancelled? Lost luggage? Our support team is available around the clock to solve problems instantly."},
                        {"icon": "✈️", "title": "End-to-End Planning", "description": "Flights, transfers, hotels, dining reservations, and excursions—we coordinate every single detail flawlessly."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 2,
                "config": {
                    "title": "Memories That Last a Lifetime",
                    "subtitle": "Hear from our happy travelers.",
                    "testimonials": [
                        {"name": "Sarah & Mark", "role": "Honeymoon in Bali", "content": "Every detail was flawless. From the private villa upgrade to the sunset dinner cruise they secretly booked for us, it was pure magic.", "avatar": "https://i.pravatar.cc/150?img=32"},
                        {"name": "The Jensen Family", "role": "African Safari", "content": "Traveling with three kids is usually stressful. This agency made our Safari trip the easiest and most breathtaking family vacation ever.", "avatar": "https://i.pravatar.cc/150?img=60"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Where To Next?",
                    "subtitle": "Speak with a travel designer today and let's bring your dream trip to life.",
                    "buttonText": "Get a Free Quote",
                    "backgroundColor": "#059669",
                    "fields": ["Full Name", "Email Address", "Dream Destination", "Estimated Travel Dates", "Number of Travelers"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 4. ECOMMERCE LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Premium D2C Brand",
        "category": TemplateCategory.ECOMMERCE,
        "thumbnail_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Redefining Everyday Essentials.",
                    "subtitle": "Ethically sourced. Masterfully crafted. Unapologetically premium. Join 50,000+ customers who have upgraded their lifestyle.",
                    "ctaText": "Shop the Collection",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.50,
                    "buttonColor": "#000000"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Quality Without Compromise",
                    "subtitle": "Why our customers refuse to go back to ordinary brands.",
                    "features": [
                        {"icon": "🌱", "title": "100% Sustainable", "description": "Every product is made with ethically sourced, eco-friendly materials that look good and feel better."},
                        {"icon": "🛡️", "title": "Lifetime Warranty", "description": "We build things to last. If our product ever fails due to manufacturing defects, we replace it for free."},
                        {"icon": "🚚", "title": "Free Express Shipping", "description": "Fast, carbon-neutral shipping on all orders over $50, delivered straight to your door in 2-3 days."},
                        {"icon": "↩️", "title": "30-Day Free Returns", "description": "Try it at home. If you don't absolutely love it, send it back within 30 days for a full refund—no questions asked."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Our Best Sellers",
                    "subtitle": "The pieces everyone is talking about.",
                    "images": [
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Unlock 15% Off Your First Order",
                    "subtitle": "Join our VIP list for exclusive drops, early access, and a welcome discount sent instantly to your inbox.",
                    "buttonText": "Send My Discount",
                    "backgroundColor": "#000000",
                    "fields": ["First Name", "Email Address"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 5. CONSTRUCTION LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Commercial & Residential Builders",
        "category": TemplateCategory.CONSTRUCTION,
        "thumbnail_url": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "We Build Your Vision With Precision.",
                    "subtitle": "Award-winning commercial and luxury residential construction. On time. On budget. Built to outlast generations.",
                    "ctaText": "Get a Free Project Estimate",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.70,
                    "buttonColor": "#ea580c"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "A Foundation of Trust",
                    "stats": [
                        {"value": "150+", "label": "Projects Completed"},
                        {"value": "20 yrs", "label": "Industry Experience"},
                        {"value": "100%", "label": "Safety Record"},
                        {"value": "0", "label": "Missed Deadlines (2023)"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Why Partner With Us?",
                    "subtitle": "We don't just lay bricks; we engineer solutions.",
                    "features": [
                        {"icon": "🏗️", "title": "End-to-End Management", "description": "From architectural design and permitting to final finishing, we manage the entire lifecycle of your project."},
                        {"icon": "📐", "title": "Uncompromising Quality", "description": "We strictly use premium materials and top-tier subcontractors to ensure structural integrity and flawless aesthetics."},
                        {"icon": "⏱️", "title": "Guaranteed Timelines", "description": "Our transparent scheduling process means no surprise delays. We respect your time and capital."},
                        {"icon": "💲", "title": "Transparent Pricing", "description": "No hidden fees or sudden upcharges. Our estimating process is rigorous, detailed, and completely transparent."}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Let's Discuss Your Project",
                    "subtitle": "Provide a few details below and our lead engineer will reach out within 24 hours to schedule a site visit.",
                    "buttonText": "Request Estimate",
                    "backgroundColor": "#ea580c",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Project Type (Commercial / Residential)", "Estimated Budget", "Project Description"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 6. FINANCE LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Wealth Management & Planning",
        "category": TemplateCategory.FINANCE,
        "thumbnail_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Secure Your Future. Multiply Your Wealth.",
                    "subtitle": "Fiduciary financial planning and intelligent investment strategies tailored for high-net-worth individuals and ambitious professionals.",
                    "ctaText": "Book a Wealth Assessment",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.75,
                    "buttonColor": "#0f766e"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "A Holistic Approach to Wealth",
                    "subtitle": "We look at your entire financial picture to optimize tax, growth, and risk.",
                    "features": [
                        {"icon": "📈", "title": "Portfolio Management", "description": "Data-driven, risk-adjusted portfolios designed to maximize returns while protecting your downside in volatile markets."},
                        {"icon": "🛡️", "title": "Tax Optimization", "description": "Keep more of what you earn. We legally structure your assets to minimize tax liabilities and maximize net growth."},
                        {"icon": "👴", "title": "Retirement Planning", "description": "Clear roadmaps to ensure you can retire exactly when you want, with the lifestyle you've always envisioned."},
                        {"icon": "📜", "title": "Estate & Legacy", "description": "Secure your family's future with robust trusts, estate planning, and generational wealth transfer strategies."}
                    ]
                }
            },
            {
                "type": "Stats",
                "order": 2,
                "config": {
                    "title": "By The Numbers",
                    "stats": [
                        {"value": "$1.2B", "label": "Assets Under Management"},
                        {"value": "98%", "label": "Client Retention"},
                        {"value": "25+", "label": "Years in Business"},
                        {"value": "100%", "label": "Fiduciary Standard"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Schedule Your Free Portfolio Review",
                    "subtitle": "Get a second opinion on your investments. No obligations, just actionable fiduciary advice.",
                    "buttonText": "Schedule Review",
                    "backgroundColor": "#0f766e",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Primary Financial Goal"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 7. NGO LANDING PAGE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Global Impact Non-Profit",
        "category": TemplateCategory.NGO,
        "thumbnail_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Together, We Can Change the World.",
                    "subtitle": "We are fighting poverty, providing clean water, and building education centers in the most vulnerable communities on Earth. Your support makes it possible.",
                    "ctaText": "Make a Donation Today",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.65,
                    "buttonColor": "#0284c7"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Where Your Money Goes",
                    "subtitle": "We believe in radical transparency. 92% of all donations go directly to the field.",
                    "features": [
                        {"icon": "💧", "title": "Clean Water Initiatives", "description": "Building sustainable wells and filtration systems to eradicate waterborne diseases in remote villages."},
                        {"icon": "📚", "title": "Education Programs", "description": "Constructing schools, training teachers, and providing supplies to guarantee every child's right to learn."},
                        {"icon": "🏥", "title": "Medical Relief", "description": "Deploying mobile clinics and delivering essential medicines to regions devastated by natural disasters."},
                        {"icon": "🌾", "title": "Food Security", "description": "Teaching modern agricultural techniques to help communities achieve sustainable self-reliance."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Impact In Action",
                    "subtitle": "See the smiles your generosity creates.",
                    "images": [
                        "https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Join The Movement",
                    "subtitle": "Every dollar counts. Help us reach our goal of impacting 1 million lives this year.",
                    "buttonText": "Donate Now",
                    "backgroundColor": "#0284c7",
                    "fields": ["Full Name", "Email Address", "Donation Amount", "Message of Support (Optional)"]
                }
            }
        ]
    },
    # ─────────────────────────────────────────────────────────────────────────
    # THANK YOU FUNNELS (ASCENSION PATHS)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Thank You - Gym Trial Claimed",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Trial Claimed! Welcome to the Family. 💪",
                    "subtitle": "Your 7-day pass is active. Let's make sure you hit the ground running. Book your free 1-on-1 fitness assessment now to get your personalized blueprint.",
                    "ctaText": "Book Assessment Call",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#f97316"
                }
            }
        ]
    },
    {
        "name": "Thank You - Restaurant Reservation",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Reservation Confirmed. 🍷",
                    "subtitle": "We look forward to serving you. Make your evening even more special by pre-ordering our Chef's Tasting Menu at a 15% discount.",
                    "ctaText": "Upgrade to Tasting Menu",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#b45309"
                }
            }
        ]
    },
    {
        "name": "Thank You - Education Enrollment",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "You're In! Get Ready to Learn. 🚀",
                    "subtitle": "Your login details have been emailed. Step 2: Join our private Discord community to network with 15,000+ driven students right now.",
                    "ctaText": "Join the Discord Community",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#7c3aed"
                }
            }
        ]
    },
    {
        "name": "Thank You - Healthcare Appointment",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Appointment Requested. 🩺",
                    "subtitle": "Our team will confirm your time shortly. To save 15 minutes in the waiting room, please fill out your patient intake forms online right now.",
                    "ctaText": "Complete Intake Form",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#0891b2"
                }
            }
        ]
    },
    {
        "name": "Thank You - SaaS Trial Started",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Trial Activated! Let's Go. ⚡",
                    "subtitle": "Don't waste your trial figuring things out alone. Schedule a free 15-minute onboarding call with an expert to set up your workspace instantly.",
                    "ctaText": "Schedule Onboarding Call",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#2563eb"
                }
            }
        ]
    },
    {
        "name": "Thank You - Salon Booking",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "We Can't Wait to See You! ✨",
                    "subtitle": "Your pampering session is booked. Click below to read our pre-appointment preparation guide to ensure you get the absolute best results.",
                    "ctaText": "Read Preparation Guide",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#be185d"
                }
            }
        ]
    },
    {
        "name": "Thank You - Consulting Call Booked",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Strategy Call Confirmed. 📈",
                    "subtitle": "To ensure we don't waste a single minute on our call, please fill out this brief 2-minute pre-call questionnaire so I can analyze your business beforehand.",
                    "ctaText": "Complete Questionnaire",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#1d4ed8"
                }
            }
        ]
    },
    {
        "name": "Thank You - Auto Inquiry Sent",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Inquiry Received! 🚘",
                    "subtitle": "A consultant is pulling the keys right now. While you wait, want to see exactly what rate you qualify for? Apply for financing with zero impact to your credit score.",
                    "ctaText": "Check My Rate",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#dc2626"
                }
            }
        ]
    },
    {
        "name": "Thank You - Hotel Booking",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Pack Your Bags. See You Soon! 🌴",
                    "subtitle": "Your reservation is officially confirmed. Want to arrive in style? Book an airport transfer or upgrade to a suite at an exclusive post-booking rate.",
                    "ctaText": "View Upgrade Options",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#c2410c"
                }
            }
        ]
    },
    {
        "name": "Thank You - Travel Itinerary",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Your Itinerary is in Your Inbox. ✈️",
                    "subtitle": "Ready to stop dreaming and start packing? Jump on a quick 10-minute call with our travel designers to customize this trip for your exact dates.",
                    "ctaText": "Speak to a Travel Agent",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#059669"
                }
            }
        ]
    },
    {
        "name": "Thank You - Ecommerce Order",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Order Confirmed! Thank You. 🛍️",
                    "subtitle": "We're packing your order right now. As a special thank you, here is a 15% discount code valid for the next 24 hours on your next purchase: THANKYOU15",
                    "ctaText": "Continue Shopping",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#000000"
                }
            }
        ]
    },
    {
        "name": "Thank You - Construction Quote",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1541888086925-0c13d3c10a17?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Quote Request Received. 🏗️",
                    "subtitle": "Our estimators are reviewing your details. While we crunch the numbers, take a look at our recent projects portfolio to see our quality of work.",
                    "ctaText": "View Our Portfolio",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1541888086925-0c13d3c10a17?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#ea580c"
                }
            }
        ]
    },
    {
        "name": "Thank You - Finance Consultation",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Review Scheduled. 💼",
                    "subtitle": "We're looking forward to speaking. To get the most accurate advice on our call, please download and complete our 1-page financial snapshot document.",
                    "ctaText": "Download Snapshot Doc",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#0f766e"
                }
            }
        ]
    },
    {
        "name": "Thank You - NGO Donation",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "You Are A Hero. Thank You! ❤️",
                    "subtitle": "Your generous donation is already making a difference. Help us multiply your impact by sharing our campaign with your friends and family.",
                    "ctaText": "Share on Social Media",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#0284c7"
                }
            }
        ]
    }
]

def seed_all_templates():
    db: Session = SessionLocal()
    seeded = 0
    skipped = 0
    try:
        for tpl_data in TEMPLATES:
            existing = db.query(Template).filter(Template.name == tpl_data["name"]).first()
            if existing:
                print(f"  [SKIP] Already exists: {tpl_data['name']}")
                skipped += 1
                continue

            template = Template(
                id=uuid.uuid4(),
                name=tpl_data["name"],
                category=tpl_data["category"],
                thumbnail_url=tpl_data["thumbnail_url"]
            )
            db.add(template)
            db.flush()  # get template.id

            for sec in tpl_data["sections"]:
                db.add(TemplateSection(
                    id=uuid.uuid4(),
                    template_id=template.id,
                    type=sec["type"],
                    config=sec["config"],
                    order=sec["order"]
                ))

            print(f"  [OK] Seeded: {tpl_data['name']} ({tpl_data['category'].value})")
            seeded += 1

        db.commit()
        print(f"\\nDone! Seeded {seeded} new templates. Skipped {skipped} existing.")
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("[*] Seeding missing templates...\\n")
    seed_all_templates()
