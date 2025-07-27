require('dotenv').config();
const Stripe = require('stripe');

const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing Stripe secret key in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-05-28.basil",
});

exports.createPaymentSession = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, billingId, description } = req.body;

    if (!amount || !billingId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: "ค่าเช่าห้องพัก",
              description: description || "Room rental payment",
            },
            unit_amount: Math.round(amount * 100), 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
        success_url: `${process.env.VITE_APP_URL || 'https://domini-vercel.vercel.app'}/payment-success?billing_id=${billingId}`,
        cancel_url: `${process.env.VITE_APP_URL || 'https://domini-vercel.vercel.app'}/payment-canceled`,
      metadata: {
        billingId: billingId.toString(),
      },
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating payment session:", error);
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error creating payment session" });
  }
};
