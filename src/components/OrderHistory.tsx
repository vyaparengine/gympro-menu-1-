import React, { useState, useMemo } from 'react';
import { Order, OrderItem } from '../types';
import { databaseService } from '../lib/databaseService';
import { 
  History, Search, Calendar, Filter, Archive, CheckCircle, 
  TrendingUp, Dumbbell, Award, Coins, ArrowUpDown, RefreshCw, X 
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrderHistoryProps {
  orders: Order[];
  onRefreshOrders: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: 'pending' | 'paid' | 'completed') => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  orders, 
  onRefreshOrders,
  onUpdateOrderStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, 7days, 30days
  const [archiveFilter, setArchiveFilter] = useState<string>('all'); // all, archived, unarchived
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Archive / Unarchive Handler
  const handleToggleArchive = async (orderId: string, currentArchived: boolean) => {
    setLoadingActionId(orderId);
    try {
      await databaseService.updateOrder(orderId, { isArchived: !currentArchived });
      onRefreshOrders();
    } catch (e) {
      console.error('Archive toggle failed:', e);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Helper: Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search filter
      const matchesSearch = 
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // 3. Archive filter
      if (archiveFilter === 'archived' && !order.isArchived) return false;
      if (archiveFilter === 'unarchived' && order.isArchived) return false;

      // 4. Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today') {
          // Check if same calendar day
          const todayStr = now.toDateString();
          if (orderDate.toDateString() !== todayStr) return false;
        } else if (dateFilter === '7days' && diffDays > 7) {
          return false;
        } else if (dateFilter === '30days' && diffDays > 30) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilter, archiveFilter]);

  // Performance Metrics Stats
  const metrics = useMemo(() => {
    // Only count completed and paid orders for earnings calculations
    const revenueOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');
    const totalEarnings = revenueOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = revenueOrders.length > 0 ? totalEarnings / revenueOrders.length : 0;
    
    // Count most popular items
    const itemCounts: { [key: string]: { name: string; count: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.productId]) {
          itemCounts[item.productId] = { name: item.name, count: 0 };
        }
        itemCounts[item.productId].count += item.quantity;
      });
    });

    const popularItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalEarnings,
      averageOrderValue,
      revenueOrdersCount: revenueOrders.length,
      popularItems
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Hinglish Header Intro */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-amber-500" />
              <span>Purane Orders Ki History & Performance</span>
            </h2>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Bhai, yahan aap apne saare completed ya archived orders ko filter aur track kar sakte hain. Isse gym ki long-term sale aur customer demand clear dikhegi!
            </p>
          </div>
          <button
            onClick={onRefreshOrders}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:border-amber-500/30 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Kamaai */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Kamaai (Revenue)</span>
            <h3 className="text-2xl font-black text-amber-500">₹{metrics.totalEarnings.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-neutral-400">Total Paid & Completed orders se kamaaya</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/20">
            <Coins className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Avg Order Value</span>
            <h3 className="text-2xl font-black text-emerald-500">₹{Math.round(metrics.averageOrderValue).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-neutral-400">Avg value per payment transaction</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        {/* Most sold supplement */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sabse Zyada Bikne Wale Items</span>
            <div className="rounded-xl bg-cyan-500/10 p-2 border border-cyan-500/25">
              <Award className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {metrics.popularItems.length === 0 ? (
              <p className="text-[10px] text-neutral-500 italic">No orders analyzed yet.</p>
            ) : (
              metrics.popularItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-300 font-bold truncate max-w-[150px]">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="text-amber-500 font-mono font-black shrink-0">{item.count} units sold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-900/15 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
          <Filter className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Advanced Search & Filters (Hinglish filters)</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Phone ya Order ID..."
              className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-9 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Status filter select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">Status: Sab Orders (All)</option>
              <option value="pending">Status: Pending Only</option>
              <option value="paid">Status: Paid Only</option>
              <option value="completed">Status: Completed Only</option>
            </select>
          </div>

          {/* Date range Filter select */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">Time: Kabhi Bhi (All Time)</option>
              <option value="today">Time: Aaj Ke Orders (Today)</option>
              <option value="7days">Time: Pichle 7 Din (Last 7 Days)</option>
              <option value="30days">Time: Pichle 30 Din (Last 30 Days)</option>
            </select>
          </div>

          {/* Archive filter select */}
          <div>
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-850 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">Archive View: Sabhi Dekho</option>
              <option value="unarchived">Archive View: Active Orders Only</option>
              <option value="archived">Archive View: Archived Records Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Orders List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-neutral-400 px-1">
          <span>Hinglish Search Results ({filteredOrders.length} orders found)</span>
          {filteredOrders.length > 0 && <span className="text-[10px] text-amber-500 font-mono">Sorted by Date Desc</span>}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-900 p-16 text-center">
            <Archive className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-bold">Arre yaar, koi order match nahi hua!</p>
            <p className="text-[10px] text-neutral-500 mt-1">Apna search query badal ke filter karein.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl border p-4 transition-all ${
                  order.isArchived
                    ? 'border-neutral-950 bg-neutral-950/20 opacity-60 hover:opacity-100 hover:border-neutral-900'
                    : 'border-neutral-900 bg-neutral-900/10 hover:border-neutral-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{order.name}</span>
                      <span className="text-[9px] text-neutral-500 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-850">
                        {order.id}
                      </span>
                      {order.isArchived && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                          ARCHIVED RECORD
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span>Phone: <a href={`tel:${order.phone}`} className="text-amber-400 underline">{order.phone}</a></span>
                      <span className="text-neutral-700">•</span>
                      <span>{new Date(order.timestamp).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Serialized list of purchased items */}
                    <div className="mt-2 text-[10px] text-neutral-400 bg-neutral-950/40 p-2 rounded-lg border border-neutral-900/50 max-w-xl">
                      <span className="font-extrabold text-neutral-300">Ordered Supplements: </span>
                      {order.items.map((it, idx) => (
                        <span key={idx} className="inline-block text-neutral-400 mr-2.5">
                          💪 {it.name} <span className="text-amber-500">x{it.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Archive actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-neutral-900">
                    <div className="text-right">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-neutral-500">Billed Total</span>
                      <span className="text-sm font-black text-white">₹{order.total.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Order completion status selector */}
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                        className="rounded-lg bg-neutral-950 border border-neutral-850 text-[10px] font-bold px-2 py-1 text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="completed">Completed</option>
                      </select>

                      {/* Archive / Unarchive Button */}
                      <button
                        onClick={() => handleToggleArchive(order.id, !!order.isArchived)}
                        disabled={loadingActionId === order.id}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          order.isArchived
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500 hover:text-neutral-950'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-amber-500/40 hover:text-white'
                        }`}
                        title={order.isArchived ? "Archive se bahar nikalein" : "Completed orders list se archive karein"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>{order.isArchived ? "Unarchive" : "Archive"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
