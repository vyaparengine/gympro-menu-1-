import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onSubmitCheckout: (checkoutData: { name: string; phone: string }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitCheckout
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your phone number');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }

    onSubmitCheckout({ name, phone });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-neutral-800 bg-neutral-950 p-6 shadow-2xl sm:w-[450px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5 text-amber-500" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-neutral-950">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Your Cart</h2>
              </div>
              <button
                id="close-cart-btn"
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-neutral-900 p-4 border border-neutral-800/60 mb-3">
                    <ShoppingBag className="h-8 w-8 text-neutral-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-300">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-neutral-500 max-w-[200px]">
                    Add protein, creatine, or pre-workout from our menu to get started.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 rounded-xl border border-neutral-900 bg-neutral-900/30 p-3.5 transition-colors hover:border-neutral-800/80"
                  >
                    {/* Item Image */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                      referrerPolicy="no-referrer"
                    />

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-sm font-medium text-white line-clamp-1 leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-neutral-500">{item.product.category}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800/60">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-bold text-neutral-200">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout Form */}
            {cartItems.length > 0 && (
              <div className="border-t border-neutral-800 pt-4 bg-neutral-950">
                {/* Pricing Summary */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-400">Total Amount</span>
                  <span className="text-xl font-black text-amber-500">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="customer-name-input"
                      type="text"
                      placeholder="Enter Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none transition-all focus:border-amber-500 focus:bg-neutral-900"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="customer-phone-input"
                      type="tel"
                      placeholder="WhatsApp Mobile Number (10 digit)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none transition-all focus:border-amber-500 focus:bg-neutral-900"
                    />
                  </div>

                  {formError && (
                    <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg py-1.5 px-3">
                      {formError}
                    </p>
                  )}

                  <button
                    id="checkout-btn"
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition-all hover:from-amber-500 hover:to-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
                  >
                    <span>Proceed to Pay & Order</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
