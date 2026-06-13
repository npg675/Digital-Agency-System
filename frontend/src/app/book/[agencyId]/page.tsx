"use client";

import { useState } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Mail, Phone, ChevronRight, CheckCircle2 } from "lucide-react";

export default function BookingPage({ params }: { params: { agencyId: string } }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 14 days for booking
  const today = startOfToday();
  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(today, i + 1));
  
  // Mock available times
  const availableTimes = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Here we would call the /api/v1/appointments API
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Sidebar - Info */}
        <div className="md:w-1/3 bg-black/40 p-8 flex flex-col justify-between border-r border-white/5">
          <div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Discovery Call</h2>
            <p className="text-gray-400 text-sm mb-6">Book a 30-minute session to discuss your project and how we can help.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>30 Minutes</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-blue-400" />
                <span>Google Meet or Zoom</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">Powered by LandingForge Scheduling</p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:w-2/3 p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: DATE & TIME */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <h3 className="text-xl font-semibold mb-6">Select a Date & Time</h3>
                
                <div className="flex flex-col sm:flex-row gap-6 h-full">
                  {/* Dates List */}
                  <div className="sm:w-1/2 space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {availableDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedDate === date 
                            ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold">{format(date, 'EEEE, MMM d')}</div>
                      </button>
                    ))}
                  </div>

                  {/* Times List */}
                  <div className="sm:w-1/2">
                    {selectedDate ? (
                      <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        <div className="text-sm text-gray-400 mb-4 pb-2 border-b border-white/10">
                          Available times for {format(selectedDate, 'MMM d')}
                        </div>
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`w-full text-center p-3 rounded-xl border transition-all ${
                              selectedTime === time 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                        Select a date first
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white transition-colors">
                    Back
                  </button>
                  <div className="text-sm">
                    <span className="text-gray-400">Selected: </span>
                    <span className="font-semibold text-blue-400">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-6">Your Details</h3>
                
                <form onSubmit={handleBooking} className="space-y-4 flex-grow">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Additional Notes</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-none"
                      placeholder="Please share anything that will help prepare for our meeting."
                    />
                  </div>

                  <div className="pt-4 mt-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? "Confirming..." : "Confirm Appointment"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold mb-2">You're booked!</h3>
                  <p className="text-gray-400">
                    A calendar invitation has been sent to your email address.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left w-full max-w-md mt-6">
                  <div className="font-semibold text-lg mb-4 text-white border-b border-white/10 pb-4">Booking Summary</div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">What:</span>
                      <span className="text-white font-medium">Discovery Call</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">When:</span>
                      <span className="text-white font-medium text-right">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}<br/>
                        {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Who:</span>
                      <span className="text-white font-medium">{formData.name}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
