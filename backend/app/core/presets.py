from typing import List, Dict, Any
from app.models.template import TemplateCategory

def get_preset_sections(category: TemplateCategory | str) -> List[Dict[str, Any]]:
    """
    Returns a high-converting, marketing-optimized sequence of sections for the given category.
    Uses proven AIDA (Attention, Interest, Desire, Action) frameworks.
    """
    # Normalize category string if needed
    category_str = category.value if hasattr(category, "value") else str(category)
    
    presets = {
        "Gym & Fitness": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Transform Your Body in 90 Days (Or Your Money Back)",
                    "subtitle": "Join the elite fitness community that has helped 5,000+ locals achieve their dream physique. Proven methods, expert coaching, guaranteed results.",
                    "ctaText": "Claim Your 7-Day Free Trial",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
                    "overlayOpacity": 0.7,
                    "buttonColor": "#ef4444"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "The Results Speak For Themselves",
                    "stats": [
                        {"value": "5,000+", "label": "Transformations"},
                        {"value": "15+", "label": "Expert Coaches"},
                        {"value": "98%", "label": "Success Rate"},
                        {"value": "24/7", "label": "Facility Access"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Why We Are Different",
                    "subtitle": "Stop guessing. Start progressing with a proven system.",
                    "features": [
                        {"icon": "🎯", "title": "Custom Nutrition Plans", "description": "No cookie-cutter diets. Eat foods you love while dropping body fat."},
                        {"icon": "💪", "title": "Expert Coaching", "description": "Form correction, progressive overload tracking, and daily accountability."},
                        {"icon": "🤝", "title": "Incredible Community", "description": "Train alongside highly motivated individuals who push you to be your best."},
                        {"icon": "📊", "title": "3D Body Scanning", "description": "Track your real progress with our advanced biometric scanners."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 3,
                "config": {
                    "title": "Real People, Unreal Results",
                    "subtitle": "Don't just take our word for it.",
                    "testimonials": [
                        {"name": "Mark D.", "role": "Lost 45 lbs", "content": "I tried every diet and gym out there. This is the only place that actually held me accountable. Best decision of my life.", "avatar": "https://i.pravatar.cc/150?img=11"},
                        {"name": "Sarah W.", "role": "Gained 10 lbs Muscle", "content": "The coaches actually care. They fixed my form, adjusted my macros, and completely transformed my confidence.", "avatar": "https://i.pravatar.cc/150?img=5"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 4,
                "config": {
                    "title": "Ready to Start Your Transformation?",
                    "subtitle": "Spots are strictly limited. Book your free strategy session today.",
                    "fields": ["Full Name", "Email Address", "Phone Number", "Your Primary Goal"],
                    "buttonText": "Book My Free Session",
                    "backgroundColor": "#ef4444"
                }
            }
        ],
        "Software Company": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Automate Your Workflow & Save 20+ Hours a Week",
                    "subtitle": "The all-in-one platform built to eliminate busywork, align your team, and accelerate your growth trajectory. No credit card required.",
                    "ctaText": "Start Your 14-Day Free Trial",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80",
                    "overlayOpacity": 0.8,
                    "buttonColor": "#3b82f6"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Everything You Need to Scale",
                    "subtitle": "Replace 5 different subscriptions with one powerful platform.",
                    "features": [
                        {"icon": "⚡", "title": "Lightning Fast", "description": "Built on modern architecture ensuring sub-100ms response times globally."},
                        {"icon": "🔒", "title": "Enterprise Security", "description": "SOC2 Type II certified with end-to-end encryption for your sensitive data."},
                        {"icon": "🔌", "title": "Seamless Integrations", "description": "Connect instantly with Slack, Salesforce, Google Workspace, and 100+ others."},
                        {"icon": "📈", "title": "Advanced Analytics", "description": "Turn your raw data into actionable insights with our custom dashboards."}
                    ]
                }
            },
            {
                "type": "Testimonials",
                "order": 2,
                "config": {
                    "title": "Loved by High-Growth Teams",
                    "subtitle": "Join 10,000+ companies who have revolutionized their operations.",
                    "testimonials": [
                        {"name": "David Chen", "role": "CTO, TechFlow", "content": "We migrated our entire engineering org in less than 48 hours. The productivity gains were visible by day three.", "avatar": "https://i.pravatar.cc/150?img=12"},
                        {"name": "Elena Rodriguez", "role": "VP Operations", "content": "It completely eliminated our data silos. Finally, marketing and sales are looking at the exact same metrics.", "avatar": "https://i.pravatar.cc/150?img=32"}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "See It In Action",
                    "subtitle": "Request a personalized demo tailored to your specific use case.",
                    "fields": ["Work Email", "First Name", "Company Size", "Main Challenge"],
                    "buttonText": "Get a Demo",
                    "backgroundColor": "#3b82f6"
                }
            }
        ],
        "Healthcare": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Compassionate Care, World-Class Expertise",
                    "subtitle": "Experience modern healthcare with zero wait times, personalized treatment plans, and top-rated medical specialists dedicated to your well-being.",
                    "ctaText": "Book an Appointment",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80",
                    "overlayOpacity": 0.6,
                    "buttonColor": "#0ea5e9"
                }
            },
            {
                "type": "Stats",
                "order": 1,
                "config": {
                    "title": "Trust in Our Excellence",
                    "stats": [
                        {"value": "20+", "label": "Specialists"},
                        {"value": "50k+", "label": "Patients Treated"},
                        {"value": "4.9/5", "label": "Patient Rating"},
                        {"value": "100%", "label": "Commitment"}
                    ]
                }
            },
            {
                "type": "Features",
                "order": 2,
                "config": {
                    "title": "Patient-First Healthcare",
                    "subtitle": "We've redesigned the medical experience from the ground up.",
                    "features": [
                        {"icon": "⚕️", "title": "Top-Tier Doctors", "description": "Board-certified specialists with decades of clinical experience."},
                        {"icon": "🏥", "title": "State-of-the-art Facility", "description": "Equipped with the latest diagnostic and treatment technologies."},
                        {"icon": "📱", "title": "24/7 Telehealth", "description": "Access your care team anytime, anywhere through our secure portal."},
                        {"icon": "📋", "title": "Transparent Pricing", "description": "No surprise bills. Know your exact costs before treatment begins."}
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Schedule Your Visit",
                    "subtitle": "We accept most major insurance plans. Fast-track your registration below.",
                    "fields": ["Patient Name", "Email Address", "Phone Number", "Reason for Visit"],
                    "buttonText": "Request Appointment",
                    "backgroundColor": "#0ea5e9"
                }
            }
        ],
        "Real Estate": [
            {
                "type": "Hero",
                "order": 0,
                "config": {
                    "title": "Find Your Dream Home Without the Hassle",
                    "subtitle": "Exclusive properties, off-market deals, and expert negotiation. We make buying and selling real estate completely seamless.",
                    "ctaText": "View Exclusive Listings",
                    "ctaLink": "#contact",
                    "backgroundImage": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
                    "overlayOpacity": 0.5,
                    "buttonColor": "#f59e0b"
                }
            },
            {
                "type": "Features",
                "order": 1,
                "config": {
                    "title": "Why Work With Us",
                    "subtitle": "A premium real estate experience.",
                    "features": [
                        {"icon": "🏡", "title": "Off-Market Access", "description": "See premium properties weeks before they hit the public MLS."},
                        {"icon": "💰", "title": "Fierce Negotiation", "description": "Our agents secure an average of 8% better pricing for our clients."},
                        {"icon": "📋", "title": "Full-Service Concierge", "description": "We handle inspections, appraisals, and legal paperwork for you."}
                    ]
                }
            },
            {
                "type": "Gallery",
                "order": 2,
                "config": {
                    "title": "Recently Sold Properties",
                    "subtitle": "We deliver results in any market condition.",
                    "images": [
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
                        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
                        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80"
                    ]
                }
            },
            {
                "type": "Contact",
                "order": 3,
                "config": {
                    "title": "Let's Talk Real Estate",
                    "subtitle": "Whether you're buying, selling, or investing, our experts are ready to help.",
                    "fields": ["Full Name", "Email", "Phone", "I am looking to (Buy/Sell/Invest)", "Budget Range"],
                    "buttonText": "Get Expert Advice",
                    "backgroundColor": "#f59e0b"
                }
            }
        ]
    }
    
    # Generic fallback for any category not explicitly defined above
    fallback_preset = [
        {
            "type": "Hero",
            "order": 0,
            "config": {
                "title": f"Elevate Your {category_str} Experience",
                "subtitle": f"We provide premium {category_str.lower()} solutions designed to help you succeed faster and more efficiently.",
                "ctaText": "Get Started Today",
                "ctaLink": "#contact",
                "backgroundImage": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80",
                "overlayOpacity": 0.6,
                "buttonColor": "#4f46e5"
            }
        },
        {
            "type": "Features",
            "order": 1,
            "config": {
                "title": "Why Choose Us",
                "subtitle": f"The leading choice for {category_str.lower()} professionals.",
                "features": [
                    {"icon": "⭐", "title": "Premium Quality", "description": "We never compromise on the quality of our service delivery."},
                    {"icon": "⚡", "title": "Fast Turnaround", "description": "Time is money. We ensure rapid execution without sacrificing precision."},
                    {"icon": "🤝", "title": "Dedicated Support", "description": "Our team is available round the clock to ensure your success."}
                ]
            }
        },
        {
            "type": "Testimonials",
            "order": 2,
            "config": {
                "title": "Trusted by Leaders",
                "subtitle": "Our clients love working with us.",
                "testimonials": [
                    {"name": "Alex P.", "role": "CEO", "content": "Simply the best decision we made this year. The ROI was immediate.", "avatar": "https://i.pravatar.cc/150?img=33"},
                    {"name": "Jamie L.", "role": "Director", "content": "Professional, reliable, and highly effective. I couldn't recommend them more.", "avatar": "https://i.pravatar.cc/150?img=44"}
                ]
            }
        },
        {
            "type": "Contact",
            "order": 3,
            "config": {
                "title": "Ready to take the next step?",
                "subtitle": "Fill out the form below and our team will get back to you within 24 hours.",
                "fields": ["Full Name", "Email Address", "Phone Number", "How can we help?"],
                "buttonText": "Submit Inquiry",
                "backgroundColor": "#4f46e5"
            }
        }
    ]

    return presets.get(category_str, fallback_preset)
