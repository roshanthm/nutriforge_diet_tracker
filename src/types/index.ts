export interface User {
  uid: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  current_weight: number;
  target_weight: number;
  target_duration: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
  gym_frequency: number;
  diet_preference: string;
  bmr: number;
  maintenance_calories: number;
  daily_target: number;
}

export interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  grams: number;
  logged_at: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
}

export interface FoodSearchResult {
  id: number | string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
}
