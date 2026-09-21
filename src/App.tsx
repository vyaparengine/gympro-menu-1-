import { useState, useEffect, lazy, Suspense } from 'react';
import { Product, CartItem, Order, GymSettings } from './types';
import { databaseService } from './lib/databaseService';
import { ProductCard } from './components/ProductCard';
import { ProductCardSkeleton } from './components/ProductCardSkeleton';
import { UpiPayment } from './components/UpiPayment';
import { NotificationCenter } from './components/NotificationCenter';
import { AdminPanelSkeleton } from './components/AdminPanelSkeleton';
import { ShoppingBag, Search, Dumbbell, Sparkles, AlertCircle, RefreshCw, Instagram, Star, Flame, Lock, Share2, Check } from 'lucide-react';
import { motion } from 'motion/react';

const CartDrawer = lazy(() => import('./components/CartDrawer').then(module => ({ default: module.CartDrawer })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));

const SETTINGS_KEY = 'gympro_settings';
const CART_KEY = 'gympro_cart';

export default function App() {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<GymSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
      gymName: 'GymPro Supplements',
      upiId: 'shubbi@paytm',
      whatsappNumber: '919876543210',
      logoUrl: '',
      instagramUrl: 'https://instagram.com',
      googleReviewUrl: 'https://g.page/r/your-review-link'
    };
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // UI states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareShop = async () => {
    const shareUrl = window.location.origin;
    const shareTitle = settings.gymName;
    const shareText = `Check out premium gym supplements at ${settings.gymName}! Pure stock directly from original imports:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Web Share aborted or failed, falling back to copy:', err);
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3500);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  // Initialize and load products, settings & cart
  useEffect(() => {
    fetchProducts();
    fetchSettings();
    // Load cart
    const savedCart = localStorage.getItem(CART_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  }, []);

  // Update document title and favicon dynamically based on owner settings
  useEffect(() => {
    if (settings.gymName) {
      document.title = `${settings.gymName} - Premium Supplements`;
    }
    
    // Dynamically update favicon link
    if (settings.logoUrl) {
      // Find or create favicon link
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoUrl;

      // Also update apple-touch-icon
      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleLink);
      }
      appleLink.href = settings.logoUrl;
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const data = await databaseService.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleLogoTap = () => {
    setLogoTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminOpen(true);
        return 0;
      }
      return next;
    });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save cart to local storage when updated
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
    // Open cart automatically on first item add to nudge checkout
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter((item): item is CartItem => item !== null);
    saveCart(updated);
  };

  const handleRemoveCartItem = (productId: string) => {
    const updated = cart.filter(item => item.product.id !== productId);
    saveCart(updated);
  };

  const handleCheckoutSubmit = async (checkoutData: { name: string; phone: string }) => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    const newOrderData: Omit<Order, 'id'> = {
      name: checkoutData.name,
      phone: checkoutData.phone,
      items: orderItems,
      total,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setLoading(true);
    try {
      const savedOrder = await databaseService.saveOrder(newOrderData);
      setCheckoutOrder(savedOrder);
      setIsCartOpen(false);
    } catch (e) {
      console.error('Order creation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderComplete = () => {
    // Empty Cart
    saveCart([]);
    setCheckoutOrder(null);
  };

  const handleSettingsChange = async (newSettings: GymSettings) => {
    setSettings(newSettings);
    await databaseService.saveSettings(newSettings);
  };

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Exclude trending from main grid only when showing "All" category & not searching
  const regularProducts = filteredProducts.filter(product => {
    if (selectedCategory === 'All' && !searchQuery) {
      return !product.isTrending;
    }
    return true;
  });

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-amber-500 selection:text-neutral-950">
      {copiedLink && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-neutral-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-[0_4px_24px_rgba(245,158,11,0.4)] border border-white/15">
          <Share2 className="h-4 w-4 text-neutral-950 animate-pulse" />
          <span>Dukaan link copy ho gaya! Apne clients ke saath WhatsApp/Instagram par share karein! 🌐</span>
        </div>
      )}

      {/* Premium Decorative Light Spot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        
        {/* Navigation Bar */}
        <header className="relative z-10 flex items-center justify-between border-b border-neutral-900/80 pb-6">
          <div 
            onClick={handleLogoTap}
            className="flex items-center gap-3 select-none cursor-pointer active:scale-95 transition-transform"
          >
            {settings.logoUrl ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden border border-amber-500/25 bg-neutral-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to dumbbell if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const iconContainer = document.createElement('div');
                      iconContainer.className = "flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]";
                      iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dumbbell"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/><path d="M6.5 12.5 12.5 6.5"/><path d="m11.5 17.5 6-6"/></svg>';
                      parent.replaceWith(iconContainer);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Dumbbell className="h-5 w-5 stroke-[2.5]" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-white leading-none flex items-center gap-1.5">
                <span>{settings.gymName}</span>
                <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400/20" />
              </h1>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                Premium Supplement Menu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Social Media Links */}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 h-9.5 rounded-xl border border-neutral-850 bg-neutral-900/50 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all cursor-pointer"
                title="Follow us on Instagram"
              >
                <Instagram className="h-4 w-4" />
                <span className="hidden md:inline text-[9px] font-black uppercase tracking-wider">Instagram</span>
              </a>
            )}

            {settings.googleReviewUrl && (
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 h-9.5 rounded-xl border border-neutral-850 bg-neutral-900/50 text-amber-500 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all cursor-pointer"
                title="Write a Google Review"
              >
                <Star className="h-4 w-4 fill-amber-500/10 text-amber-500" />
                <span className="hidden md:inline text-[9px] font-black uppercase tracking-wider">Review Us</span>
              </a>
            )}

            {/* Share Shop Button (Hinglish Support) */}
            <button
              onClick={handleShareShop}
              className="flex items-center gap-1.5 px-2.5 h-9.5 rounded-xl border border-neutral-850 bg-neutral-900/50 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all cursor-pointer"
              title="Apni dukaan share karein!"
            >
              <Share2 className="h-4 w-4 text-amber-500" />
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-wider">Share Shop</span>
            </button>

            {/* Notification Center Trigger */}
            <NotificationCenter />

            {/* Cart trigger button */}
            <button
              id="cart-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.25)] transition-all cursor-pointer h-9.5 ml-1"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">My Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-extrabold text-white border border-amber-400">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Display State */}
        {checkoutOrder ? (
          /* Payment screen shown when checkout successful */
          <div className="py-10">
            <UpiPayment
              order={checkoutOrder}
              upiId={settings.upiId}
              gymName={settings.gymName}
              whatsappNumber={settings.whatsappNumber}
              onBack={() => {
                // Back lets customer edit
                setCheckoutOrder(null);
                setIsCartOpen(true);
              }}
              onOrderComplete={handleOrderComplete}
            />
          </div>
        ) : (
          /* Primary Supplement Browsing Screen */
          <div className="mt-8 space-y-6">
            
            {/* Search and Category filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Category selector row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 scrollbar-none">
                {['All', 'Protein', 'Creatine', 'Mass Gainer', 'Pre-workout', 'Gym Equipment', 'Accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.25)]'
                        : 'bg-neutral-900/40 text-neutral-400 border border-neutral-900 hover:border-neutral-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product search box */}
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  id="product-search-input"
                  type="text"
                  placeholder="Search supplements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-900 bg-neutral-900/20 py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 outline-none transition-all focus:border-amber-500/50 focus:bg-neutral-900/40"
                />
              </div>
            </div>

            {/* Offline indicator */}
            {!databaseService.isUsingFirebase() && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3.5 text-xs text-amber-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Demo Mode Enabled</strong>: Products and orders are saved directly in local storage. Click the Cloud Setup banner or complete setup to enable live Firestore synchronization.
                </span>
              </div>
            )}

            {/* Trending / Hot Deals Shelf (Only when selected category is 'All' and no search query) */}
            {selectedCategory === 'All' && !searchQuery && products.some(p => p.isTrending) && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-neutral-900/60 pb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    <Flame className="h-3.5 w-3.5 fill-amber-500/10 stroke-[2.5] text-amber-500" />
                  </span>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-500">
                    Most Demanded & Trending
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent ml-2" />
                  <span className="text-[9px] font-black tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                    GYM BESTSELLERS
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {products
                    .filter(p => p.isTrending)
                    .map((product) => {
                      const cartItem = cart.find(item => item.product.id === product.id);
                      return (
                        <ProductCard
                          key={`trending-${product.id}`}
                          product={product}
                          onAddToCart={handleAddToCart}
                          cartQuantity={cartItem ? cartItem.quantity : 0}
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* Main Products Grid */}
            <div className="space-y-4">
              {selectedCategory === 'All' && !searchQuery && products.some(p => p.isTrending) && (
                <div className="flex items-center gap-2 border-b border-neutral-900/60 pb-2 pt-6">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-900 text-neutral-400 border border-neutral-800">
                    <Dumbbell className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-300">
                    Our Full Supplement Menu
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-neutral-800 to-transparent ml-2" />
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : regularProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-900 p-16 text-center">
                  <Dumbbell className="mx-auto h-8 w-8 text-neutral-600 mb-3" />
                  <h3 className="text-sm font-bold text-neutral-300">No supplements found</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Try adjusting your filters or search keywords.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {regularProducts.map((product) => {
                    const cartItem = cart.find(item => item.product.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        cartQuantity={cartItem ? cartItem.quantity : 0}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="relative z-10 mt-16 border-t border-neutral-900/80 pt-8 pb-4 text-center text-xs text-neutral-500">
          {(settings.instagramUrl || settings.googleReviewUrl) && (
            <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-neutral-850 bg-neutral-900/30 px-4 py-2 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all cursor-pointer font-bold tracking-wider text-[10px] uppercase"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span>Follow us on Instagram</span>
                </a>
              )}
              {settings.googleReviewUrl && (
                <a
                  href={settings.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-neutral-850 bg-neutral-900/30 px-4 py-2 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all cursor-pointer font-bold tracking-wider text-[10px] uppercase"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-500/10 text-amber-500" />
                  <span className="text-amber-500">Review Us on Google</span>
                </a>
              )}
            </div>
          )}
          <p>© 2026 {settings.gymName} Menu. Fully compliant with PWA standards.</p>
          <p className="mt-1.5">
            Secure UPI Scan & Pay enabled • Fast WhatsApp Delivery Confirmation
          </p>
        </footer>
      </div>

      {/* Slidout Cart Drawer */}
      <Suspense fallback={
        isCartOpen ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/60 backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-900 flex flex-col p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="h-5 w-24 rounded bg-neutral-800 animate-pulse" />
                <div className="h-5 w-5 rounded bg-neutral-800 animate-pulse" />
              </div>
              <div className="flex-1 space-y-4 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-neutral-900/20 border border-neutral-900 rounded-xl animate-pulse">
                    <div className="h-12 w-12 rounded-lg bg-neutral-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/2 rounded bg-neutral-800" />
                      <div className="h-3 w-1/4 rounded bg-neutral-850" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null
      }>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onSubmitCheckout={handleCheckoutSubmit}
        />
      </Suspense>

      {/* Admin Panel (Password block starts inside) */}
      {isAdminOpen && (
        <Suspense fallback={<AdminPanelSkeleton onClose={() => setIsAdminOpen(false)} />}>
          <AdminPanel
            onClose={() => setIsAdminOpen(false)}
            onSettingsChange={handleSettingsChange}
            currentSettings={settings}
            products={products}
            onRefreshProducts={fetchProducts}
          />
        </Suspense>
      )}
    </div>
  );
}

