import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
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
    db = getFirestore(app);
    useFirebase = true;
  } catch (error) {
    console.error('Firebase initialization failed for push service:', error);
    useFirebase = false;
  }
}

export interface PushAnnouncement {
  id: string;
  title: string;
  body: string;
  category: 'new_stock' | 'announcement';
  timestamp: string;
}

export interface DeviceSubscription {
  id: string;
  token: string;
  platform: string;
  createdAt: string;
}

// LocalStorage keys for fallbacks
const LOCAL_KEYS = {
  DEVICES: 'gympro_push_devices',
  ANNOUNCEMENTS: 'gympro_push_announcements',
  SUBSCRIBED: 'gympro_push_subscribed_state'
};

// Play a nice synth notification chime
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    // Beautiful upward tone
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Sound block fallback
  }
};

// Generate a random browser session ID
const getBrowserSessionId = (): string => {
  let sessionId = localStorage.getItem('gympro_browser_session_id');
  if (!sessionId) {
    sessionId = 'dev_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('gympro_browser_session_id', sessionId);
  }
  return sessionId;
};

export const notificationService = {
  isUsingFirebase: (): boolean => useFirebase,

  getPermissionState: (): 'granted' | 'denied' | 'default' => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  requestPermission: async (): Promise<'granted' | 'denied' | 'default'> => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(LOCAL_KEYS.SUBSCRIBED, 'true');
        // Register the device ID
        await notificationService.registerDevice();
      } else {
        localStorage.setItem(LOCAL_KEYS.SUBSCRIBED, 'false');
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'default';
    }
  },

  registerDevice: async (): Promise<void> => {
    const sessionId = getBrowserSessionId();
    const isSubscribed = localStorage.getItem(LOCAL_KEYS.SUBSCRIBED) === 'true';
    const hasNotificationPermission = ('Notification' in window) && Notification.permission === 'granted';
    
    const deviceData: DeviceSubscription = {
      id: sessionId,
      token: hasNotificationPermission ? `web_token_${sessionId}` : 'web_unsubscribed_placeholder',
      platform: 'web',
      createdAt: new Date().toISOString()
    };

    if (!useFirebase) {
      // Local storage fallback
      const localDevicesStr = localStorage.getItem(LOCAL_KEYS.DEVICES) || '[]';
      const devices: DeviceSubscription[] = JSON.parse(localDevicesStr);
      const exists = devices.some(d => d.id === sessionId);
      if (!exists) {
        devices.push(deviceData);
        localStorage.setItem(LOCAL_KEYS.DEVICES, JSON.stringify(devices));
      }
      return;
    }

    try {
      // Save to Firestore
      await setDoc(doc(db, 'devices', sessionId), deviceData);
      console.log('Device successfully registered for push alerts in Firestore:', sessionId);
    } catch (error) {
      console.error('Failed to register device in Firestore:', error);
    }
  },

  getRegisteredDevicesCount: async (): Promise<number> => {
    if (!useFirebase) {
      const localDevicesStr = localStorage.getItem(LOCAL_KEYS.DEVICES) || '[]';
      const devices = JSON.parse(localDevicesStr);
      return Math.max(1, devices.length); // At least 1 (the current user)
    }

    try {
      const snap = await getDocs(collection(db, 'devices'));
      return Math.max(1, snap.size);
    } catch (e) {
      console.error('Failed to get registered devices:', e);
      return 1;
    }
  },

  getAnnouncements: async (): Promise<PushAnnouncement[]> => {
    if (!useFirebase) {
      const localAnnouncementsStr = localStorage.getItem(LOCAL_KEYS.ANNOUNCEMENTS) || '[]';
      const list: PushAnnouncement[] = JSON.parse(localAnnouncementsStr);
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    try {
      const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list: PushAnnouncement[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PushAnnouncement);
      });
      return list;
    } catch (e) {
      console.error('Failed to get announcements from Firestore:', e);
      return [];
    }
  },

  sendPushNotification: async (
    title: string,
    body: string,
    category: 'new_stock' | 'announcement'
  ): Promise<PushAnnouncement> => {
    const id = 'ann_' + Math.random().toString(36).substring(2, 11);
    const announcement: PushAnnouncement = {
      id,
      title,
      body,
      category,
      timestamp: new Date().toISOString()
    };

    if (!useFirebase) {
      // Local fallback
      const localAnnouncementsStr = localStorage.getItem(LOCAL_KEYS.ANNOUNCEMENTS) || '[]';
      const list: PushAnnouncement[] = JSON.parse(localAnnouncementsStr);
      list.push(announcement);
      localStorage.setItem(LOCAL_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      
      // Dispatch custom local event so the customer view instantly gets notified
      window.dispatchEvent(new CustomEvent('local_announcement_received', { detail: announcement }));
      return announcement;
    }

    try {
      // Save to Firestore, triggering the real-time listener on all listening browsers!
      await setDoc(doc(db, 'announcements', id), announcement);
      console.log('Push announcement broadcasted to Firestore:', id);
      return announcement;
    } catch (e) {
      console.error('Failed to send push announcement to Firestore:', e);
      throw e;
    }
  },

  // Listen to new announcements in real-time
  subscribeToAnnouncements: (onNewAnnouncement: (announcement: PushAnnouncement) => void): (() => void) => {
    const listenStartTime = new Date().getTime();

    // Event listener for local storage fallback
    const handleLocalEvent = (e: Event) => {
      const customEvent = e as CustomEvent<PushAnnouncement>;
      if (customEvent.detail) {
        onNewAnnouncement(customEvent.detail);
      }
    };
    window.addEventListener('local_announcement_received', handleLocalEvent);

    if (!useFirebase) {
      return () => {
        window.removeEventListener('local_announcement_received', handleLocalEvent);
      };
    }

    try {
      const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as PushAnnouncement;
            const announcementTime = new Date(data.timestamp).getTime();
            // Only trigger for newly arrived push messages, not historical records
            if (announcementTime >= listenStartTime - 5000) {
              onNewAnnouncement({ id: change.doc.id, ...data });
            }
          }
        });
      }, (err) => {
        console.error('Firestore subscription error:', err);
      });

      return () => {
        unsubscribe();
        window.removeEventListener('local_announcement_received', handleLocalEvent);
      };
    } catch (e) {
      console.error('Failed to subscribe to Firestore announcements:', e);
      return () => {
        window.removeEventListener('local_announcement_received', handleLocalEvent);
      };
    }
  }
};
