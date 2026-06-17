"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reputation/public/${id}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInfo();
  }, [id]);

  const handleRatingClick = async (r: number) => {
    setRating(r);
    
    // If 4 or 5 stars, redirect to Google instantly
    if (r >= 4) {
      // Submit rating first
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reputation/public/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: r })
      });
      
      if (data.google_review_url) {
        window.location.href = data.google_review_url;
      } else {
        setSubmitted(true);
      }
    }
  };

  const submitPrivateFeedback = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reputation/public/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, private_feedback: feedback })
    });
    setSubmitted(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500"></div></div>;

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500">Review request not found or expired.</div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-500 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Thank You!</h2>
          <p className="text-zinc-600">Your feedback has been received and helps us improve our service.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {data.branding_logo ? (
          <img src={data.branding_logo} alt="Company Logo" className="h-16 mx-auto mb-6 object-contain" />
        ) : (
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
            {data.company_name[0]}
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Hi {data.customer_name},</h1>
        <p className="text-zinc-600 mb-8">How was your recent experience with {data.company_name}?</p>
        
        {!rating ? (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  className={`w-12 h-12 transition-colors ${
                    (hoverRating || rating) >= star 
                      ? "fill-amber-400 text-amber-400" 
                      : "text-zinc-200 hover:text-amber-200"
                  }`} 
                />
              </button>
            ))}
          </div>
        ) : (
          rating <= 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-left">
              <div className="flex gap-1 justify-center mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-6 h-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`} />
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> We're sorry to hear that.
                </h3>
                <p className="text-sm text-amber-800">Please let us know how we can improve. Your feedback goes directly to our management team.</p>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what went wrong..."
                className="w-full h-32 p-3 border border-zinc-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              ></textarea>
              <Button onClick={submitPrivateFeedback} className="w-full bg-amber-600 hover:bg-amber-700">
                Submit Feedback
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
