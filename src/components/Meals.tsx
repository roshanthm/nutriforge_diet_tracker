import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Trash2, Utensils, Coffee, Sun, Moon, Info } from 'lucide-react';
import FoodSearch from './FoodSearch';
import { cn } from '@/src/lib/utils';
import { auth, db, collection, query, where, onSnapshot, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';

interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  grams: number;
  logged_at: string;
}

export default function Meals() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'food_logs'),
      where('logged_at', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/food_logs`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteLog = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'food_logs', id));
    } catch (error) {
      console.error('Failed to delete log:', error);
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser?.uid}/food_logs/${id}`);
    }
  };

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-500' },
    { id: 'lunch', label: 'Lunch', icon: Sun, color: 'text-emerald-500' },
    { id: 'dinner', label: 'Dinner', icon: Moon, color: 'text-blue-500' },
    { id: 'snacks', label: 'Snacks', icon: Utensils, color: 'text-purple-500' },
  ];

  const getMealLogs = (type: string) => logs.filter(log => log.meal_type === type);

  const calculateMealTotal = (type: string) => {
    return getMealLogs(type).reduce((acc, log) => acc + log.calories, 0);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Meal Planner</h2>
          <p className="text-white/40">Track your daily nutrition intake</p>
        </div>
        <button 
          onClick={() => {
            setSelectedMealType('breakfast');
            setShowSearch(true);
          }}
          className="bg-emerald-500 text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Food
        </button>
      </div>

      <div className="space-y-6">
        {mealTypes.map((meal) => (
          <div key={meal.id} className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-white/5", meal.color)}>
                  <meal.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{meal.label}</h3>
                  <p className="text-xs text-white/40">{getMealLogs(meal.id).length} items logged</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{Math.round(calculateMealTotal(meal.id))} kcal</p>
                <button 
                  onClick={() => {
                    setSelectedMealType(meal.id);
                    setShowSearch(true);
                  }}
                  className="text-xs text-emerald-500 font-bold hover:underline"
                >
                  + Add to {meal.label}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {getMealLogs(meal.id).length === 0 ? (
                <div className="py-8 text-center text-white/20 text-sm italic">
                  No items logged for {meal.label.toLowerCase()}
                </div>
              ) : (
                getMealLogs(meal.id).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white/20" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{log.food_name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                          <span>{log.grams}g</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>P: {Math.round(log.protein)}g</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>C: {Math.round(log.carbs)}g</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span>F: {Math.round(log.fat)}g</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm">{Math.round(log.calories)} kcal</span>
                      <button 
                        onClick={() => deleteLog(log.id)}
                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Add Food to {selectedMealType}</h3>
                  <button onClick={() => setShowSearch(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <FoodSearch 
                  onClose={() => setShowSearch(false)}
                  onLog={() => {
                    setShowSearch(false);
                  }} 
                  mealType={selectedMealType as any}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
