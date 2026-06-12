"""
Seed script: Eye-catching templates for 8 different industries.
Run with: python seed_templates_v2.py
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
    # 1. GYM & FITNESS
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Elite Gym & Fitness Studio",
        "category": TemplateCategory.GYM,
        "thumbnail_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Transform Your Body. Elevate Your Life.",
                    "subtitle": "Join 2,000+ members who achieved their dream physique with our expert trainers, premium equipment, and science-backed programs.",
                    "ctaText": "Start Your Free 7-Day Trial",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.65,
                    "buttonColor": "#f97316"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "Our Results Speak for Themselves",
                    "stats": [
                        {"value": "2,400+", "label": "Active Members"},
                        {"value": "98%", "label": "Satisfaction Rate"},
                        {"value": "40+", "label": "Expert Trainers"},
                        {"value": "12+", "label": "Years in Business"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Everything You Need to Crush Your Goals",
                    "subtitle": "World-class facilities designed for every fitness level — from beginner to elite athlete.",
                    "features": [
                        {"icon": "🏋️", "title": "State-of-the-Art Equipment", "description": "12,000 sq ft of premium machines, free weights, and functional training zones updated annually."},
                        {"icon": "🧠", "title": "Certified Expert Trainers", "description": "Our NASM & ACE-certified coaches build fully personalized programs based on your body and goals."},
                        {"icon": "🥗", "title": "Nutrition Coaching", "description": "Complement your training with custom meal plans from our registered dietitians."},
                        {"icon": "🔥", "title": "Group Classes Daily", "description": "50+ weekly classes: HIIT, Yoga, Spin, CrossFit, Boxing, and more. Something for everyone."},
                        {"icon": "📱", "title": "Members-Only App", "description": "Track workouts, book classes, chat with your trainer, and monitor progress from your pocket."},
                        {"icon": "♾️", "title": "No Contract Required", "description": "Month-to-month plans with no hidden fees. We earn your loyalty every single day."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Real People. Real Transformations.",
                    "subtitle": "Don't take our word for it — see what our members are saying.",
                    "testimonials": [
                        {"name": "Priya Sharma", "role": "Lost 22kg in 6 months", "content": "I tried every gym in the city and nothing worked until I joined here. The coaches are genuinely invested in your success. Best decision I ever made!", "avatar": "https://i.pravatar.cc/150?img=5"},
                        {"name": "Jason Cole", "role": "Marathon Runner", "content": "The strength & conditioning program took my marathon time from 4:30 to 3:45. The science behind the training here is next-level.", "avatar": "https://i.pravatar.cc/150?img=12"},
                        {"name": "Maria Lopez", "role": "Working Mom of 3", "content": "The flexible class schedule and childcare service was a game-changer. I finally have a fitness routine I can stick to!", "avatar": "https://i.pravatar.cc/150?img=47"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Claim Your Free Trial Today",
                    "subtitle": "No commitment. No credit card. Just results. A trainer will call you within 24 hours to schedule your first session.",
                    "buttonText": "Get My Free Trial",
                    "backgroundColor": "#f97316",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Your Primary Goal (Weight Loss / Muscle Gain / Endurance)"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 2. RESTAURANT
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Premium Restaurant & Dining",
        "category": TemplateCategory.RESTAURANT,
        "thumbnail_url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Where Every Bite Tells a Story",
                    "subtitle": "An unforgettable dining experience crafted from locally-sourced ingredients, award-winning chefs, and a passion for flavour that transcends the ordinary.",
                    "ctaText": "Reserve Your Table",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.55,
                    "buttonColor": "#b45309"
                }
            },
            {
                "type": "About",
                "order": 1,
                "config": {
                    "title": "Crafted with Passion Since 2009",
                    "description": "Born from a love of authentic flavours and a belief that great food brings people together, our restaurant has been a cornerstone of the local dining scene for over 15 years.\n\nHead Chef Marco Rosetti trained in Michelin-starred kitchens across Europe before bringing his mastery home. Every dish on our menu is a tribute to seasonal ingredients and timeless technique.",
                    "image": "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80",
                    "imagePosition": "right"
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "A Feast for the Eyes",
                    "subtitle": "Our dishes are as beautiful as they are delicious.",
                    "images": [
                        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Stats",
                "order": 3,
                "config": {
                    "title": "15 Years of Excellence",
                    "stats": [
                        {"value": "4.9★", "label": "Average Rating"},
                        {"value": "150K+", "label": "Happy Guests"},
                        {"value": "3", "label": "Industry Awards"},
                        {"value": "100%", "label": "Locally Sourced"}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 4,
                "config": {
                    "title": "What Our Guests Are Saying",
                    "subtitle": "From date nights to corporate dinners — every occasion deserves the best.",
                    "testimonials": [
                        {"name": "Emma & David R.", "role": "Anniversary Dinner Guests", "content": "The truffle risotto was the best dish I have ever had in my life. The ambiance, the service, the wine pairing — perfection. We'll be back every anniversary.", "avatar": "https://i.pravatar.cc/150?img=25"},
                        {"name": "Thomas K.", "role": "Food Blogger, @ForkAndStory", "content": "A hidden gem that punches well above its weight. The tasting menu is an absolute must. Chef Marco is a genius.", "avatar": "https://i.pravatar.cc/150?img=33"},
                        {"name": "Sunita Patel", "role": "Corporate Event Planner", "content": "We hosted our annual client dinner here for 40 guests. Flawless execution from the team. Every single guest complimented the food and service.", "avatar": "https://i.pravatar.cc/150?img=60"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 5,
                "config": {
                    "title": "Make a Reservation",
                    "subtitle": "Secure your table for an unforgettable evening. We are open Tuesday–Sunday, 12pm–11pm.",
                    "buttonText": "Reserve Now",
                    "backgroundColor": "#b45309",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Date & Time", "Number of Guests", "Special Occasions or Dietary Requirements"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 3. EDUCATION / ONLINE COURSE
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Online Course & Academy",
        "category": TemplateCategory.EDUCATION,
        "thumbnail_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Master High-Income Skills. Work From Anywhere.",
                    "subtitle": "Join 15,000+ students who levelled up their career with our industry-leading courses taught by world-class experts. 100% online. Lifetime access.",
                    "ctaText": "Explore Courses — Free for 14 Days",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.70,
                    "buttonColor": "#7c3aed"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "",
                    "stats": [
                        {"value": "15,000+", "label": "Students Enrolled"},
                        {"value": "200+", "label": "Hours of Content"},
                        {"value": "94%", "label": "Completion Rate"},
                        {"value": "4.8★", "label": "Average Course Rating"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Everything You Need to Succeed",
                    "subtitle": "We didn't just build courses — we built a full career acceleration ecosystem.",
                    "features": [
                        {"icon": "🎥", "title": "HD Video Lessons", "description": "200+ professionally recorded lessons you can watch at your own pace, on any device, forever."},
                        {"icon": "🏆", "title": "Industry-Recognised Certificate", "description": "Earn a verifiable certificate upon completion that employers and clients actually recognise and value."},
                        {"icon": "👥", "title": "Private Student Community", "description": "Connect with 15,000+ driven learners in our exclusive Discord community. Network, collaborate, grow."},
                        {"icon": "🤝", "title": "Live Q&A Sessions", "description": "Monthly live coaching calls where you can ask the instructor anything and get real-time guidance."},
                        {"icon": "📋", "title": "Project-Based Learning", "description": "Build a real portfolio of work as you learn. By graduation, you'll have tangible results to show."},
                        {"icon": "💼", "title": "Career Placement Support", "description": "Resume reviews, mock interviews, and job board access to land your next role or first client."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Students Who Changed Their Lives",
                    "subtitle": "Their stories could be yours.",
                    "testimonials": [
                        {"name": "Aisha Mohammed", "role": "Now earning $8K/month as a freelancer", "content": "I went from a $30K salary job I hated to freelancing full-time within 5 months of completing the course. The ROI is insane.", "avatar": "https://i.pravatar.cc/150?img=9"},
                        {"name": "Chris Tan", "role": "Promoted to Senior Developer", "content": "The depth of the curriculum is staggering. I learned more in 3 months here than in 2 years of university. Got promoted within weeks of finishing.", "avatar": "https://i.pravatar.cc/150?img=15"},
                        {"name": "Fatima Al-Hassan", "role": "Launched her own agency", "content": "Using the skills from this course, I started my own digital marketing agency. We hit $50K in revenue in our first 6 months. Unbelievable.", "avatar": "https://i.pravatar.cc/150?img=56"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Start Your Free Trial Today",
                    "subtitle": "Get full access to all courses for 14 days. No credit card required. Cancel anytime.",
                    "buttonText": "Create My Free Account",
                    "backgroundColor": "#7c3aed",
                    "fields": ["Full Name", "Email Address", "Which skill are you most interested in learning?"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 4. HEALTHCARE / CLINIC
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Modern Healthcare Clinic",
        "category": TemplateCategory.HEALTHCARE,
        "thumbnail_url": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Compassionate Care. Outstanding Outcomes.",
                    "subtitle": "Our team of board-certified specialists combines cutting-edge medical technology with a patient-first approach to deliver healthcare that genuinely changes lives.",
                    "ctaText": "Book Your Appointment",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.60,
                    "buttonColor": "#0891b2"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Why Patients Choose Us",
                    "subtitle": "We deliver care that goes far beyond a standard clinic visit.",
                    "features": [
                        {"icon": "🩺", "title": "Board-Certified Specialists", "description": "All our physicians hold board certifications and 10+ years of clinical experience in their respective fields."},
                        {"icon": "⚡", "title": "Same-Day Appointments", "description": "We know your health can't wait. Book online and often see a doctor the very same day."},
                        {"icon": "🔬", "title": "Advanced Diagnostics In-House", "description": "Lab work, imaging, and specialist consultations — all under one roof to eliminate long waits."},
                        {"icon": "💻", "title": "Telehealth Available", "description": "See a doctor from the comfort of your home via secure video consultation. Available 7 days a week."},
                        {"icon": "📋", "title": "Comprehensive Care Plans", "description": "We don't just treat symptoms — we build holistic, personalised health plans focused on long-term wellness."},
                        {"icon": "🔒", "title": "100% Private & Confidential", "description": "Your health information is fully protected under HIPAA guidelines with enterprise-grade data security."}
                    ]
                }
            },
            {
                "type": "Stats",
                "order": 2,
                "config": {
                    "title": "Trusted by Thousands in Our Community",
                    "stats": [
                        {"value": "25,000+", "label": "Patients Served"},
                        {"value": "4.9★", "label": "Patient Rating"},
                        {"value": "15+", "label": "Specialist Doctors"},
                        {"value": "20 min", "label": "Avg. Wait Time"}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Our Patients' Words Mean Everything",
                    "subtitle": "Real experiences from real patients.",
                    "testimonials": [
                        {"name": "Robert Martinez", "role": "Patient since 2019", "content": "After years of misdiagnoses at other clinics, Dr. Patel finally identified my condition and built a treatment plan that gave me my life back. I am eternally grateful.", "avatar": "https://i.pravatar.cc/150?img=52"},
                        {"name": "Linda Zhou", "role": "Telehealth Patient", "content": "The virtual consultation feature is a lifesaver for a busy parent like me. High quality care delivered with such warmth and professionalism.", "avatar": "https://i.pravatar.cc/150?img=41"},
                        {"name": "David Okafor", "role": "Annual Health Plan Member", "content": "The preventive care program here literally saved my life. My doctor caught something early that would have been catastrophic if left unchecked.", "avatar": "https://i.pravatar.cc/150?img=18"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Book Your Appointment",
                    "subtitle": "Same-day appointments available. Our care team will confirm within 2 hours.",
                    "buttonText": "Schedule Now",
                    "backgroundColor": "#0891b2",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Reason for Visit", "Preferred Date & Time", "Do you have insurance? (Yes / No)"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 5. SOFTWARE / SAAS
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "SaaS Product Launch",
        "category": TemplateCategory.SOFTWARE,
        "thumbnail_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "The Smartest Way to Run Your Business.",
                    "subtitle": "Automate repetitive tasks, unify your team's data, and make smarter decisions — all from one beautifully simple dashboard. Trusted by 8,000+ teams worldwide.",
                    "ctaText": "Start Free — No Credit Card Needed",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.75,
                    "buttonColor": "#2563eb"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "",
                    "stats": [
                        {"value": "8,000+", "label": "Businesses Trust Us"},
                        {"value": "40%", "label": "Avg. Time Saved"},
                        {"value": "99.9%", "label": "Uptime Guaranteed"},
                        {"value": "< 2min", "label": "Setup Time"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "One Platform. Every Tool You Need.",
                    "subtitle": "Stop duct-taping 10 different apps together. We bring everything into one seamless workflow.",
                    "features": [
                        {"icon": "⚡", "title": "No-Code Automation", "description": "Build powerful multi-step workflows in minutes with our drag-and-drop automation builder. No developers needed."},
                        {"icon": "📊", "title": "Real-Time Analytics", "description": "Crystal-clear dashboards that surface the insights that actually matter, updated in real time."},
                        {"icon": "🔗", "title": "100+ Integrations", "description": "Connect with Slack, Salesforce, HubSpot, Stripe, Zapier, and 100+ other tools you already use."},
                        {"icon": "🛡️", "title": "Enterprise-Grade Security", "description": "SOC 2 Type II certified. End-to-end encryption, SSO, and granular role-based permissions."},
                        {"icon": "🤝", "title": "Team Collaboration", "description": "Shared workspaces, real-time commenting, and task assignments keep your whole team perfectly aligned."},
                        {"icon": "📞", "title": "24/7 Human Support", "description": "When you need help, a real human answers. Not a bot. Average response time under 4 minutes."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Loved by Teams of Every Size",
                    "subtitle": "From solo founders to Fortune 500 teams.",
                    "testimonials": [
                        {"name": "Sarah K., Head of Ops", "role": "150-person SaaS Company", "content": "We replaced 7 different tools with this platform and cut our operational costs by 35%. The ROI is undeniable. We onboarded our entire team in a single afternoon.", "avatar": "https://i.pravatar.cc/150?img=44"},
                        {"name": "James O., Founder", "role": "Series A Startup", "content": "The automation features alone saved us from hiring 2 additional operations staff. This product has become the backbone of how we run our business.", "avatar": "https://i.pravatar.cc/150?img=23"},
                        {"name": "Ying C., COO", "role": "E-commerce Brand, $30M ARR", "content": "The real-time analytics changed how we make decisions. We moved from monthly reports to daily insights. It's a genuinely transformative tool.", "avatar": "https://i.pravatar.cc/150?img=30"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Start Your Free Trial",
                    "subtitle": "14 days free. Full access. No credit card. Set up in under 2 minutes.",
                    "buttonText": "Get Started Free",
                    "backgroundColor": "#2563eb",
                    "fields": ["Full Name", "Work Email", "Company Name", "Team Size"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 6. BEAUTY & SALON
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Luxury Beauty Salon & Spa",
        "category": TemplateCategory.BEAUTY,
        "thumbnail_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Indulge in Beauty. Rediscover Yourself.",
                    "subtitle": "A sanctuary of luxury beauty treatments, expert styling, and restorative spa experiences. Because you deserve to feel extraordinary.",
                    "ctaText": "Book Your Appointment",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.50,
                    "buttonColor": "#be185d"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Our Signature Services",
                    "subtitle": "Premium treatments delivered by master stylists using only the finest luxury products.",
                    "features": [
                        {"icon": "💇", "title": "Hair Styling & Colour", "description": "From precision cuts to balayage and keratin treatments — our master stylists transform your look with artistry and care."},
                        {"icon": "💆", "title": "Facial & Skin Treatments", "description": "Customised facials, chemical peels, and microdermabrasion designed to restore your skin's natural radiance."},
                        {"icon": "💅", "title": "Nail Art & Manicure", "description": "Gel, acrylic, and nail art by our certified nail technicians using only non-toxic, premium products."},
                        {"icon": "🧖", "title": "Relaxation Massage", "description": "Swedish, deep tissue, hot stone, and aromatherapy massages tailored to melt away your stress."},
                        {"icon": "👰", "title": "Bridal Packages", "description": "Complete bridal beauty packages including trial sessions, hair, makeup, and spa treatments for your perfect day."},
                        {"icon": "✨", "title": "Premium Product Range", "description": "We exclusively use Kerastase, Olaplex, and La Mer — brands that protect and nourish while they beautify."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Our Work Speaks for Itself",
                    "subtitle": "A look inside our world of luxury beauty.",
                    "images": [
                        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Glowing Reviews from Our Clients",
                    "subtitle": "Join hundreds of clients who make us their beauty home.",
                    "testimonials": [
                        {"name": "Zara Ahmad", "role": "Loyal Client for 3 Years", "content": "Walking in here is like stepping into a different world. The ambiance, the service, the results — everything is 10/10. My hair has never looked or felt this good.", "avatar": "https://i.pravatar.cc/150?img=54"},
                        {"name": "Olivia Freeman", "role": "Bride of 2023", "content": "They made me feel like an absolute queen on my wedding day. The bridal package was perfect — I cried happy tears when I saw myself in the mirror.", "avatar": "https://i.pravatar.cc/150?img=49"},
                        {"name": "Neha Gupta", "role": "Monthly Member", "content": "My monthly facial here has transformed my skin completely. I have never received so many compliments in my life. Worth every single penny.", "avatar": "https://i.pravatar.cc/150?img=63"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Book Your Luxury Experience",
                    "subtitle": "Slots fill up fast. Reserve yours today and receive a complimentary scalp massage with your first visit.",
                    "buttonText": "Book My Appointment",
                    "backgroundColor": "#be185d",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Service of Interest", "Preferred Date & Time"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 7. CONSULTING / PROFESSIONAL SERVICES
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Business Consulting Firm",
        "category": TemplateCategory.CONSULTING,
        "thumbnail_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Strategic Thinking That Drives Real Growth.",
                    "subtitle": "We partner with ambitious companies to solve their hardest problems, capture new opportunities, and build organisations that outperform. Results guaranteed.",
                    "ctaText": "Schedule a Strategy Call",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.70,
                    "buttonColor": "#1d4ed8"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "The Numbers Behind Our Reputation",
                    "stats": [
                        {"value": "$2.4B+", "label": "Client Revenue Generated"},
                        {"value": "320+", "label": "Engagements Completed"},
                        {"value": "18", "label": "Industries Served"},
                        {"value": "94%", "label": "Client Retention Rate"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Our Consulting Practices",
                    "subtitle": "End-to-end strategic support that addresses your most critical challenges.",
                    "features": [
                        {"icon": "📈", "title": "Growth Strategy", "description": "We identify your highest-leverage growth levers and build a roadmap to accelerate revenue — sustainably."},
                        {"icon": "⚙️", "title": "Operational Excellence", "description": "We streamline your operations to eliminate waste, reduce costs, and unlock the capacity to scale."},
                        {"icon": "🌐", "title": "Market Expansion", "description": "Enter new markets with confidence. Our market intelligence and go-to-market strategies de-risk expansion."},
                        {"icon": "🔄", "title": "Digital Transformation", "description": "We guide leadership through technology adoption, cultural change, and the systems that make it stick."},
                        {"icon": "🤝", "title": "M&A Advisory", "description": "Expert guidance on acquisitions, due diligence, integration planning, and post-merger value creation."},
                        {"icon": "📋", "title": "Organisational Design", "description": "Structure your teams and leadership for maximum performance at every stage of your growth journey."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Trusted by Industry Leaders",
                    "subtitle": "See how we've delivered measurable transformation for our clients.",
                    "testimonials": [
                        {"name": "Marcus Reid", "role": "CEO, TechVentures Inc.", "content": "They didn't just give us a strategy document — they rolled up their sleeves and helped us execute. Revenue grew 140% in 18 months. Exceptional team.", "avatar": "https://i.pravatar.cc/150?img=11"},
                        {"name": "Amara Osei", "role": "COO, AfriTrade Group", "content": "The market expansion strategy they built took us into 3 new countries within a year. Their on-the-ground insights were invaluable. Highly recommend.", "avatar": "https://i.pravatar.cc/150?img=58"},
                        {"name": "Jonathan Park", "role": "Founder, HealthPlus Clinics", "content": "The operational overhaul they led reduced our patient wait times by 60% and improved our net promoter score to 92. Transformational work.", "avatar": "https://i.pravatar.cc/150?img=36"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Let's Discuss Your Challenges",
                    "subtitle": "Book a complimentary 45-minute strategy call. No obligation — just a frank conversation about your goals and how we can help.",
                    "buttonText": "Book My Free Strategy Call",
                    "backgroundColor": "#1d4ed8",
                    "fields": ["Full Name", "Email Address", "Company Name & Role", "Company Annual Revenue", "Your Biggest Current Challenge"]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 8. AUTOMOTIVE / CAR DEALERSHIP
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Premium Car Dealership",
        "category": TemplateCategory.AUTOMOTIVE,
        "thumbnail_url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Drive the Car You've Always Deserved.",
                    "subtitle": "500+ premium vehicles. Transparent pricing. Zero-pressure consultants. We make finding your perfect car an experience you'll never forget.",
                    "ctaText": "Browse Our Inventory",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80",
                    "overlayOpacity": 0.60,
                    "buttonColor": "#dc2626"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "The Smarter Way to Buy Your Next Car",
                    "subtitle": "We've reinvented the car buying experience from the ground up.",
                    "features": [
                        {"icon": "🚗", "title": "500+ Vehicles In Stock", "description": "New, certified pre-owned, and luxury vehicles across every budget. Updated daily with new arrivals."},
                        {"icon": "💰", "title": "Best Price Guarantee", "description": "We price every vehicle transparently. Find the same car cheaper within 7 days and we'll beat it — period."},
                        {"icon": "🔍", "title": "140-Point Inspection", "description": "Every used vehicle undergoes a rigorous 140-point inspection and comes with a full vehicle history report."},
                        {"icon": "💳", "title": "Easy Finance Approval", "description": "Same-day finance approval from our network of 20+ lenders, including options for first-time buyers."},
                        {"icon": "🏠", "title": "Home Delivery Available", "description": "We'll deliver your new vehicle directly to your door, anywhere within 100km, completely free of charge."},
                        {"icon": "🔄", "title": "Hassle-Free Trade-Ins", "description": "Get a fair, instant online valuation for your current car. We accept all makes and models."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Vehicles That Turn Heads",
                    "subtitle": "A glimpse of what's available in our showroom today.",
                    "images": [
                        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"
                    ]
                }
            },
            {
                "type": "Stats",
                "order": 3,
                "config": {
                    "title": "Why We're the Region's #1 Dealership",
                    "stats": [
                        {"value": "500+", "label": "Vehicles In Stock"},
                        {"value": "18,000+", "label": "Happy Customers"},
                        {"value": "4.9★", "label": "Google Rating"},
                        {"value": "25 yrs", "label": "In Business"}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 4,
                "config": {
                    "title": "Our Customers Love Their Experience",
                    "subtitle": "Over 18,000 happy customers and counting.",
                    "testimonials": [
                        {"name": "Raj Patel", "role": "Purchased BMW 5 Series", "content": "I walked in just to browse and left with my dream car at a price I couldn't believe. The team was transparent, knowledgeable, and zero pressure. 10/10.", "avatar": "https://i.pravatar.cc/150?img=17"},
                        {"name": "Karen Williams", "role": "First-Time Car Buyer", "content": "As a first-time buyer I was terrified. They walked me through everything patiently, helped me find a car in my budget, and the finance was approved in under an hour. Amazing.", "avatar": "https://i.pravatar.cc/150?img=50"},
                        {"name": "Ahmed Khalil", "role": "Traded in his Mercedes", "content": "Got a genuinely fair price on my trade-in and found an incredible replacement. The home delivery service is a fantastic touch. Will be back for my next car for sure.", "avatar": "https://i.pravatar.cc/150?img=39"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 5,
                "config": {
                    "title": "Find Your Perfect Vehicle",
                    "subtitle": "Tell us what you're looking for and a consultant will reach out within 30 minutes with matching vehicles.",
                    "buttonText": "Find My Car",
                    "backgroundColor": "#dc2626",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Vehicle Type (Sedan / SUV / Truck / Luxury)", "Budget Range", "New or Used?"]
                }
            }
        ]
    },
    # ─────────────────────────────────────────────────────────────────────────
    # 9. REAL ESTATE THANK YOU (Lead Magnet / Valuation)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Thank You - Real Estate Valuation Guide",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Your Home Valuation Guide is on the way! 🏡",
                    "subtitle": "We've emailed a copy to you. In the meantime, see the next steps to maximize your home value.",
                    "hideButton": True,
                    "hideBackground": True
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "What's Inside the Guide",
                    "subtitle": "A sneak peek of the chapters inside your free copy:",
                    "features": [
                        {"icon": "🔨", "title": "Simple DIY Repairs", "description": "Quick repairs that cost under $500 but can boost your appraisal value by thousands."},
                        {"icon": "📉", "title": "Pricing Pitfalls", "description": "How listing at the wrong price can kill your momentum and cost you money."},
                        {"icon": "🤝", "title": "Negotiation Secrets", "description": "Three phrases real estate agents use to save thousands on transactions."}
                    ]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 10. GYM & FITNESS THANK YOU (Free Pass Claimed)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Thank You - Gym Pass Claimed",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "You're All Set! 🎫",
                    "subtitle": "Your 7-day free pass is waiting. Watch the tour below and prepare for your first workout.",
                    "hideButton": True,
                    "hideBackground": True
                }
            },
            {
                "type": "Video",
                "order": 1,
                "config": {
                    "title": "Take a Tour of Elite Gym",
                    "subtitle": "Get a sneak peek of our facilities and trainers before you visit.",
                    "mode": "embedded",
                    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "autoplay": False
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "How to Prepare",
                    "subtitle": "Here is what you need to bring for your first workout:",
                    "features": [
                        {"icon": "💳", "title": "Photo ID", "description": "Bring a valid ID so we can issue your member badge at the front desk."},
                        {"icon": "👟", "title": "Clean Shoes", "description": "Please bring a clean pair of athletic shoes to wear on the gym floor."},
                        {"icon": "💧", "title": "Water Bottle", "description": "Hydration is key. We have filtered water stations throughout the gym."}
                    ]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 11. RESTAURANT THANK YOU (Table Booked)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Thank You - Reservation Confirmed",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Your Table is Booked! 🍽️",
                    "subtitle": "We look forward to hosting you. We've sent a confirmation email with all details.",
                    "hideButton": True,
                    "hideBackground": True
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Important Details",
                    "subtitle": "Please keep these guidelines in mind for your dining experience:",
                    "features": [
                        {"icon": "⏱️", "title": "15-Min Grace Period", "description": "We will hold your table for up to 15 minutes past your scheduled reservation time."},
                        {"icon": "🚗", "title": "Valet Parking", "description": "Complimentary valet parking is available at the front entrance of the restaurant."},
                        {"icon": "🥗", "title": "Dietary Requests", "description": "Please inform your server of any food allergies or dietary restrictions upon seating."}
                    ]
                }
            }
        ]
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 12. HEALTHCARE THANK YOU (Appointment Requested)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "Thank You - Clinic Appointment Requested",
        "category": TemplateCategory.FUNNELS,
        "thumbnail_url": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80",
        "sections": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Request Received 🩺",
                    "subtitle": "Our team is reviewing your preferred dates and will call you within 2 hours to confirm your slot.",
                    "hideButton": True,
                    "hideBackground": True
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "How to Prepare",
                    "subtitle": "To help us serve you better, please prepare the following:",
                    "features": [
                        {"icon": "📋", "title": "Medical History", "description": "Bring records of any previous diagnoses, treatments, or surgeries."},
                        {"icon": "💊", "title": "Medications List", "description": "Keep a list of any prescriptions, vitamins, or supplements you are taking."},
                        {"icon": "⏰", "title": "Arrive Early", "description": "Please arrive 15 minutes before your scheduled appointment time for paperwork."}
                    ]
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
        print(f"\nDone! Seeded {seeded} new templates. Skipped {skipped} existing.")
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("[*] Seeding premium industry templates...\n")
    seed_all_templates()
