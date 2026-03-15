import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Loader2, Info, ChevronRight, Utensils } from 'lucide-react';
import { FoodSearchResult } from '@/src/types';
import { auth, db, collection, addDoc, getDocs, query, where, handleFirestoreError, OperationType } from '../firebase';

const KERALA_FOODS: FoodSearchResult[] = [
  { id: 'kf_1', name: 'Egg Puffs (Motta Puffs)', calories: 280, protein: 8, carbs: 25, fat: 16, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_2', name: 'Chicken Puffs', calories: 320, protein: 12, carbs: 28, fat: 18, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_3', name: 'Meat Puffs', calories: 350, protein: 14, carbs: 28, fat: 20, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_4', name: 'Veg Cutlet', calories: 150, protein: 3, carbs: 20, fat: 7, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_5', name: 'Chicken Cutlet', calories: 180, protein: 8, carbs: 15, fat: 10, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_6', name: 'Beef Cutlet', calories: 200, protein: 10, carbs: 15, fat: 12, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_7', name: 'Uzhunnu Vada', calories: 120, protein: 4, carbs: 16, fat: 5, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_8', name: 'Samosa', calories: 250, protein: 4, carbs: 24, fat: 15, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_9', name: 'Pazham Pori (Banana Fritters)', calories: 250, protein: 2, carbs: 40, fat: 10, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_10', name: 'Sweetna (Sweet Parotta)', calories: 350, protein: 5, carbs: 50, fat: 15, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_11', name: 'Vettu Cake', calories: 220, protein: 4, carbs: 35, fat: 8, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_12', name: 'Dilkush', calories: 300, protein: 5, carbs: 45, fat: 12, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_13', name: 'Coconut Buns', calories: 260, protein: 4, carbs: 40, fat: 10, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_14', name: 'Kottayam Churuttu', calories: 180, protein: 2, carbs: 30, fat: 6, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_15', name: 'Ghee Cake', calories: 380, protein: 5, carbs: 40, fat: 22, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_16', name: 'Plum Cake', calories: 350, protein: 4, carbs: 55, fat: 14, brand: 'Kerala Bakery', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_17', name: 'Appam', calories: 120, protein: 2, carbs: 25, fat: 1, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_18', name: 'Puttu', calories: 150, protein: 3, carbs: 32, fat: 1, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_19', name: 'Kadala Curry', calories: 180, protein: 8, carbs: 20, fat: 8, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_20', name: 'Idiyappam', calories: 110, protein: 2, carbs: 24, fat: 1, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_21', name: 'Chicken Curry', calories: 220, protein: 18, carbs: 8, fat: 14, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_22', name: 'Fish Curry', calories: 160, protein: 15, carbs: 5, fat: 9, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_23', name: 'Beef Fry', calories: 320, protein: 22, carbs: 10, fat: 22, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_24', name: 'Parotta', calories: 280, protein: 5, carbs: 40, fat: 12, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_25', name: 'Chicken Biryani', calories: 450, protein: 20, carbs: 55, fat: 18, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_26', name: 'Vegetable Stew', calories: 140, protein: 3, carbs: 15, fat: 8, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_27', name: 'Avial', calories: 160, protein: 4, carbs: 18, fat: 9, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' },
  { id: 'kf_28', name: 'Sambar', calories: 110, protein: 4, carbs: 18, fat: 3, brand: 'Kerala Meals', servingSize: 100, servingUnit: 'g' }
];

interface FoodSearchProps {
  onClose: () => void;
  onLog: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

export default function FoodSearch({ onClose, onLog, mealType }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [grams, setGrams] = useState(100);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    servingSize: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query && !isAddingCustom) handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isAddingCustom]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const lowerQuery = query.toLowerCase();
      
      // 1. Search Local Kerala Foods
      const localResults = KERALA_FOODS.filter(food => 
        food.name.toLowerCase().includes(lowerQuery)
      );

      // 2. Search User Custom Foods
      let customResults: FoodSearchResult[] = [];
      if (auth.currentUser) {
        try {
          // We fetch all custom foods and filter client-side for simplicity and substring matching
          const customFoodsSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'custom_foods'));
          const allCustomFoods = customFoodsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              calories: data.calories,
              protein: data.protein,
              carbs: data.carbs,
              fat: data.fat,
              brand: 'Custom Food',
              servingSize: 100,
              servingUnit: 'g'
            } as FoodSearchResult;
          });
          customResults = allCustomFoods.filter(food => 
            food.name.toLowerCase().includes(lowerQuery)
          );
        } catch (err) {
          console.error('Error fetching custom foods:', err);
        }
      }

      // 3. Search API
      let apiResults: FoodSearchResult[] = [];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          apiResults = await res.json();
        } else {
          throw new Error("Backend not available or returned non-JSON");
        }
      } catch (err) {
        // Fallback for Vercel/Netlify where the Express backend isn't running
        try {
          const apiKey = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
          const usdaRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${apiKey}`);
          if (usdaRes.ok) {
            const data = await usdaRes.json();
            apiResults = data.foods.map((food: any) => {
              const getNutrient = (id: number) => food.foodNutrients.find((n: any) => n.nutrientId === id)?.value || 0;
              return {
                id: food.fdcId,
                name: food.description,
                brand: food.brandOwner,
                calories: getNutrient(1008),
                protein: getNutrient(1003),
                carbs: getNutrient(1005),
                fat: getNutrient(1004),
                servingSize: 100,
                servingUnit: 'g'
              };
            });
          }
        } catch (fallbackErr) {
          console.error('API Search error:', fallbackErr);
        }
      }

      // Combine and deduplicate by name
      const combined = [...localResults, ...customResults, ...apiResults];
      const uniqueResults = Array.from(new Map(combined.map(item => [item.name.toLowerCase(), item])).values());
      
      setResults(uniqueResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomFood = async () => {
    if (!auth.currentUser || !customFood.name.trim()) return;
    setLoading(true);
    try {
      const multiplier = 100 / customFood.servingSize;
      const normalizedFood = {
        name: customFood.name,
        calories: customFood.calories * multiplier,
        protein: customFood.protein * multiplier,
        carbs: customFood.carbs * multiplier,
        fat: customFood.fat * multiplier,
        created_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'custom_foods'), normalizedFood);
      
      const newFood: FoodSearchResult = {
        id: docRef.id,
        name: normalizedFood.name,
        calories: normalizedFood.calories,
        protein: normalizedFood.protein,
        carbs: normalizedFood.carbs,
        fat: normalizedFood.fat,
        brand: 'Custom Food',
        servingSize: 100,
        servingUnit: 'g'
      };
      
      setIsAddingCustom(false);
      setSelectedFood(newFood);
      setGrams(customFood.servingSize);
    } catch (err) {
      console.error('Add custom food error:', err);
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/custom_foods`);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!selectedFood || !auth.currentUser) return;

    const multiplier = grams / 100;
    const payload = {
      food_name: selectedFood.name,
      calories: selectedFood.calories * multiplier,
      protein: selectedFood.protein * multiplier,
      carbs: selectedFood.carbs * multiplier,
      fat: selectedFood.fat * multiplier,
      meal_type: mealType,
      grams: grams,
      logged_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'food_logs'), payload);
      onLog();
      onClose();
    } catch (err) {
      console.error('Log error:', err);
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/food_logs`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col h-[95vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Add to {mealType}</h2>
            <p className="text-white/40 text-xs sm:text-sm">Search thousands of foods</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-8 pb-2 sm:pb-4">
          <div className="relative">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
            <input
              autoFocus
              type="text"
              placeholder="Search for pizza, chicken..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 pl-12 sm:pl-16 pr-6 text-base sm:text-lg font-medium focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {loading && (
              <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-0 space-y-3">
          {isAddingCustom ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Add Custom Food</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Food Name</label>
                  <input
                    type="text"
                    value={customFood.name}
                    onChange={e => setCustomFood({ ...customFood, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Homemade Appam"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Serving Size (g)</label>
                    <input
                      type="number"
                      value={isNaN(customFood.servingSize) ? '' : customFood.servingSize}
                      onChange={e => setCustomFood({ ...customFood, servingSize: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Calories (kcal)</label>
                    <input
                      type="number"
                      value={isNaN(customFood.calories) ? '' : customFood.calories}
                      onChange={e => setCustomFood({ ...customFood, calories: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Protein (g)</label>
                    <input
                      type="number"
                      value={isNaN(customFood.protein) ? '' : customFood.protein}
                      onChange={e => setCustomFood({ ...customFood, protein: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Carbs (g)</label>
                    <input
                      type="number"
                      value={isNaN(customFood.carbs) ? '' : customFood.carbs}
                      onChange={e => setCustomFood({ ...customFood, carbs: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Fat (g)</label>
                    <input
                      type="number"
                      value={isNaN(customFood.fat) ? '' : customFood.fat}
                      onChange={e => setCustomFood({ ...customFood, fat: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsAddingCustom(false)}
                  className="flex-1 bg-white/5 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomFood}
                  disabled={!customFood.name.trim() || loading}
                  className="flex-1 bg-emerald-500 text-black py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </motion.div>
          ) : selectedFood ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-8"
            >
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 sm:p-8 rounded-2xl sm:rounded-3xl">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{selectedFood.name}</h3>
                    <p className="text-xs sm:text-sm text-white/40">{selectedFood.brand || 'Generic Food'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
                  <div className="bg-black/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tighter mb-1">Cals</p>
                    <p className="text-sm sm:text-lg font-bold">{Math.round(selectedFood.calories * (grams/100))}</p>
                  </div>
                  <div className="bg-black/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tighter mb-1">Prot</p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-500">{Math.round(selectedFood.protein * (grams/100))}g</p>
                  </div>
                  <div className="bg-black/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tighter mb-1">Carb</p>
                    <p className="text-sm sm:text-lg font-bold text-blue-500">{Math.round(selectedFood.carbs * (grams/100))}g</p>
                  </div>
                  <div className="bg-black/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tighter mb-1">Fat</p>
                    <p className="text-sm sm:text-lg font-bold text-amber-500">{Math.round(selectedFood.fat * (grams/100))}g</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-4">
                  <label className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">Serving Size (grams)</label>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={isNaN(grams) ? 100 : grams}
                      onChange={e => setGrams(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <div className="w-16 sm:w-24 bg-black/40 border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center font-bold text-sm sm:text-base">
                      {grams}g
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLog}
                className="w-full bg-emerald-500 text-black py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                Log to {mealType}
              </button>
            </motion.div>
          ) : (
            results.map(food => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="w-full flex items-center justify-between p-4 sm:p-6 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors shrink-0">
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white/20 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-sm sm:text-base line-clamp-1 break-all">{food.name}</h4>
                    <p className="text-[10px] sm:text-xs text-white/40 truncate">{food.brand || 'Generic'} • 100g</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-sm sm:text-base">{Math.round(food.calories)}</p>
                    <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest">kcal</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>
            ))
          )}

          {!loading && query && results.length === 0 && !isAddingCustom && (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 mb-6">Food not found in database. Add it manually.</p>
              <button
                onClick={() => {
                  setCustomFood(prev => ({ ...prev, name: query }));
                  setIsAddingCustom(true);
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Custom Food
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
