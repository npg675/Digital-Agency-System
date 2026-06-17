"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

// In a real app, this should be the Platform/Agency public key, 
// or fetched dynamically from the backend for direct client Stripe accounts.
// For demo purposes, we will mock the initialization.
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

const CheckoutForm = ({ config, clientSecret }: { config: any; clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "An error occurred");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: config.successUrl || window.location.href,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "An error occurred during payment");
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: config.buttonColor || "#10b981" }}
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? "Processing..." : `Pay $${((config.amount || 9900) / 100).toFixed(2)}`}
      </button>
      <div className="flex justify-center items-center gap-2 text-zinc-400 text-xs">
        <span className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center font-bold">🔒</span>
        Guaranteed safe & secure checkout
      </div>
    </form>
  );
};

export function CheckoutSection({ config, pageId }: { config: any; pageId?: string }) {
  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState<any>(null);
  
  useEffect(() => {
    // Dynamically fetch client secret and publishable key from backend based on the client's page
    const setupIntent = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/payments/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: config.amount || 9900,
            currency: "usd",
            description: config.productName || "Premium Package",
            pageId: pageId,
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setClientSecret(data.client_secret);
          // Normally backend would return the agency's stripe_publishable_key
          // setStripePromise(loadStripe(data.publishable_key));
          // For demo mock:
          // setStripePromise(loadStripe("pk_test_mock123"));
        }
      } catch (err) {
        console.error("Failed to create intent", err);
      }
    };
    
    // setupIntent();
  }, [config.amount, config.productName, pageId]);

  if (config?.isHidden) return null;

  return (
    <div className="py-20 px-8 bg-zinc-50 dark:bg-zinc-950 min-h-[600px] flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
        <div className="p-8 text-center bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{config.title || "Complete Your Purchase"}</h2>
          <p className="text-zinc-500 font-medium">{config.productName || "Premium Package"}</p>
          <div className="text-4xl font-extrabold text-zinc-900 dark:text-white mt-4">
            ${((config.amount || 9900) / 100).toFixed(2)}
          </div>
        </div>
        <div className="p-8 space-y-6">
          {stripePromise && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm config={config} clientSecret={clientSecret} />
            </Elements>
          ) : (
            // Mock UI for the public page when Stripe is not actually configured in this demo
            <div className="space-y-6">
              <div className="space-y-4 pointer-events-none opacity-75">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                  <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Card Information</label>
                  <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-t-lg" />
                  <div className="flex w-full">
                    <div className="w-1/2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-t-0 border-r-0 border-zinc-200 dark:border-zinc-700 rounded-bl-lg" />
                    <div className="w-1/2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-br-lg" />
                  </div>
                </div>
              </div>
              <button
                className="w-full py-4 rounded-xl font-bold text-white shadow-lg pointer-events-auto hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.buttonColor || "#10b981" }}
                onClick={() => {
                  alert("Demo: Payment Confirmed!");
                  if (config.successUrl) {
                    window.location.href = config.successUrl;
                  }
                }}
              >
                Pay ${((config.amount || 9900) / 100).toFixed(2)}
              </button>
              <div className="flex justify-center items-center gap-2 text-zinc-400 text-xs">
                <span className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center font-bold">🔒</span>
                Guaranteed safe & secure checkout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
