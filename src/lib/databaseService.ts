import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Product, Order, OrderItem, GymSettings } from '../types';
import { DEFAULT_PRODUCTS } from '../data/products';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if we should use local storage fallback
const isMockConfig = 
  !firebaseConfig || 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'MOCK_API_KEY_FOR_LOCAL_FALLBACK' ||
  firebaseConfig.apiKey === '';

let db: any = null;
let useFirebase = false;

if (!isMockConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      // Try to initialize Firestore with persistent local cache to handle offline/disconnected states gracefully
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (cacheError) {
      console.warn('Could not initialize persistent local cache, falling back to standard getFirestore:', cacheError);
      db = getFirestore(app);
    }
    useFirebase = true;
    console.log('Firebase initialized successfully with offline support for GymPro Menu.');
  } catch (error) {
    console.error('Firebase initialization failed, falling back to LocalStorage:', error);
    useFirebase = false;
  }
} else {
  console.log('Using robust LocalStorage engine (Firebase can be connected later).');
}

// ---------------------------------------------------------------------------
// LOCAL STORAGE DATABASE IMPLEMENTATION
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  PRODUCTS: 'gympro_products',
  ORDERS: 'gympro_orders'
};

// Initialize default products in localStorage if they don't exist
const initLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
};

initLocalStorage();

const localDb = {
  getProducts: (): Product[] => {
    initLocalStorage();
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
  },

  saveProduct: (product: Product): Product => {
    const products = localDb.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  },

  deleteProduct: (productId: string): void => {
    const products = localDb.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  },

  getOrders: (): Order[] => {
    initLocalStorage();
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const orders: Order[] = data ? JSON.parse(data) : [];
    // Sort by timestamp desc
    return orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  saveOrder: (orderData: Omit<Order, 'id'>): Order => {
    const orders = localDb.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: 'ord_' + Math.random().toString(36).substr(2, 9)
    };
    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  updateOrder: (orderId: string, updates: Partial<Order>): void => {
    const orders = localDb.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  reset: () => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
};

// ---------------------------------------------------------------------------
// SERVICE EXPORTS (DUAL-MODE FIRESTORE + LOCAL STORAGE)
// ---------------------------------------------------------------------------

export const databaseService = {
  isUsingFirebase: (): boolean => useFirebase,

  getProducts: async (): Promise<Product[]> => {
    if (!useFirebase) {
      return localDb.getProducts();
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      if (querySnapshot.empty) {
        // Seed database if empty
        console.log('Firestore products collection is empty. Seeding with default products...');
        for (const product of DEFAULT_PRODUCTS) {
          await setDoc(doc(db, 'products', product.id), product);
        }
        return DEFAULT_PRODUCTS;
      }

      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });
      return products;
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while fetching products, using local fallback.');
      } else {
        console.error('Failed to fetch from Firestore, using local fallback:', error);
      }
      return localDb.getProducts();
    }
  },

  saveProduct: async (product: Product): Promise<Product> => {
    if (!useFirebase) {
      return localDb.saveProduct(product);
    }

    try {
      await setDoc(doc(db, 'products', product.id), product);
      return product;
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while saving product, saving locally.');
      } else {
        console.error('Failed to save to Firestore, using local:', error);
      }
      return localDb.saveProduct(product);
    }
  },

  getOrders: async (): Promise<Order[]> => {
    if (!useFirebase) {
      return localDb.getOrders();
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Parse items string back to object array if needed
        let parsedItems: OrderItem[] = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        } catch (e) {
          parsedItems = [];
        }
        orders.push({
          ...(data as Omit<Order, 'items'>),
          items: parsedItems,
          id: doc.id
        } as Order);
      });
      return orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while fetching orders, using local fallback.');
      } else {
        console.error('Failed to fetch orders from Firestore, using local fallback:', error);
      }
      return localDb.getOrders();
    }
  },

  saveOrder: async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    if (!useFirebase) {
      return localDb.saveOrder(orderData);
    }

    try {
      const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
      const serializedOrder = {
        ...orderData,
        id: orderId,
        // Firebase rules allow string format better, we also store as string to avoid schema validation errors
        items: JSON.stringify(orderData.items)
      };
      await setDoc(doc(db, 'orders', orderId), serializedOrder);
      return { ...orderData, id: orderId };
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while saving order, saving to local fallback.');
      } else {
        console.error('Failed to save order to Firestore, saving to local fallback:', error);
      }
      return localDb.saveOrder(orderData);
    }
  },

  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<void> => {
    if (!useFirebase) {
      localDb.updateOrder(orderId, updates);
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(orderRef);
      if (docSnap.exists()) {
        const updateData: any = { ...updates };
        if (updates.items) {
          updateData.items = JSON.stringify(updates.items);
        }
        await updateDoc(orderRef, updateData);
      } else {
        // Fallback
        localDb.updateOrder(orderId, updates);
      }
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while updating order, updating local fallback.');
      } else {
        console.error('Failed to update order in Firestore, updating local fallback:', error);
      }
      localDb.updateOrder(orderId, updates);
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    if (!useFirebase) {
      localDb.deleteProduct(productId);
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while deleting product, using local fallback.');
      } else {
        console.error('Failed to delete product in Firestore, using local fallback:', error);
      }
      localDb.deleteProduct(productId);
    }
  },

  getSettings: async (): Promise<GymSettings> => {
    const localSaved = localStorage.getItem('gympro_settings');
    const defaultVal: GymSettings = localSaved ? JSON.parse(localSaved) : {
      gymName: 'GymPro Supplements',
      upiId: 'shubbi@paytm',
      whatsappNumber: '919876543210',
      logoUrl: '',
      instagramUrl: 'https://instagram.com',
      googleReviewUrl: 'https://g.page/r/your-review-link'
    };

    if (!useFirebase) {
      return defaultVal;
    }

    try {
      const docSnap = await getDoc(doc(db, 'settings', 'gym_pro_config'));
      if (docSnap.exists()) {
        const remoteSettings = docSnap.data() as GymSettings;
        localStorage.setItem('gympro_settings', JSON.stringify(remoteSettings));
        return remoteSettings;
      } else {
        await setDoc(doc(db, 'settings', 'gym_pro_config'), defaultVal);
        return defaultVal;
      }
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while getting settings, loading local cached settings.');
      } else {
        console.error('Failed to get settings from Firestore:', error);
      }
      return defaultVal;
    }
  },

  saveSettings: async (settingsData: GymSettings): Promise<void> => {
    localStorage.setItem('gympro_settings', JSON.stringify(settingsData));
    if (!useFirebase) {
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'gym_pro_config'), settingsData);
    } catch (error: any) {
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('client is offline')) {
        console.warn('Firestore offline while saving settings, saved locally.');
      } else {
        console.error('Failed to save settings to Firestore:', error);
      }
    }
  },

  resetDatabase: async (): Promise<void> => {
    localDb.reset();
  }
};
