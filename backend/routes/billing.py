from flask import Blueprint, request, jsonify
import stripe
import os
from flask_jwt_extended import jwt_required, get_jwt_identity

billing_bp = Blueprint("billing", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@billing_bp.route("/billing/create-checkout-session", methods=["POST"])
@jwt_required()
def create_checkout_session():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() 
        print("⚠️ Received payload in Flask:", data)

        domain_url = data.get("domain", "http://localhost:5173")

        checkout_session = stripe.checkout.Session.create(
            customer_email=data["email"],               
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": data["priceId"],               
                "quantity": 1
            }],
            success_url=domain_url + "/dashboard?status=success",
            cancel_url=domain_url + "/dashboard?status=cancelled",
            metadata={"user_id": user_id}
        )
        return jsonify({"url": checkout_session.url})
    except Exception as e:
        print("Stripe error:", str(e))
        return jsonify({"error": str(e)}), 400
