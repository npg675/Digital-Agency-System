"use client";

import { useEditorStore } from "@/store/useEditorStore";

const SECTION_TYPES = [
  {
    type: "Hero",
    icon: "🦸",
    label: "Hero Banner",
    desc: "Full-width headline with CTA button and background image",
    defaultConfig: {
      title: "Your Compelling Headline Here",
      subtitle: "A clear and concise value proposition that makes visitors want to take action immediately.",
      ctaText: "Get Started Today",
      ctaLink: "#contact",
      backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
      overlayOpacity: 0.6,
      buttonColor: "#6366f1",
    },
  },
  {
    type: "Video",
    icon: "▶️",
    label: "Video Embed",
    desc: "Embed a promotional video or background video",
    defaultConfig: {
      title: "Watch Our Story",
      subtitle: "See how we do things differently",
      mode: "embedded",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      autoplay: false,
      muted: false,
      loop: false,
    },
  },
  {
    type: "Features",
    icon: "✨",
    label: "Features / Benefits",
    desc: "Showcase your key offerings in a responsive card grid",
    defaultConfig: {
      title: "What We Offer",
      subtitle: "Everything you need to succeed",
      features: [
        { icon: "🚀", title: "Fast Delivery", description: "We deliver results quickly without compromising quality." },
        { icon: "💎", title: "Premium Quality", description: "Every project is crafted with the highest standards." },
        { icon: "🤝", title: "Dedicated Support", description: "Our team is with you every step of the way." },
      ],
    },
  },
  {
    type: "Stats",
    icon: "📊",
    label: "Stats / Numbers",
    desc: "Impressive numbers and social proof at a glance",
    defaultConfig: {
      title: "Our Impact in Numbers",
      stats: [
        { value: "500+", label: "Happy Clients" },
        { value: "10+", label: "Years Experience" },
        { value: "99%", label: "Satisfaction Rate" },
        { value: "24/7", label: "Support Available" },
      ],
    },
  },
  {
    type: "About",
    icon: "🏢",
    label: "About / Story",
    desc: "Two-column layout with text and image for your story",
    defaultConfig: {
      title: "About Our Company",
      description: "Tell your brand story here. Share what makes you unique, your values, and why clients should trust you. This is your opportunity to build a human connection with potential customers.\n\nAdd more context about your team, history, or mission here.",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
      imagePosition: "right",
    },
  },
  {
    type: "Gallery",
    icon: "🖼️",
    label: "Gallery / Portfolio",
    desc: "Image grid to showcase your work or properties",
    defaultConfig: {
      title: "Our Portfolio",
      subtitle: "A glimpse of our finest work",
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
      ],
    },
  },
  {
    type: "Testimonials",
    icon: "💬",
    label: "Testimonials",
    desc: "Customer reviews and social proof",
    defaultConfig: {
      title: "What Our Clients Say",
      subtitle: "Real results from real people",
      testimonials: [
        { name: "John Smith", role: "CEO, Acme Corp", content: "Absolutely outstanding service! The results exceeded our expectations by a mile.", avatar: "https://i.pravatar.cc/150?img=12" },
        { name: "Jane Doe", role: "Marketing Director", content: "Professional, responsive, and incredibly skilled. Highly recommend to anyone.", avatar: "https://i.pravatar.cc/150?img=47" },
        { name: "Alex Kumar", role: "Startup Founder", content: "This team transformed our business. We saw a 3x ROI within the first 3 months.", avatar: "https://i.pravatar.cc/150?img=33" },
      ],
    },
  },
  {
    type: "Contact",
    icon: "📩",
    label: "Contact / Lead Form",
    desc: "Lead capture form — submissions saved to your database",
    defaultConfig: {
      title: "Get In Touch",
      subtitle: "Fill out the form and we'll get back to you within 24 hours",
      fields: ["Full Name", "Email Address", "Phone Number", "Message"],
      buttonText: "Send Message",
      backgroundColor: "#6366f1",
    },
  },

  {
    type: "Pricing",
    icon: "💰",
    label: "Pricing Table",
    desc: "3-tier pricing structure to convert visitors",
    defaultConfig: {
      title: "Simple, Transparent Pricing",
      subtitle: "Choose the plan that's right for you",
      tiers: [
        { name: "Basic", price: "$9", period: "/mo", description: "Perfect for starters", features: ["1 Project", "Basic Support"], buttonText: "Get Started", highlight: false },
        { name: "Pro", price: "$29", period: "/mo", description: "Best for professionals", features: ["Unlimited Projects", "Priority Support", "Analytics"], buttonText: "Start Free Trial", highlight: true },
        { name: "Enterprise", price: "$99", period: "/mo", description: "For large teams", features: ["Custom Domain", "24/7 Support", "Custom Integrations"], buttonText: "Contact Us", highlight: false }
      ],
      buttonColor: "#6366f1"
    }
  },
  {
    type: "FAQ",
    icon: "❓",
    label: "FAQ Accordion",
    desc: "Frequently asked questions to overcome objections",
    defaultConfig: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about our product",
      faqs: [
        { question: "What is your refund policy?", answer: "We offer a 30-day money-back guarantee. No questions asked." },
        { question: "Can I cancel my subscription?", answer: "Yes, you can cancel your subscription at any time from your account settings." },
        { question: "Do you offer customer support?", answer: "Absolutely. Our support team is available 24/7 to help you with any issues." }
      ]
    }
  },
  {
    type: "CTA",
    icon: "🎯",
    label: "Call to Action",
    desc: "Standalone high-contrast banner to drive clicks",
    defaultConfig: {
      title: "Ready to get started?",
      subtitle: "Join thousands of satisfied customers today.",
      ctaText: "Start your free trial",
      ctaLink: "#contact",
      buttonColor: "#6366f1",
      backgroundColor: "#111827"
    }
  },
  {
    type: "Socials",
    icon: "🌐",
    label: "Social Media Links",
    desc: "Display your social media profiles",
    defaultConfig: {
      title: "Follow Us",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
      youtube: "",
      tiktok: "",
    },
  },
];

interface AddSectionModalProps {
  onClose: () => void;
}

export function AddSectionModal({ onClose }: AddSectionModalProps) {
  const { addSection } = useEditorStore();

  const handleAdd = (st: typeof SECTION_TYPES[0]) => {
    addSection({
      id: crypto.randomUUID(),
      type: st.type,
      config: JSON.parse(JSON.stringify(st.defaultConfig)),
      order: 999,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Add Section</h2>
            <p className="text-sm text-zinc-400">Choose a section type to add to your page</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl font-bold">✕</button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTION_TYPES.map((st) => (
            <button
              key={st.type}
              onClick={() => handleAdd(st)}
              className="flex items-start gap-4 p-4 rounded-xl border border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-left group"
            >
              <span className="text-3xl flex-shrink-0">{st.icon}</span>
              <div>
                <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{st.label}</p>
                <p className="text-sm text-zinc-400 mt-0.5 leading-snug">{st.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
