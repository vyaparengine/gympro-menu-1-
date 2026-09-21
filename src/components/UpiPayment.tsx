import React from 'react';
import { Order } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle, ExternalLink, MessageSquare, PhoneCall, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface UpiPaymentProps {
  order: Order;
  upiId: string;
  gymName: string;
  whatsappNumber: string;
  onBack: () => void;
  onOrderComplete: () => void;
}

export const UpiPayment: React.FC<UpiPaymentProps> = ({
  order,
  upiId,
  gymName,
  whatsappNumber,
  onBack,
  onOrderComplete
}) => {
  const [copied, setCopied] = React.useState(false);

  // Clean WhatsApp number to ensure only digits
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  // Format WhatsApp number with country code (91 for India if not provided)
  const formattedWhatsApp = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Construct UPI URI
  const encodedGymName = encodeURIComponent(gymName);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodedGymName}&am=${order.total}&tn=Order_${order.id}&cu=INR`;

  // Get formatted date and time for order
  const formattedDate = React.useMemo(() => {
    try {
      return new Date(order.timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }, [order.timestamp]);

  // Calculate total quantity of items
  const totalItemsCount = React.useMemo(() => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [order.items]);

  // Construct WhatsApp Message
  const itemsText = order.items
    .map(item => `📦 *${item.name}*\n    Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}`)
    .join('\n\n');

  const whatsappMessage = `📥 *NEW ORDER RECEIVED - ${gymName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *CUSTOMER DETAILS*
• *Name:* ${order.name}
• *Phone:* ${order.phone}
• *Order Date:* ${formattedDate}

📦 *ORDER SUMMARY (${totalItemsCount} items)*
${itemsText}

💵 *PAYMENT SUMMARY*
• *Grand Total:* ₹${order.total.toLocaleString('en-IN')}
• *Payment Mode:* UPI Scan & Pay (Scan Code)
• *Verification Status:* Pending Owner Review
• *Order Reference ID:* ${order.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *Message from Customer:*
_I have completed the payment of *₹${order.total.toLocaleString('en-IN')}* via UPI scan. I'm attaching the payment screenshot below. Please verify and confirm my order!_`;

  const whatsappUrl = `https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-md"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Modify Order</span>
      </button>

      {/* Hero Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
          <CheckCircle className="h-6 w-6 text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">Order Created Successfully!</h2>
        <p className="mt-1 text-xs text-neutral-400">Order ID: <span className="font-mono text-amber-400 font-bold">{order.id}</span></p>
      </div>

      {/* Amount Display */}
      <div className="mt-5 rounded-xl bg-neutral-950 p-4 border border-neutral-900 text-center">
        <span className="text-[11px] text-neutral-500 uppercase font-semibold tracking-wider">Amount to Pay</span>
        <div className="text-2xl font-black text-white mt-1">
          ₹{order.total.toLocaleString('en-IN')}
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">Scan QR or tap deep link below to pay directly</p>
      </div>

      {/* QR Code */}
      <div className="mt-6 flex flex-col items-center justify-center">
        <div className="rounded-2xl bg-white p-4 shadow-[0_0_24px_rgba(255,255,255,0.05)] border border-neutral-100">
          <QRCodeSVG 
            value={upiUrl} 
            size={180} 
            level="M" 
            includeMargin={true}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 bg-neutral-950 px-3.5 py-1.5 rounded-full border border-neutral-900">
          <span className="text-xs font-mono text-neutral-400">{upiId}</span>
          <button 
            onClick={copyUpiId}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">Scan & Pay</span>
      </div>

      {/* Mobile UPI Deep Link */}
      <div className="mt-6">
        <a
          href={upiUrl}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 border border-neutral-700 py-3 text-xs font-bold text-white hover:bg-neutral-700 transition-colors"
        >
          <span>Pay via UPI App</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Order Summary details */}
      <div className="mt-6 border-t border-neutral-800 pt-4 text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-neutral-500">Customer Name:</span>
          <span className="font-semibold text-neutral-200">{order.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Phone Number:</span>
          <span className="font-semibold text-neutral-200">{order.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Status:</span>
          <span className="font-semibold text-amber-500 uppercase tracking-wider text-[10px]">Pending Verification</span>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="mt-6 pt-5 border-t border-neutral-800 space-y-4">
        {/* Send to WhatsApp */}
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-60 blur-md group-hover:opacity-100 transition duration-300 animate-pulse" />
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onOrderComplete();
            }}
            className="relative flex w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-500 py-3.5 px-4 text-center text-white transition-all hover:scale-[1.02] shadow-[0_4px_24px_rgba(34,197,94,0.35)]"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 fill-white animate-bounce" />
              <span className="text-xs font-black uppercase tracking-widest">SEND ORDER TO WHATSAPP</span>
            </div>
            <span className="text-[10px] text-green-100 font-semibold tracking-wider">
              👉 Click to share payment screenshot with Owner to dispatch
            </span>
          </a>
        </div>

        {/* Complete without WhatsApp */}
        <button
          onClick={onOrderComplete}
          className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 font-bold transition-colors text-center uppercase tracking-wider cursor-pointer"
        >
          Skip WhatsApp & complete order
        </button>
      </div>
    </motion.div>
  );
};
