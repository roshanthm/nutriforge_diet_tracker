import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Target, 
  Clock, 
  Dumbbell, 
  Utensils,
  LogIn,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { auth, db, doc, setDoc, handleFirestoreError, OperationType, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: 'male',
    height: 175,
    current_weight: 70,
    target_weight: 75,
    target_duration: 12,
    activity_level: 'moderate',
    gym_frequency: 4,
    diet_preference: 'non-vegetarian'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const [error, setError] = useState<string | null>(null);

  // Pre-fill name from Google if available
  React.useEffect(() => {
    if (auth.currentUser?.displayName && !formData.name) {
      setFormData(prev => ({ ...prev, name: auth.currentUser?.displayName || '' }));
    }
  }, [auth.currentUser]);

  const handleSubmit = async () => {
    setError(null);
    if (!auth.currentUser) {
      try {
        await signInWithPopup(auth, googleProvider);
        return;
      } catch (err: any) {
        console.error('Login error during onboarding:', err);
        if (err.code === 'auth/popup-closed-by-user') {
          // User closed the popup, just return
          return;
        }
        if (err.code === 'auth/unauthorized-domain') {
          setError('This domain is not authorized in Firebase. Please add this URL to your Firebase "Authorized domains".');
        } else {
          setError(err.message || 'Failed to sign in');
        }
        return;
      }
    }
    try {
      // BMR Calculation (Mifflin-St Jeor Equation)
      let bmr = 0;
      if (formData.gender === 'male') {
        bmr = 10 * formData.current_weight + 6.25 * formData.height - 5 * formData.age + 5;
      } else {
        bmr = 10 * formData.current_weight + 6.25 * formData.height - 5 * formData.age - 161;
      }

      // Activity Multipliers
      const multipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extra: 1.9
      };
      const maintenance = bmr * (multipliers[formData.activity_level] || 1.2);
      
      // Weight Gain Calculation (assuming surplus for gain, deficit for loss)
      const diff = formData.target_weight - formData.current_weight;
      const surplus = diff > 0 ? 500 : diff < 0 ? -500 : 0; 
      const daily_target = maintenance + surplus;

      const userData = {
        ...formData,
        uid: auth.currentUser.uid,
        bmr,
        maintenance_calories: maintenance,
        daily_target,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
      await setDoc(doc(db, 'users_public', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: formData.name
      });
      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}`);
    }
  };

  const steps = [
    {
      title: "What's your name?",
      subtitle: "Let's start with the basics.",
      content: (
        <div className="space-y-6">
          <input
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-2xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      )
    },
    {
      title: "Physical Stats",
      subtitle: "We need these to calculate your BMR.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Age</label>
            <input
              type="number"
            value={isNaN(formData.age) ? '' : formData.age}
            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Gender</label>
            <div className="flex gap-2">
              {['male', 'female'].map(g => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g as any })}
                  className={`flex-1 p-4 rounded-2xl border font-bold capitalize transition-all ${
                    formData.gender === g 
                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Height (cm)</label>
            <input
              type="number"
              value={isNaN(formData.height) ? '' : formData.height}
              onChange={e => setFormData({ ...formData, height: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Weight (kg)</label>
            <input
              type="number"
              value={isNaN(formData.current_weight) ? '' : formData.current_weight}
              onChange={e => setFormData({ ...formData, current_weight: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )
    },
    {
      title: "Your Goals",
      subtitle: "What are we aiming for?",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Target Weight (kg)</label>
            <input
              type="number"
              value={isNaN(formData.target_weight) ? '' : formData.target_weight}
              onChange={e => setFormData({ ...formData, target_weight: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">
              Duration ({formData.target_duration >= 4 ? `${Math.round(formData.target_duration / 4)} Months` : `${formData.target_duration} Weeks`})
            </label>
            <input
              type="number"
              value={isNaN(formData.target_duration) ? '' : formData.target_duration}
              onChange={e => setFormData({ ...formData, target_duration: parseInt(e.target.value) })}
              placeholder="Enter weeks"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-white/20">Enter total number of weeks (e.g., 12 for 3 months)</p>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Activity Level</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['sedentary', 'light', 'moderate', 'active', 'extra'].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, activity_level: level as any })}
                  className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    formData.activity_level === level 
                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: auth.currentUser ? "Ready to Forge?" : "Save Your Progress",
      subtitle: auth.currentUser 
        ? `Logged in as ${auth.currentUser.email}` 
        : "Link your Google account to access your data on any device.",
      content: (
        <div className="space-y-6">
          {auth.currentUser ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="text-black w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-lg">Account Linked</p>
                <p className="text-white/40 text-sm">Your data will be synced to {auth.currentUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Mail className="text-white/40 w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-lg">Sync with Google</p>
                  <p className="text-white/40 text-sm">Required to save your progress and access on other devices.</p>
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-white text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <LogIn className="w-5 h-5" />
                Connect Google Account
              </button>
              {error && (
                <p className="text-red-500 text-xs text-center mt-2 px-4">{error}</p>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  const currentStepData = steps[step - 1];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-black w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">NutriForge</span>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 md:p-16 backdrop-blur-xl"
        >
          <div className="mb-12">
            <div className="flex gap-2 mb-6">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i + 1 <= step ? 'w-8 bg-emerald-500' : 'w-4 bg-white/10'
                  }`} 
                />
              ))}
            </div>
            <h2 className="text-4xl font-bold mb-3">{currentStepData.title}</h2>
            <p className="text-white/40 text-lg">{currentStepData.subtitle}</p>
          </div>

          <div className="mb-12">
            {currentStepData.content}
          </div>

          <div className="flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : <div />}
            
            <button
              onClick={step === steps.length ? handleSubmit : nextStep}
              disabled={(step === 1 && !formData.name) || (step === steps.length && !auth.currentUser)}
              className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {step === steps.length ? 'Complete Setup' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
