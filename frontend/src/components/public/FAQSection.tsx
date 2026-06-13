"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const faqs = config.faqs || [];
  
  return (
    <section className="py-20 px-8 bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          {!config.hideTitle && <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">{config.title || "FAQ"}</h2>}
          {!config.hideSubtitle && <p className="text-lg text-zinc-500">{config.subtitle}</p>}
        </div>
        <div className="space-y-4">
          {faqs.map((faq: any, i: number) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex justify-between items-center bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-lg font-semibold text-zinc-900 dark:text-white">{question}</span>
        <ChevronDown className={`w-5 h-5 text-indigo-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-6 pt-0 bg-white dark:bg-zinc-900">
          <p className="text-zinc-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
