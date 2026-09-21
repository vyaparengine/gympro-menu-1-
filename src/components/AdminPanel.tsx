import React, { useState, useEffect } from 'react';
import { Order, Product, GymSettings } from '../types';
import { databaseService } from '../lib/databaseService';
import { notificationService, PushAnnouncement } from '../lib/notificationService';
import { OrderHistory } from './OrderHistory';
import { Lock, ShieldAlert, TrendingUp, Coins, ShoppingBag, Eye, Trash2, Settings, Plus, Package, RefreshCw, LogOut, CheckCircle, Clock, Edit3, Upload, Image, Dumbbell, Flame, Bell, Send, Smartphone, History, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  onClose: () => void;
  onSettingsChange: (settings: GymSettings) => void;
  currentSettings: GymSettings;
  products: Product[];
  onRefreshProducts: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onSettingsChange,
  currentSettings,
  products,
  onRefreshProducts
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('gympro_admin_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        // Valid for 7 days
        if (Date.now() - session.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return true;
        }
      } catch (e) {
        // Ignore
      }
    }
    return false;
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'push_notifications' | 'order_history'>('orders');

  // Push Notifications State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifCategory, setNotifCategory] = useState<'new_stock' | 'announcement'>('new_stock');
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [devicesCount, setDevicesCount] = useState(1);
  const [recentBroadcasts, setRecentBroadcasts] = useState<PushAnnouncement[]>([]);

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // New/Editing Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Protein' | 'Creatine' | 'Mass Gainer' | 'Pre-workout' | 'Gym Equipment' | 'Accessories'>('Protein');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdTrending, setNewProdTrending] = useState(false);
  const [newProdStock, setNewProdStock] = useState('15'); // Stock Count state (Hinglish integration)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('gympro_low_stock_threshold');
    return saved ? parseInt(saved, 10) : 5;
  });

  const handleThresholdChange = (val: number) => {
    setLowStockThreshold(val);
    localStorage.setItem('gympro_low_stock_threshold', val.toString());
  };

  const [prodFormError, setProdFormError] = useState('');
  const [prodFormSuccess, setProdFormSuccess] = useState('');

  // Settings State
  const [gymNameInput, setGymNameInput] = useState(currentSettings.gymName);
  const [upiIdInput, setUpiIdInput] = useState(currentSettings.upiId);
  const [whatsappInput, setWhatsappInput] = useState(currentSettings.whatsappNumber);
  const [logoInput, setLogoInput] = useState(currentSettings.logoUrl || '');
  const [instagramInput, setInstagramInput] = useState(currentSettings.instagramUrl || '');
  const [googleReviewInput, setGoogleReviewInput] = useState(currentSettings.googleReviewUrl || '');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Selected Order for viewing details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 450;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          callback(compressed);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Load orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getOrders();
      setOrders(data);

      // Calc stats
      const totalRev = data.reduce((sum, order) => sum + order.total, 0);
      setTotalRevenue(totalRev);
      setTotalOrdersCount(data.length);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load notification stats when tab changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'push_notifications') {
      fetchNotificationData();
    }
  }, [isAuthenticated, activeTab]);

  const fetchNotificationData = async () => {
    try {
      const [count, broadcasts] = await Promise.all([
        notificationService.getRegisteredDevicesCount(),
        notificationService.getAnnouncements()
      ]);
      setDevicesCount(count);
      setRecentBroadcasts(broadcasts);
    } catch (e) {
      console.error('Failed to load notification stats:', e);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess('');
    setNotifError('');

    if (!notifTitle.trim() || !notifBody.trim()) {
      setNotifError('Please fill in both the Title and Message Body');
      return;
    }

    setNotifSending(true);
    try {
      await notificationService.sendPushNotification(
        notifTitle.trim(),
        notifBody.trim(),
        notifCategory
      );
      
      setNotifSuccess('Push notification broadcasted successfully!');
      setNotifTitle('');
      setNotifBody('');
      
      // Refresh list
      fetchNotificationData();
    } catch (err) {
      console.error(err);
      setNotifError('Failed to send push notification.');
    } finally {
      setNotifSending(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'shubbi@vision') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('gympro_admin_session', JSON.stringify({
        token: 'gympro_admin_token_active',
        timestamp: Date.now()
      }));
    } else {
      setError('Incorrect Admin Password! Try again.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'paid' | 'completed') => {
    try {
      await databaseService.updateOrder(orderId, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdFormError('');
    setProdFormSuccess('');

    if (!newProdName.trim() || !newProdPrice.trim() || !newProdDesc.trim()) {
      setProdFormError('Please fill in Name, Price, and Description');
      return;
    }

    const priceNum = parseFloat(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setProdFormError('Price must be a valid positive number');
      return;
    }

    // Default fitness image if empty
    const imgUrl = newProdImage.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600';

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Date.now(),
      name: newProdName,
      price: priceNum,
      description: newProdDesc,
      category: newProdCategory,
      image: imgUrl,
      inStock: editingProduct ? editingProduct.inStock : true,
      isTrending: newProdTrending,
      stockCount: parseInt(newProdStock, 10) || 0
    };

    try {
      await databaseService.saveProduct(newProduct);
      setProdFormSuccess(editingProduct ? 'Supplement updated successfully!' : 'Supplement added successfully!');
      onRefreshProducts();
      // Reset form
      setNewProdName('');
      setNewProdPrice('');
      setNewProdDesc('');
      setNewProdImage('');
      setNewProdTrending(false);
      setNewProdStock('15');
      setEditingProduct(null);
    } catch (err) {
      setProdFormError('Failed to save product. Please check your connection.');
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProdName(product.name);
    setNewProdPrice(product.price.toString());
    setNewProdDesc(product.description);
    setNewProdCategory(product.category);
    setNewProdImage(product.image);
    setNewProdTrending(!!product.isTrending);
    setNewProdStock(product.stockCount !== undefined ? product.stockCount.toString() : '15');
    setProdFormError('');
    setProdFormSuccess('');
    
    const formEl = document.getElementById('product-form-container');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this supplement? This action cannot be undone.')) {
      try {
        await databaseService.deleteProduct(productId);
        onRefreshProducts();
        if (editingProduct && editingProduct.id === productId) {
          setEditingProduct(null);
          setNewProdName('');
          setNewProdPrice('');
          setNewProdDesc('');
          setNewProdImage('');
          setNewProdTrending(false);
        }
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleToggleStock = async (product: Product) => {
    const updated = { ...product, inStock: !product.inStock };
    try {
      await databaseService.saveProduct(updated);
      onRefreshProducts();
    } catch (err) {
      console.error('Failed to toggle stock status:', err);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');

    if (!gymNameInput.trim() || !upiIdInput.trim() || !whatsappInput.trim()) {
      setSettingsSuccess('Please fill in all setting fields');
      return;
    }

    onSettingsChange({
      gymName: gymNameInput,
      upiId: upiIdInput,
      whatsappNumber: whatsappInput,
      logoUrl: logoInput,
      instagramUrl: instagramInput,
      googleReviewUrl: googleReviewInput
    });

    setSettingsSuccess('Settings updated successfully!');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to RESET all data to default products and clear order history?')) {
      await databaseService.resetDatabase();
      fetchOrders();
      onRefreshProducts();
      alert('Database reset complete!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h2>
            <p className="mt-1.5 text-xs text-neutral-400">GymPro Menu Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Admin Password
              </label>
              <input
                id="admin-password-input"
                type="password"
                placeholder="Enter password (shubbi@vision)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-amber-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/20 border border-red-900/40 p-3 text-xs text-red-400">
                <ShieldAlert className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-800 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                id="admin-auth-submit"
                type="submit"
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all"
              >
                Authenticate
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <h1 className="text-base font-black uppercase tracking-wider text-white">
            GymPro <span className="text-amber-500">Admin</span> Panel
          </h1>
          <span className="rounded bg-neutral-900 px-2 py-0.5 text-[9px] font-mono text-neutral-400 border border-neutral-800">
            {databaseService.isUsingFirebase() ? 'Firebase' : 'Local Storage'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              localStorage.removeItem('gympro_admin_session');
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-900 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-neutral-900 bg-neutral-950/80 p-4 flex md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Manage Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>System Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('push_notifications')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'push_notifications'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Push Announcements</span>
          </button>
          <button
            onClick={() => setActiveTab('order_history')}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'order_history'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Order History / Records</span>
          </button>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-950/40">
          {/* Low Stock Warning Alert Banner */}
          {(() => {
            const lowStockItems = products.filter(p => p.inStock && p.stockCount !== undefined && p.stockCount <= lowStockThreshold);
            if (lowStockItems.length > 0) {
              return (
                <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-xs font-medium text-red-400">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-extrabold uppercase tracking-wider text-red-400">⚠️ Low Stock Alert! Supplement Stock Khatam Hone Wala Hai!</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                        Total <span className="font-bold text-red-300">{lowStockItems.length} products</span> ka stock alert threshold ({lowStockThreshold}) se kam hai. Kripya stock update karein.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lowStockItems.slice(0, 2).map(it => (
                        <span key={it.id} className="hidden lg:inline bg-neutral-950/90 px-2.5 py-1 rounded-md text-[9px] border border-red-500/10 font-bold text-neutral-200">
                          {it.name} ({it.stockCount} bache)
                        </span>
                      ))}
                      {lowStockItems.length > 2 && <span className="hidden lg:inline text-[9px] text-neutral-500 font-bold">+{lowStockItems.length - 2} aur</span>}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Stats Counters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Revenue</span>
                      <h3 className="text-2xl font-black text-amber-500 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20">
                      <Coins className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Orders</span>
                      <h3 className="text-2xl font-black text-white mt-1">{totalOrdersCount}</h3>
                    </div>
                    <div className="rounded-xl bg-neutral-900 p-2.5 border border-neutral-800">
                      <ShoppingBag className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Header */}
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Customer Orders History</h2>
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Orders Table/List */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-neutral-900 bg-neutral-900/10 p-4 space-y-2.5 animate-pulse"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-32 rounded bg-neutral-800" />
                            <div className="h-3 w-16 rounded bg-neutral-850" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-24 rounded bg-neutral-850" />
                            <div className="h-3 w-32 rounded bg-neutral-850" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="h-4 w-12 rounded bg-neutral-800" />
                          <div className="h-5 w-20 rounded bg-neutral-850" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.filter(o => !o.isArchived).length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-900 p-12 text-center text-sm text-neutral-500">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3 animate-pulse" />
                  <p className="font-extrabold text-white text-sm">Koi bhi active order bacha nahi hai! 👍</p>
                  <p className="text-xs text-neutral-500 mt-1">Naye orders aane par yahan dikhenge. Purane orders ko 'Order History' tab mein dekhein.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.filter(o => !o.isArchived).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-neutral-900 bg-neutral-900/10 p-4 transition-all hover:border-neutral-800"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{order.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">({order.id})</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                            <span>Phone: <a href={`tel:${order.phone}`} className="text-amber-400 underline">{order.phone}</a></span>
                            <span className="text-neutral-600">•</span>
                            <span>{new Date(order.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-900">
                          <span className="text-sm font-bold text-white">
                            ₹{order.total.toLocaleString('en-IN')}
                          </span>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5">
                            {order.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20">
                                <Clock className="h-2 w-2" /> Pending
                              </span>
                            )}
                            {order.status === 'paid' && (
                              <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-400 border border-green-500/20">
                                <CheckCircle className="h-2 w-2" /> Paid
                              </span>
                            )}
                            {order.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400 border border-neutral-800">
                                <CheckCircle className="h-2 w-2" /> Completed
                              </span>
                            )}

                            {/* View Button */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Add New/Edit Product Block */}
              <div id="product-form-container" className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-500 mb-4">
                  {editingProduct ? (
                    <>
                      <Edit3 className="h-4 w-4" /> Edit Supplement Item
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Add Custom Product
                    </>
                  )}
                </h3>

                <form onSubmit={handleAddProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Whey Protein Isolate"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Price (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2999"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Category</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value as any)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      >
                        <option value="Protein">Protein</option>
                        <option value="Creatine">Creatine</option>
                        <option value="Mass Gainer">Mass Gainer</option>
                        <option value="Pre-workout">Pre-workout</option>
                        <option value="Gym Equipment">Gym Equipment</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Stock Quantity (Kitna Stock Hai?)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15"
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Product Image (Upload or enter URL)</label>
                      <div className="flex items-center gap-3 bg-neutral-950 p-2.5 border border-neutral-800 rounded-lg">
                        {newProdImage ? (
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
                            <img src={newProdImage} className="h-full w-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setNewProdImage('')}
                              className="absolute top-0.5 right-0.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 transition-colors cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="h-2 w-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-800 bg-neutral-900/50 text-neutral-600">
                            <Image className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <label className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-amber-500 hover:bg-neutral-850 hover:text-amber-400 border border-neutral-800 cursor-pointer transition-all">
                            <Upload className="h-3 w-3" />
                            <span>Upload Local Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, setNewProdImage)}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="Or paste custom image URL..."
                            value={newProdImage}
                            onChange={(e) => setNewProdImage(e.target.value)}
                            className="mt-1.5 w-full bg-transparent text-[11px] text-white outline-none placeholder-neutral-600 border-t border-neutral-900 pt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Description</label>
                      <textarea
                        placeholder="Product description and nutrition summary..."
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none resize-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1 bg-neutral-950/40 p-2 border border-neutral-850 rounded-lg">
                      <input
                        type="checkbox"
                        id="prod-trending-checkbox"
                        checked={newProdTrending}
                        onChange={(e) => setNewProdTrending(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-neutral-800 bg-neutral-950 text-amber-500 accent-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="prod-trending-checkbox" className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium select-none cursor-pointer">
                        <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                        <span>High Demand / Trending Supplement</span>
                      </label>
                    </div>

                    {prodFormError && (
                      <p className="text-[10px] text-red-400">{prodFormError}</p>
                    )}
                    {prodFormSuccess && (
                      <p className="text-[10px] text-green-400">{prodFormSuccess}</p>
                    )}

                    <div className="flex gap-2">
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdName('');
                            setNewProdPrice('');
                            setNewProdDesc('');
                            setNewProdImage('');
                            setEditingProduct(null);
                            setNewProdStock('15');
                            setProdFormError('');
                            setProdFormSuccess('');
                          }}
                          className="flex-1 rounded-xl border border-neutral-800 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-850 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        id="add-custom-product-btn"
                        type="submit"
                        className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        {editingProduct ? 'Save Changes' : 'Add Product to Menu'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Product Listing */}
              <div className="border-t border-neutral-900 pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Supplement Menu Items</h3>
                    <p className="text-[10px] text-neutral-500">Apne items ka current stock check karein.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wide">⚠️ Stock Alert Limit:</span>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10) || 0)}
                      className="w-12 text-center rounded bg-neutral-950 border border-neutral-850 text-xs text-amber-500 font-extrabold py-0.5 outline-none focus:border-amber-500"
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((prod) => {
                    const stock = prod.stockCount !== undefined ? prod.stockCount : 15;
                    const isLow = prod.inStock && stock <= lowStockThreshold;
                    return (
                      <div
                        key={prod.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                          isLow 
                            ? 'border-red-500/40 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                            : 'border-neutral-900 bg-neutral-900/20'
                        }`}
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-12 w-12 rounded-lg object-cover bg-neutral-950"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-[10px] text-amber-500 font-bold">₹{prod.price}</span>
                            <span className="text-[8px] text-neutral-500">({prod.category})</span>
                          </div>
                          <div className="mt-1 flex items-center">
                            {isLow ? (
                              <span className="text-[9px] font-black text-red-400 flex items-center gap-1">
                                ⚠️ Low Stock! ({stock} left)
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-neutral-400">
                                Stock: <span className="font-bold text-neutral-300">{stock} bache</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => handleToggleStock(prod)}
                            className={`rounded px-2.5 py-0.5 text-[9px] font-bold ${
                              prod.inStock
                                ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                : 'bg-red-500/15 text-red-400 border border-red-500/25'
                            }`}
                          >
                            {prod.inStock ? 'In Stock' : 'Out of Stock'}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(prod)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-850 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Edit supplement"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-850 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete supplement"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-md rounded-2xl border border-neutral-900 bg-neutral-900/10 p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-2">Configure Gym Information</h3>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Gym / Shop Name
                  </label>
                  <input
                    type="text"
                    value={gymNameInput}
                    onChange={(e) => setGymNameInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Merchant UPI ID (for QR code payment)
                  </label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Payments will go directly to this merchant account.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    WhatsApp Number (for receiving orders)
                  </label>
                  <input
                    type="text"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Include country code (e.g. 919876543210 for India).</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Gym Logo (Upload or enter URL)
                  </label>
                  <div className="flex items-center gap-3 bg-neutral-950 p-2.5 border border-neutral-800 rounded-lg">
                    {logoInput ? (
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
                        <img src={logoInput} className="h-full w-full object-cover" alt="Logo Preview" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setLogoInput('')}
                          className="absolute top-0.5 right-0.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <Trash2 className="h-2 w-2" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-800 bg-neutral-900/50 text-neutral-600">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <label className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-amber-500 hover:bg-neutral-850 hover:text-amber-400 border border-neutral-800 cursor-pointer transition-all">
                        <Upload className="h-3 w-3" />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setLogoInput)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste custom logo URL..."
                        value={logoInput}
                        onChange={(e) => setLogoInput(e.target.value)}
                        className="mt-1.5 w-full bg-transparent text-[11px] text-white outline-none placeholder-neutral-600 border-t border-neutral-900 pt-1"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">Provide an image file or a URL for your brand logo to show in the header.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Instagram Profile Link
                  </label>
                  <input
                    type="text"
                    value={instagramInput}
                    onChange={(e) => setInstagramInput(e.target.value)}
                    placeholder="e.g. https://instagram.com/yourgym"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Provide link to your gym's Instagram profile.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Google Review Link
                  </label>
                  <input
                    type="text"
                    value={googleReviewInput}
                    onChange={(e) => setGoogleReviewInput(e.target.value)}
                    placeholder="e.g. https://g.page/r/your-review-link"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Provide custom link where clients can post feedback or rate your business.</p>
                </div>

                {settingsSuccess && (
                  <p className="text-[11px] text-green-400 bg-green-950/15 border border-green-900/20 rounded-lg py-1 px-2.5">
                    {settingsSuccess}
                  </p>
                )}

                <button
                  id="save-settings-btn"
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all"
                >
                  Save Settings
                </button>
              </form>

              <div className="border-t border-neutral-900 pt-4">
                <button
                  onClick={handleResetData}
                  className="w-full text-center text-xs font-bold text-red-500/80 hover:text-red-400 py-2 border border-red-900/20 rounded-xl bg-red-950/5 hover:bg-red-950/20 transition-all"
                >
                  Reset App Database & Cache
                </button>
              </div>
            </div>
          )}

          {/* PUSH NOTIFICATIONS (FCM) TAB */}
          {activeTab === 'push_notifications' && (
            <div className="space-y-6">
              {/* Notification Stats Panel */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Active Devices (FCM)</span>
                      <h3 className="text-2xl font-black text-amber-500 mt-1">{devicesCount} Connected</h3>
                      <p className="text-[9px] text-neutral-400 mt-1 leading-snug">
                        Total customer devices registered to receive instant push alerts.
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20">
                      <Smartphone className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Service Status</span>
                      <h3 className="text-2xl font-black text-emerald-500 mt-1">Live & Ready</h3>
                      <p className="text-[9px] text-neutral-400 mt-1 leading-snug">
                        FCM + Real-Time Firestore Broadcast Engine is listening.
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Notification Form */}
                <div className="lg:col-span-7 rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 backdrop-blur-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Draft Push Broadcast</h2>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Send a real-time push alert directly to all customer browsers.</p>
                  </div>

                  <form onSubmit={handleSendNotification} className="space-y-4">
                    {/* Category Select */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Alert Category
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNotifCategory('new_stock')}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-xs font-bold transition-all cursor-pointer ${
                            notifCategory === 'new_stock'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                              : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <Flame className="h-4 w-4" />
                          <span>Stock Refill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifCategory('announcement')}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-xs font-bold transition-all cursor-pointer ${
                            notifCategory === 'announcement'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                              : 'bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <Megaphone className="h-4 w-4" />
                          <span>Announcement</span>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Notification Title
                        </label>
                        <span className="text-[9px] font-mono text-neutral-500">{notifTitle.length}/100</span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g., 🔥 ISO Sensation Protein Refilled!"
                        className="w-full rounded-xl border border-neutral-850 bg-neutral-900/50 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Message Body
                        </label>
                        <span className="text-[9px] font-mono text-neutral-500">{notifBody.length}/500</span>
                      </div>
                      <textarea
                        maxLength={500}
                        rows={4}
                        value={notifBody}
                        onChange={(e) => setNotifBody(e.target.value)}
                        placeholder="e.g., Premium Whey isolate stocks are refilled in all flavors! Visit the shop or scan to order immediately. High demands, limited stocks!"
                        className="w-full rounded-xl border border-neutral-850 bg-neutral-900/50 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500/50 focus:outline-none resize-none"
                      />
                    </div>

                    {notifError && (
                      <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-3 text-[10px] font-bold text-red-400 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{notifError}</span>
                      </div>
                    )}

                    {notifSuccess && (
                      <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-3 text-[10px] font-bold text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{notifSuccess}</span>
                      </div>
                    )}

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={notifSending}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs font-black uppercase tracking-widest text-neutral-950 shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {notifSending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Dispatching Alert...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Push Notification to {devicesCount} Devices</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Broadcast Logs */}
                <div className="lg:col-span-5 rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 backdrop-blur-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white">Broadcast Logs</h2>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Historical list of sent alerts.</p>
                    </div>
                    <button
                      onClick={fetchNotificationData}
                      className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      title="Refresh Logs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {recentBroadcasts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="h-8 w-8 text-neutral-600 mb-3" />
                        <p className="text-xs text-neutral-500 font-semibold">No notifications sent yet</p>
                      </div>
                    ) : (
                      recentBroadcasts.map((br) => (
                        <div
                          key={br.id}
                          className="rounded-xl border border-neutral-850 bg-neutral-950/40 p-3 flex flex-col gap-1.5"
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              br.category === 'new_stock'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {br.category === 'new_stock' ? 'Stock Refill' : 'Announcement'}
                            </span>
                            <span className="text-[8px] text-neutral-500 font-mono">
                              {new Date(br.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">{br.title}</h4>
                          <p className="text-[10px] text-neutral-400 leading-relaxed break-words">{br.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'order_history' && (
            <OrderHistory
              orders={orders}
              onRefreshOrders={fetchOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}
        </main>
      </div>

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl">
            <div className="flex justify-between items-start pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-white text-base">Order Details</h3>
                <span className="text-[10px] text-neutral-500 font-mono">{selectedOrder.id}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white"
              >
                <Lock className="h-4 w-4 hidden" /> {/* dummy */}
                <span className="text-sm font-semibold">✕</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-neutral-300">
              <div className="grid grid-cols-2 gap-2 border-b border-neutral-900 pb-3">
                <div>
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-wide">Customer</span>
                  <span className="font-semibold text-white">{selectedOrder.name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-wide">Phone</span>
                  <a href={`tel:${selectedOrder.phone}`} className="font-semibold text-amber-400 underline">{selectedOrder.phone}</a>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-wide mb-1.5">Purchased Items</span>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-950/50 p-2 rounded border border-neutral-900">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-bold text-neutral-200">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-900 text-sm">
                <span className="text-neutral-500 font-bold">Total Amount</span>
                <span className="font-black text-amber-500 text-lg">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800">
              {selectedOrder.status === 'pending' ? (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'paid')}
                  className="rounded-xl bg-green-600 hover:bg-green-500 py-2 text-xs font-bold text-white transition-colors"
                >
                  Mark as Paid
                </button>
              ) : selectedOrder.status === 'paid' ? (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-neutral-950 transition-colors"
                >
                  Mark as Completed
                </button>
              ) : (
                <div className="col-span-2 text-center text-xs text-neutral-500 bg-neutral-950 py-2 rounded-xl border border-neutral-900">
                  ✓ Order is completed and delivered!
                </div>
              )}

              {selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-neutral-800 hover:bg-neutral-800 py-2 text-xs font-semibold text-neutral-400 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
