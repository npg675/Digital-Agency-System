"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function ContactSection({ config, pageId }: { config: any; pageId?: string }) {
  const fields: string[] = config.fields || ["Full Name", "Email Address", "Phone Number", "Message"];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [bookNow, setBookNow] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const isDateField = (fieldName: string) => {
    const nameLower = fieldName.toLowerCase();
    return (
      nameLower.includes("date") ||
      nameLower.includes("booking") ||
      nameLower.includes("appointment") ||
      nameLower.includes("time") ||
      nameLower.includes("schedule") ||
      nameLower.includes("calendar")
    );
  };

  const hasDateField = fields.some(isDateField);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) return;
    setStatus("sending");
    try {
      // Create a copy of the form data for submission
      const submissionData = { ...formData };

      // For any date/time field, if the user didn't want to book now, set it to the fallback string
      fields.forEach((field) => {
        if (isDateField(field)) {
          if (!bookNow) {
            submissionData[field] = "(Schedule later via email)";
          } else if (!submissionData[field]) {
            submissionData[field] = "(Not specified)";
          }
        }
      });

      // Map fields to API schema
      const name = submissionData["Full Name"] || submissionData["Name"] || Object.values(submissionData)[0] || "";
      const email = submissionData["Email Address"] || submissionData["Email"] || "";
      const phone = submissionData["Phone Number"] || submissionData["Phone"] || "";

      // Aggregate all other custom fields into message
      const extraDetails: string[] = [];
      Object.entries(submissionData).forEach(([key, val]) => {
        if (
          key !== "Full Name" &&
          key !== "Name" &&
          key !== "Email Address" &&
          key !== "Email" &&
          key !== "Phone Number" &&
          key !== "Phone" &&
          key !== "Message"
        ) {
          extraDetails.push(`${key}: ${val}`);
        }
      });
      if (submissionData["Message"]) {
        extraDetails.push(`Message: ${submissionData["Message"]}`);
      }
      const message = extraDetails.join("\n");

      const res = await fetch(`${API}/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, landing_page_id: pageId }),
      });

      if (res.ok) {
        if (config.redirectUrl && config.redirectUrl.trim() !== "") {
          window.location.href = config.redirectUrl;
        } else {
          setStatus("success");
          setFormData({});
          setBookNow(false);
        }
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  if (config.isHidden) return null;

  return (
    <section id="contact" className="py-24 px-6" style={{ backgroundColor: `${config.backgroundColor || "#6366f1"}12` }}>
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 shadow-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-center mb-10">
            {!config.hideTitle && (
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-3">
                {config.title || "Get In Touch"}
              </h2>
            )}
            {!config.hideSubtitle && config.subtitle && (
              <p className="text-zinc-500 dark:text-zinc-400">
                {config.subtitle}
              </p>
            )}
          </div>

          {status === "success" ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Thank you!</h3>
              <p className="text-zinc-500 dark:text-zinc-400">We've received your message and will get back to you shortly.</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-8 px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {hasDateField && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bookNow}
                      onChange={(e) => setBookNow(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      📅 Book appointment date & time now?
                    </span>
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-8">
                    If unchecked, we'll send you an email to fix the date later.
                  </p>
                </div>
              )}

              {fields.map((field, i) => {
                const isDate = isDateField(field);
                if (isDate && !bookNow) {
                  return null;
                }
                const isMessage = field.toLowerCase().includes("message") || field.toLowerCase().includes("details");
                return (
                  <div key={i}>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{field}</label>
                    {isMessage ? (
                      <textarea
                        required
                        value={formData[field] || ""}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        rows={4}
                        placeholder={`Enter your ${field.toLowerCase()}`}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
                      />
                    ) : (
                      <input
                        required
                        type={
                          field.toLowerCase().includes("email")
                            ? "email"
                            : isDate
                            ? "datetime-local"
                            : "text"
                        }
                        value={formData[field] || ""}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        placeholder={`Enter your ${field.toLowerCase()}`}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      />
                    )}
                  </div>
                );
              })}

              {status === "error" && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
                  Something went wrong. Please try again.
                </div>
              )}

              {!config.hideButton && (
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full h-14 mt-4 rounded-xl font-bold text-white text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ backgroundColor: config.backgroundColor || "#6366f1" }}
                >
                  {status === "sending" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    config.buttonText || "Send Message"
                  )}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
