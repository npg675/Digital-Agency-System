import stripe
from app.core.config import settings

# By default, use platform key. For Agency billing, we override this per request.
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else None

class StripeService:
    @staticmethod
    def get_client(secret_key: str = None):
        """Get a stripe client using either the provided agency key or the platform default."""
        key = secret_key or (settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else None)
        if not key:
            raise ValueError("Stripe API key is missing.")
        # Stripe python library uses global state for api_key, but we can override it per request
        # by passing `api_key=key` to individual Stripe API calls.
        return key

    @staticmethod
    def create_checkout_session(price_id: str, success_url: str, cancel_url: str, customer_email: str, client_reference_id: str, secret_key: str = None):
        key = StripeService.get_client(secret_key)
        
        session = stripe.checkout.Session.create(
            api_key=key,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=customer_email,
            client_reference_id=client_reference_id, # Can pass user.id here to link it later
        )
        return session.url

    @staticmethod
    def create_customer_portal(customer_id: str, return_url: str, secret_key: str = None):
        key = StripeService.get_client(secret_key)
        
        session = stripe.billing_portal.Session.create(
            api_key=key,
            customer=customer_id,
            return_url=return_url,
        )
        return session.url

    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str, secret_key: str = None, webhook_secret: str = None):
        key = StripeService.get_client(secret_key)
        wh_secret = webhook_secret or (settings.STRIPE_WEBHOOK_SECRET if hasattr(settings, 'STRIPE_WEBHOOK_SECRET') else None)
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, wh_secret, api_key=key
            )
            return event
        except ValueError as e:
            raise e
        except stripe.error.SignatureVerificationError as e:
            raise e
