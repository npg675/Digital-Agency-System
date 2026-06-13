"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

// Types
interface Appointment {
  id: string;
  client_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  description?: string;
  type?: 'APPOINTMENT' | 'FOLLOWUP' | 'TASK';
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<{status: 'success' | 'error' | null, msg?: string}>({status: null});
  const { token, user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    start_time: "",
    duration_minutes: 60,
    // New client fields
    new_client_first_name: "",
    new_client_last_name: "",
    new_client_email: "",
    new_client_phone_number: "",
    new_client_password: "",
    // Guest fields
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    description: "",
  });
  const [clientMode, setClientMode] = useState<'EXISTING' | 'NEW' | 'GUEST'>('EXISTING');
  const [submitting, setSubmitting] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [viewAllDate, setViewAllDate] = useState<Date | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ start_time: "", duration_minutes: 60 });

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/appointments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Tag them as appointments for the UI
        setEvents(data.map((e: any) => ({ ...e, type: 'APPOINTMENT' })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setClients(users.filter((u: any) => u.role === "CLIENT"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchEvents(), fetchClients()]).finally(() => setLoading(false));
    }
  }, [token]);

  useEffect(() => {
    const sync = searchParams?.get("sync");
    const msg = searchParams?.get("msg");
    if (sync === "success") {
      setSyncStatus({ status: "success" });
      setTimeout(() => setSyncStatus({ status: null }), 5000);
      router.replace("/admin/calendar");
    } else if (sync === "error") {
      setSyncStatus({ status: "error", msg: msg || "Unknown error" });
      setTimeout(() => setSyncStatus({ status: null }), 8000);
      router.replace("/admin/calendar");
    }
  }, [searchParams, router]);

  const handleSyncGoogleCalendar = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/calendar/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        }
      } else {
        alert("Failed to initialize Google Calendar sync");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let targetClientId = formData.client_id;
    let finalTitle = formData.title;
    let finalDescription = formData.description;

    try {
      // Step 1: Create client if needed
      if (clientMode === 'NEW') {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            first_name: formData.new_client_first_name,
            last_name: formData.new_client_last_name,
            email: formData.new_client_email,
            phone_number: formData.new_client_phone_number,
            password: formData.new_client_password,
            role: "CLIENT"
          })
        });

        if (!userRes.ok) {
          const errData = await userRes.json();
          alert(errData.detail || "Failed to create new client.");
          setSubmitting(false);
          return;
        }

        const newUser = await userRes.json();
        targetClientId = newUser.id;
        
        // Refresh client list in background
        fetchClients();
      } else if (clientMode === 'GUEST') {
        targetClientId = "";
        finalTitle = `${formData.title} (${formData.guest_name})`;
        finalDescription = `Guest Name: ${formData.guest_name}\nEmail: ${formData.guest_email}\nPhone: ${formData.guest_phone}\n\n${formData.description}`;
      }

      // Step 2: Create Appointment
      const start = new Date(formData.start_time);
      const end = new Date(start.getTime() + formData.duration_minutes * 60000);

      const apptRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/appointments/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          host_id: user?.id,
          client_id: targetClientId || undefined,
          title: finalTitle,
          description: finalDescription,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: "SCHEDULED"
        })
      });

      if (apptRes.ok) {
        setIsModalOpen(false);
        setClientMode('EXISTING');
        setFormData({ 
          client_id: "", title: "", start_time: "", duration_minutes: 60,
          new_client_first_name: "", new_client_last_name: "", new_client_email: "", new_client_phone_number: "", new_client_password: "",
          guest_name: "", guest_email: "", guest_phone: "", description: ""
        });
        fetchEvents();
      } else {
        alert("Failed to create appointment");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const start = new Date(rescheduleData.start_time);
      const end = new Date(start.getTime() + rescheduleData.duration_minutes * 60000);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/appointments/${selectedEvent.id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
      });

      if (res.ok) {
        setSelectedEvent(null);
        setIsRescheduling(false);
        fetchEvents();
      } else {
        alert("Failed to reschedule appointment.");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get padding days for the start of the month
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(new Date(e.start_time), day));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Calendar</h1>
          <p className="text-gray-400">Manage appointments, tasks, and follow-ups</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSyncGoogleCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              <CalendarIcon size={18} />
              Sync Google Calendar
            </button>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
              title="How to configure Google Calendar"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>
      </div>

      <AnimatePresence>
        {syncStatus.status === 'success' && (
          <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg shadow-lg">
            <CheckCircle2 size={18} />
            <span className="font-medium">Google Calendar synced successfully! Future appointments will be added automatically.</span>
          </motion.div>
        )}
        {syncStatus.status === 'error' && (
          <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg shadow-lg">
            <AlertCircle size={18} />
            <span className="font-medium">Failed to sync: {syncStatus.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="text-white" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-white/10 rounded-lg text-white transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight className="text-white" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[120px] bg-black/10 overflow-hidden">
          {paddingDays.map((pad) => (
            <div key={`pad-${pad}`} className="p-2 border-r border-b border-white/5 opacity-50" />
          ))}
          
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()} 
                className={`p-2 border-r border-b border-white/5 transition-colors ${isToday ? 'bg-blue-900/20' : ''} ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-white/10' : 'hover:bg-white/5'}`}
                onClick={() => {
                  if (dayEvents.length > 0) setViewAllDate(day);
                }}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="mt-2 flex flex-col items-center justify-center h-[50px]">
                  {dayEvents.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 animate-in fade-in">
                      <div className="flex flex-wrap justify-center gap-1.5 px-1">
                        {dayEvents.slice(0, 5).map((event) => (
                          <div 
                            key={event.id}
                            className={`w-2.5 h-2.5 rounded-full ${
                              event.type === 'FOLLOWUP' 
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                            }`}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 5 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-500 flex items-center justify-center text-[8px] font-bold text-white">
                            +
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                        {dayEvents.length} {dayEvents.length === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">New Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <div className="flex gap-2 mb-3 bg-black/30 p-1 rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setClientMode('EXISTING')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${clientMode === 'EXISTING' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                    Existing Client
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setClientMode('NEW')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${clientMode === 'NEW' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                    Create Account
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setClientMode('GUEST')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${clientMode === 'GUEST' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                    Guest (No Account)
                  </button>
                </div>

                {clientMode === 'EXISTING' && (
                  <select 
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="" disabled>Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                )}

                {clientMode === 'NEW' && (
                  <div className="space-y-3 p-3 bg-black/30 border border-white/5 rounded-lg">
                    <div className="flex gap-2">
                      <input 
                        type="text" required placeholder="First Name"
                        value={formData.new_client_first_name}
                        onChange={(e) => setFormData({...formData, new_client_first_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                      <input 
                        type="text" required placeholder="Last Name"
                        value={formData.new_client_last_name}
                        onChange={(e) => setFormData({...formData, new_client_last_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <input 
                      type="email" required placeholder="Email Address"
                      value={formData.new_client_email}
                      onChange={(e) => setFormData({...formData, new_client_email: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <input 
                      type="password" required placeholder="Temporary Password"
                      value={formData.new_client_password}
                      onChange={(e) => setFormData({...formData, new_client_password: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <input 
                      type="tel" required placeholder="Contact No."
                      value={formData.new_client_phone_number}
                      onChange={(e) => setFormData({...formData, new_client_phone_number: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                {clientMode === 'GUEST' && (
                  <div className="space-y-3 p-3 bg-black/30 border border-white/5 rounded-lg">
                    <input 
                      type="text" required placeholder="Full Name"
                      value={formData.guest_name}
                      onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <input 
                      type="email" placeholder="Email Address (Optional)"
                      value={formData.guest_email}
                      onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <input 
                      type="tel" placeholder="Contact No. (Optional)"
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Discovery Call"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
                  <input 
                    type="datetime-local" required
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Duration (min)</label>
                  <input 
                    type="number" required min="15" step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50">
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Event Details</h2>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedEvent.title}</h3>
                <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Clock size={14} />
                  {format(new Date(selectedEvent.start_time), "EEEE, MMMM d, yyyy")} <br/>
                  {format(new Date(selectedEvent.start_time), "h:mm a")} - {format(new Date(selectedEvent.end_time), "h:mm a")}
                </div>
              </div>

              {selectedEvent.client_id ? (() => {
                const client = clients.find(c => c.id === selectedEvent.client_id);
                if (!client) return null;
                return (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Client Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="text-white font-medium">{client.first_name} {client.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-white">{client.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-white">{client.phone_number || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Guest / Details</h4>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedEvent.description || "No additional details provided."}
                  </div>
                </div>
              )}

              {isRescheduling ? (
                <div className="border-t border-white/10 pt-4 mt-4 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-medium text-white mb-3">Reschedule</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">New Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={rescheduleData.start_time}
                        onChange={(e) => setRescheduleData({...rescheduleData, start_time: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                      <input 
                        type="number" min="15" step="15"
                        value={rescheduleData.duration_minutes}
                        onChange={(e) => setRescheduleData({...rescheduleData, duration_minutes: parseInt(e.target.value)})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                {!isRescheduling ? (
                  <>
                    <button 
                      onClick={() => setIsRescheduling(true)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsRescheduling(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleReschedule}
                      disabled={submitting}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Confirm Reschedule"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Appointments Modal */}
      {viewAllDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                Appointments for {format(viewAllDate, "MMM d, yyyy")}
              </h2>
              <button onClick={() => setViewAllDate(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              {getEventsForDay(viewAllDate).map(event => (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={event.id}
                  onClick={() => {
                    setViewAllDate(null);
                    setSelectedEvent(event);
                    setIsRescheduling(false);
                    const start = new Date(event.start_time);
                    const end = new Date(event.end_time);
                    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                    const formattedStart = format(start, "yyyy-MM-dd'T'HH:mm");
                    setRescheduleData({ start_time: formattedStart, duration_minutes: duration });
                  }}
                  className={`text-sm p-4 rounded-xl cursor-pointer transition-transform hover:scale-[1.02] ${
                    event.type === 'FOLLOWUP' 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30' 
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30'
                  }`}
                >
                  <div className="font-semibold text-white">{event.title}</div>
                  <div className="flex items-center gap-2 text-gray-400 mt-2 text-xs font-medium">
                    <Clock size={14} className={event.type === 'FOLLOWUP' ? 'text-amber-400' : 'text-purple-400'} />
                    {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Setup Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                  <CalendarIcon size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Google Calendar Setup</h2>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-gray-300">
              <p>To enable syncing, you need to add your Google API keys to the <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">backend/.env</code> file.</p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</div>
                  <div>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium">Google Cloud Console</a> and create a new project.</div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">2</div>
                  <div>Navigate to <strong>APIs & Services {">"} Library</strong> and enable the <strong>Google Calendar API</strong>.</div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">3</div>
                  <div>Go to <strong>OAuth consent screen</strong>, select "External" and fill out the required app name and support email.</div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    Go to <strong>Credentials</strong>, click <strong>Create Credentials {">"} OAuth client ID</strong>. 
                    Select "Web application".
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">5</div>
                  <div>
                    Under <strong>Authorized redirect URIs</strong>, you must add exactly:
                    <div className="mt-2 bg-black/50 p-2 rounded border border-white/10 font-mono text-xs text-blue-300 break-all">
                      http://localhost:8000/api/v1/calendar/callback
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">6</div>
                  <div>
                    Click <strong>Create</strong>. Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them into <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">backend/.env</code>.
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setIsGuideOpen(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
