import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Plus, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  Utensils, 
  Droplets,
  Award,
  Calendar,
  User as UserIcon,
  LogOut,
  Settings,
  ArrowUpRight,
  Flame,
  Dumbbell,
  Scale,
  LogIn,
  Sparkles,
  Target
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { User, FoodLog, WeightLog } from '@/src/types';
import Onboarding from './components/Onboarding';
import FoodSearch from './components/FoodSearch';
import Community from './components/Community';
import Analytics from './components/Analytics';
import Meals from './components/Meals';
import AICoach from './components/AICoach';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  deleteUser,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  OperationType,
  handleFirestoreError
} from './firebase';
import { User as FirebaseUser } from 'firebase/auth';

type View = 'dashboard' | 'meals' | 'analytics' | 'community' | 'settings' | 'ai-coach';

interface WeightLogModalProps {
  onClose: () => void;
  onLog: () => void;
  currentWeight: number;
}

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'meal' | 'water' | 'achievement';
}

interface NotificationToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  key?: React.Key;
}

function NotificationToast({ toast, onDismiss }: NotificationToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] shadow-2xl shadow-black/50 flex items-center gap-4 min-w-[320px] pointer-events-auto"
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center",
        toast.type === 'meal' ? "bg-emerald-500/10 text-emerald-500" : 
        toast.type === 'water' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
      )}>
        {toast.type === 'meal' ? <Utensils className="w-6 h-6" /> : 
         toast.type === 'water' ? <Droplets className="w-6 h-6" /> : <Award className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{toast.title}</h4>
        <p className="text-xs text-white/40">{toast.message}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
        <Plus className="w-4 h-4 rotate-45" />
      </button>
    </motion.div>
  );
}

function WeightLogModal({ onClose, onLog, currentWeight }: WeightLogModalProps) {
  const [weight, setWeight] = useState(currentWeight);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'weight_logs'), {
        weight,
        logged_at: today,
        created_at: new Date().toISOString()
      });
      // Update current weight in profile
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        current_weight: weight
      });
      onLog();
      onClose();
    } catch (err) {
      console.error('Weight log error:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/weight_logs`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-[#111] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Log Weight</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <p className="text-6xl font-bold mb-2">{isNaN(weight) ? '--' : weight}<span className="text-2xl text-white/20 ml-1">kg</span></p>
            <input 
              type="range" 
              min="30" 
              max="200" 
              step="0.1" 
              value={isNaN(weight) ? 70 : weight} 
              onChange={e => setWeight(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 bg-emerald-500 text-black font-bold rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Scale className="w-5 h-5" />}
            Save Weight Entry
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const calculateBMI = (weight: number, height: number) => {
  if (!weight || !height) return '0.0';
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [waterTotal, setWaterTotal] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuestOnboarding, setIsGuestOnboarding] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [activeMeal, setActiveMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastCheckedMinute, setLastCheckedMinute] = useState<string>('');

  const calculateStreak = useCallback(() => {
    if (logs.length === 0) return 0;
    
    const dates = [...new Set(logs.map(log => log.logged_at))].sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If no log today or yesterday, streak is 0
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 0;
    let currentDate = new Date(dates[0]);

    for (let i = 0; i < dates.length; i++) {
      const logDate = dates[i];
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (logDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs]);

  const streak = calculateStreak();
  const [loginError, setLoginError] = useState<string | null>(null);

  const addToast = (title: string, message: string, type: 'meal' | 'water' | 'achievement') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => dismissToast(id), 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Clear all user-specific state immediately on any auth change
      setUser(null);
      setLogs([]);
      setWeightHistory([]);
      setWaterTotal(0);
      setReminders([]);
      setBadges([]);
      
      setFirebaseUser(u);
      setIsAuthReady(true);
      
      if (!u) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!firebaseUser || !isAuthReady) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // User Profile
    const userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data() as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`));

    // Food Logs
    const logsQuery = query(
      collection(db, 'users', firebaseUser.uid, 'food_logs'),
      where('logged_at', '==', today)
    );
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/food_logs`));

    // Weight History
    const weightUnsubscribe = onSnapshot(collection(db, 'users', firebaseUser.uid, 'weight_logs'), (snapshot) => {
      const weightData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setWeightHistory(weightData.sort((a: any, b: any) => a.logged_at.localeCompare(b.logged_at)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/weight_logs`));

    // Water Logs
    const waterQuery = query(
      collection(db, 'users', firebaseUser.uid, 'water_logs'),
      where('logged_at', '==', today)
    );
    const waterUnsubscribe = onSnapshot(waterQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, d) => acc + (d.data().amount_ml || 0), 0);
      setWaterTotal(total);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/water_logs`));

    // Reminders
    const remindersUnsubscribe = onSnapshot(collection(db, 'users', firebaseUser.uid, 'reminders'), (snapshot) => {
      const remindersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setReminders(remindersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/reminders`));

    // Badges
    const badgesUnsubscribe = onSnapshot(collection(db, 'users', firebaseUser.uid, 'badges'), (snapshot) => {
      const badgesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setBadges(badgesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/badges`));

    return () => {
      userUnsubscribe();
      logsUnsubscribe();
      weightUnsubscribe();
      waterUnsubscribe();
      remindersUnsubscribe();
      badgesUnsubscribe();
    };
  }, [firebaseUser, isAuthReady]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show a scary error
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized in your Firebase console. Please add this URL to your Firebase Authentication "Authorized domains" list.');
      } else {
        setLoginError(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard');
      setIsGuestOnboarding(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser || !auth.currentUser) return;
    
    try {
      // Sensitive operations like account deletion require a recent login.
      // We force a re-authentication here to ensure the session is fresh.
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (reauthError) {
        console.error('Re-authentication failed:', reauthError);
        addToast('Authentication Required', 'Please sign in again to verify your identity.', 'achievement');
        return;
      }

      // 1. Delete Firestore data (while we still have the auth token)
      await deleteDoc(doc(db, 'users', firebaseUser.uid));
      await deleteDoc(doc(db, 'users_public', firebaseUser.uid));
      
      const collections = ['food_logs', 'weight_logs', 'water_logs', 'reminders'];
      for (const coll of collections) {
        const q = query(collection(db, 'users', firebaseUser.uid, coll));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }

      // 2. Delete Auth account
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
      }

      setShowDeleteConfirm(false);
      setCurrentView('dashboard');
      addToast('Account Deleted', 'Your data has been permanently removed.', 'achievement');
    } catch (error: any) {
      console.error('Delete account error:', error);
      handleFirestoreError(error, OperationType.DELETE, `users/${firebaseUser.uid}`);
    }
  };

  const handleWaterLog = async (amount: number) => {
    if (!firebaseUser) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await addDoc(collection(db, 'users', firebaseUser.uid, 'water_logs'), {
        amount_ml: amount,
        logged_at: today,
        created_at: new Date().toISOString()
      });
      addToast('Hydration Logged', `Added ${amount}ml of water.`, 'water');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}/water_logs`);
    }
  };

  const handleSaveReminders = async () => {
    if (!firebaseUser) return;
    try {
      const batch = reminders.map(r => {
        const reminderId = r.reminder_type; // Use type as ID for simplicity
        return setDoc(doc(db, 'users', firebaseUser.uid, 'reminders', reminderId), r);
      });
      await Promise.all(batch);
      addToast('Preferences Saved', 'Your daily reminders have been updated.', 'achievement');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}/reminders`);
    }
  };

  const updateReminder = (type: string, time: string) => {
    setReminders(prev => {
      const existing = prev.find(r => r.reminder_type === type);
      if (existing) {
        return prev.map(r => r.reminder_type === type ? { ...r, reminder_time: time } : r);
      }
      return [...prev, { reminder_type: type, reminder_time: time, is_enabled: 1 }];
    });
  };

  if (showSplash || !isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8">
            <Activity className="text-black w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2">NutriForge</h1>
          <p className="text-white/40 font-medium tracking-widest uppercase text-xs">Forging your health journey</p>
          
          <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-emerald-500"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!firebaseUser && !isGuestOnboarding) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-2xl text-center"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 mx-auto">
            <Activity className="text-black w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Forge Your Health</h1>
          <p className="text-white/40 mb-12">The ultimate AI-powered nutrition and fitness companion.</p>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => setIsGuestOnboarding(true)}
              className="w-full bg-emerald-500 text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Target className="w-5 h-5" />
              Get Started
            </button>

            <button 
              onClick={handleLogin}
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Sign In with Google
            </button>
          </div>
          
          <p className="mt-8 text-xs text-white/20 uppercase tracking-widest font-bold">
            Sync across all your devices
          </p>
        </motion.div>
      </div>
    );
  }

  if (isGuestOnboarding && !firebaseUser) {
    return <Onboarding onComplete={() => setIsGuestOnboarding(false)} />;
  }

  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      );
    }
    return <Onboarding onComplete={() => {}} />;
  }

  const totals = logs.reduce((acc, log) => ({
    calories: acc.calories + (Number(log.calories) || 0),
    protein: acc.protein + (Number(log.protein) || 0),
    carbs: acc.carbs + (Number(log.carbs) || 0),
    fat: acc.fat + (Number(log.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const calorieProgress = user.daily_target > 0 
    ? Math.min((totals.calories / user.daily_target) * 100, 100) 
    : 0;
  const remainingCalories = Math.max((user.daily_target || 0) - totals.calories, 0);

  const macroData = [
    { name: 'Protein', value: totals.protein || 0, color: '#10b981' },
    { name: 'Carbs', value: totals.carbs || 0, color: '#3b82f6' },
    { name: 'Fat', value: totals.fat || 0, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <NotificationToast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-black w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">NutriForge</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={cn("transition-colors", currentView === 'dashboard' ? "text-white" : "hover:text-white")}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('meals')}
                className={cn("transition-colors", currentView === 'meals' ? "text-white" : "hover:text-white")}
              >
                Meals
              </button>
              <button 
                onClick={() => setCurrentView('analytics')}
                className={cn("transition-colors", currentView === 'analytics' ? "text-white" : "hover:text-white")}
              >
                Analytics
              </button>
              <button 
                onClick={() => setCurrentView('community')}
                className={cn("transition-colors", currentView === 'community' ? "text-white" : "hover:text-white")}
              >
                Community
              </button>
              <button 
                onClick={() => setCurrentView('ai-coach')}
                className={cn("transition-colors flex items-center gap-2", currentView === 'ai-coach' ? "text-emerald-500" : "hover:text-white")}
              >
                <Sparkles className="w-4 h-4" />
                AI Coach
              </button>
            </div>
            <button 
              onClick={() => setCurrentView('settings')}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-colors"
            >
              <UserIcon className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              
              {/* Left Column: Summary */}
              <div className="lg:col-span-8 space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div 
                    onClick={() => setCurrentView('settings')}
                    className="cursor-pointer group"
                  >
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {user.name}</h1>
                    <p className="text-white/40 group-hover:text-emerald-500 transition-colors">
                      You're on track to reach {user.target_weight}kg in {
                        user.target_duration >= 4 
                          ? `${Math.round(user.target_duration / 4)} months` 
                          : `${user.target_duration} weeks`
                      }.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Day {streak} Streak
                    </div>
                  </div>
                </header>

                <motion.button 
                  onClick={() => setCurrentView('ai-coach')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Sparkles className="text-black w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-500">AI Coach Insight Available</p>
                      <p className="text-xs text-white/40">Get personalized tips based on today's progress</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Calorie Progress Card */}
                  <div className="md:col-span-2 bg-white/5 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32" />
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-12">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-white/5"
                          />
                          <motion.circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={553}
                            initial={{ strokeDashoffset: 553 }}
                            animate={{ strokeDashoffset: 553 - (553 * calorieProgress) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                            fill="transparent"
                            className="text-emerald-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold">{Math.round(totals.calories)}</span>
                          <span className="text-white/40 text-sm font-medium uppercase tracking-widest">kcal</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold">Daily Goal</h3>
                          <p className="text-white/40">Target: {Math.round(user.daily_target)} kcal</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Remaining</p>
                            <p className="text-xl font-bold text-emerald-500">{Math.round(remainingCalories)}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Burned</p>
                            <p className="text-xl font-bold text-blue-500">420</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Macro Distribution Card */}
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 flex flex-col items-center justify-center">
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-3 mt-4">
                      {macroData.map((macro) => (
                        <div key={macro.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: macro.color }} />
                            <span className="text-white/60">{macro.name}</span>
                          </div>
                          <span className="font-bold">{Math.round(macro.value)}g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Water & Badges Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Water Tracker */}
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="font-bold">Water Intake</h3>
                      </div>
                      <span className="text-sm font-bold text-blue-500">{waterTotal}ml / 3000ml</span>
                    </div>
                    
                    <div className="relative h-32 bg-white/5 rounded-2xl overflow-hidden mb-6 border border-white/5">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min((waterTotal / 3000) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute bottom-0 left-0 right-0 bg-blue-500/20 backdrop-blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Droplets className={cn("w-12 h-12 transition-colors", waterTotal > 0 ? "text-blue-500" : "text-white/10")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[250, 500, 750].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => handleWaterLog(amount)}
                          className="py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold hover:bg-blue-500 hover:text-black transition-all"
                        >
                          +{amount}ml
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                          <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="font-bold">Achievements</h3>
                      </div>
                      <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{badges.length} Earned</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {['streak', 'goal', 'water', 'macro'].map((type, i) => {
                        const earned = badges.some(b => b.badge_type === type) || i < 2; // Mock some earned
                        return (
                          <div 
                            key={type}
                            className={cn(
                              "aspect-square rounded-2xl flex items-center justify-center border transition-all",
                              earned ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-white/5 border-white/5 text-white/10"
                            )}
                          >
                            <Award className="w-6 h-6" />
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-6 text-xs text-white/40 text-center">Keep logging to unlock more badges!</p>
                  </div>
                </div>

                {/* Weight Progress Chart */}
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold">Weight Progress</h3>
                      <p className="text-sm text-white/40">Tracking your journey to {user.target_weight}kg</p>
                    </div>
                    <button className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <TrendingUp className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightHistory}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="logged_at" 
                          stroke="#ffffff20" 
                          fontSize={12}
                          tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#ffffff20" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#151515', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorWeight)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions & Logs */}
              <div className="lg:col-span-4 space-y-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setActiveMeal('breakfast');
                      setShowSearch(true);
                    }}
                    className="group bg-emerald-500 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <Plus className="text-black w-6 h-6" />
                    </div>
                    <span className="text-black font-bold">Log Food</span>
                  </button>
                  <button 
                    onClick={() => setShowWeightModal(true)}
                    className="group bg-white/5 p-6 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Scale className="text-white w-6 h-6" />
                    </div>
                    <span className="font-bold">Log Weight</span>
                  </button>
                </div>

                {/* Meal Logs */}
                <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold">Today's Meals</h3>
                    <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Detailed</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => {
                      const mealLogs = logs.filter(l => l.meal_type === meal);
                      const mealCals = mealLogs.reduce((sum, l) => sum + l.calories, 0);
                      
                      return (
                        <div key={meal} className="p-6 hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <Utensils className="w-5 h-5 text-white/40" />
                              </div>
                              <div>
                                <h4 className="font-bold capitalize">{meal}</h4>
                                <p className="text-xs text-white/40">{mealLogs.length} items</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{Math.round(mealCals)}</p>
                              <p className="text-[10px] text-white/40 uppercase tracking-tighter">kcal</p>
                            </div>
                          </div>
                          {mealLogs.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {mealLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between text-xs text-white/60">
                                  <span>{log.food_name}</span>
                                  <span>{Math.round(log.calories)} kcal</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendations */}
                {remainingCalories > 0 && (
                  <div className="bg-emerald-500/10 rounded-[2rem] p-8 border border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <Award className="w-8 h-8 text-emerald-500/20" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-500 mb-2">Smart Suggestion</h3>
                    <p className="text-sm text-emerald-500/60 mb-6">
                      You still need {Math.round(remainingCalories)} kcal to hit your growth target.
                    </p>
                    <div className="space-y-3">
                      {[
                        { name: 'Peanut Butter Toast', cals: 320 },
                        { name: 'Protein Shake', cals: 240 },
                        { name: 'Greek Yogurt & Nuts', cals: 280 }
                      ].map(item => (
                        <div key={item.name} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-emerald-500/10">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs font-bold text-emerald-500">+{item.cals}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'meals' && <Meals key="meals" />}
          {currentView === 'analytics' && <Analytics key="analytics" />}
          {currentView === 'community' && <Community key="community" />}
          {currentView === 'ai-coach' && user && (
            <AICoach key="ai-coach" user={user} logs={logs} weightHistory={weightHistory} />
          )}
          {currentView === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h2 className="text-3xl font-bold">Settings</h2>
              
              {/* Profile Section */}
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <UserIcon className="text-black w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user?.name || 'User'}</h3>
                    <p className="text-white/40 text-sm">{firebaseUser?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>

              {/* Body Metrics */}
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Body Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-white/40 uppercase font-bold mb-1">Height</p>
                    <p className="text-2xl font-bold">{user.height} cm</p>
                  </div>
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-white/40 uppercase font-bold mb-1">Current Weight</p>
                    <p className="text-2xl font-bold">{user.current_weight} kg</p>
                  </div>
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-white/40 uppercase font-bold mb-1">BMI</p>
                    <p className="text-2xl font-bold text-emerald-500">{calculateBMI(user.current_weight, user.height)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Daily Reminders
                </h3>
                <div className="space-y-4">
                  {[
                    { type: 'breakfast', label: 'Breakfast' },
                    { type: 'lunch', label: 'Lunch' },
                    { type: 'dinner', label: 'Dinner' },
                    { type: 'water', label: 'Water' }
                  ].map(item => {
                    const reminder = reminders.find(r => r.reminder_type === item.type);
                    return (
                      <div key={item.type} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="font-medium">{item.label} Reminder</span>
                        <div className="flex items-center gap-4">
                          <input 
                            type="time" 
                            value={reminder?.reminder_time || '08:00'}
                            onChange={e => updateReminder(item.type, e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button 
                            onClick={() => {
                              const isEnabled = reminder ? !reminder.is_enabled : false;
                              setReminders(prev => {
                                const existing = prev.find(r => r.reminder_type === item.type);
                                if (existing) {
                                  return prev.map(r => r.reminder_type === item.type ? { ...r, is_enabled: isEnabled ? 1 : 0 } : r);
                                }
                                return [...prev, { reminder_type: item.type, reminder_time: '08:00', is_enabled: isEnabled ? 1 : 0 }];
                              });
                            }}
                            className={cn(
                              "w-12 h-6 rounded-full relative transition-colors",
                              reminder?.is_enabled ? "bg-emerald-500" : "bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                              reminder?.is_enabled ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button 
                  onClick={handleSaveReminders}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:scale-[1.01] transition-all"
                >
                  Save Preferences
                </button>
              </div>

              {/* Goal Settings */}
              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Goal Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Target Weight (kg)</label>
                    <input 
                      type="number"
                      value={user.target_weight}
                      onChange={async (e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          await updateDoc(doc(db, 'users', user.uid), { target_weight: val });
                        }
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold">
                      Duration ({user.target_duration >= 4 ? `${Math.round(user.target_duration / 4)} Months` : `${user.target_duration} Weeks`})
                    </label>
                    <input 
                      type="number"
                      value={user.target_duration}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          await updateDoc(doc(db, 'users', user.uid), { target_duration: val });
                        }
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-white/20">Enter total weeks (e.g., 12 for 3 months)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-red-500">
                  <LogOut className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-sm text-white/40">Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111] border border-red-500/20 w-full max-w-md rounded-[2.5rem] p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Are you sure?</h2>
              <p className="text-white/40 mb-10 leading-relaxed">
                This action is permanent and will delete all your logs, progress, and account data.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full py-5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all"
                >
                  Yes, Delete Everything
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-5 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <FoodSearch 
            onClose={() => setShowSearch(false)} 
            onLog={() => {}}
            mealType={activeMeal}
          />
        )}
      </AnimatePresence>

      {/* Weight Log Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <WeightLogModal 
            onClose={() => setShowWeightModal(false)} 
            onLog={() => {}}
            currentWeight={user.current_weight}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
