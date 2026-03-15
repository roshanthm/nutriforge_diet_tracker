import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { Calendar, TrendingUp, PieChart as PieChartIcon, Activity, Flame, Target } from 'lucide-react';
import { auth, db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

export default function Analytics() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'food_logs'),
      where('logged_at', '>=', dateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(d => d.data());
      
      // Aggregate by date
      const aggregated: Record<string, any> = {};
      logsData.forEach((log: any) => {
        const date = log.logged_at;
        if (!aggregated[date]) {
          aggregated[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        aggregated[date].calories += Number(log.calories) || 0;
        aggregated[date].protein += Number(log.protein) || 0;
        aggregated[date].carbs += Number(log.carbs) || 0;
        aggregated[date].fat += Number(log.fat) || 0;
      });

      const sortedData = Object.values(aggregated).sort((a: any, b: any) => a.date.localeCompare(b.date));
      setReportData(sortedData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/food_logs`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Emerald, Blue, Amber

  // Aggregate macros for the pie chart
  const totalMacros = reportData.reduce((acc, day) => ({
    protein: acc.protein + (Number(day.protein) || 0),
    carbs: acc.carbs + (Number(day.carbs) || 0),
    fat: acc.fat + (Number(day.fat) || 0),
  }), { protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: totalMacros.protein || 0 },
    { name: 'Carbs', value: totalMacros.carbs || 0 },
    { name: 'Fat', value: totalMacros.fat || 0 },
  ];

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
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold">Weekly Analytics</h2>
          <p className="text-white/40">Your performance over the last 7 days</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">Last 7 Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calorie Trend */}
        <div className="lg:col-span-2 bg-white/5 rounded-[2rem] p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-500" />
              Calorie Intake Trend
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20" 
                  fontSize={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis stroke="#ffffff20" fontSize={10} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro Distribution */}
        <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-500" />
            Macro Balance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151515', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {macroData.map((macro, i) => (
              <div key={macro.name} className="flex items-center justify-between text-sm">
                <span className="text-white/40">{macro.name}</span>
                <span className="font-bold">{Math.round(macro.value)}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Summary Cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-white/40 mb-1">Avg. Daily Calories</p>
            <p className="text-3xl font-bold">
              {Math.round(reportData.reduce((acc, d) => acc + d.calories, 0) / (reportData.length || 1))}
            </p>
          </div>
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-white/40 mb-1">Goal Consistency</p>
            <p className="text-3xl font-bold">85%</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 overflow-hidden">
          <h3 className="text-xl font-bold mb-6">Daily Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-bottom border-white/5">
                  <th className="pb-4 text-xs font-bold text-white/20 uppercase tracking-widest">Date</th>
                  <th className="pb-4 text-xs font-bold text-white/20 uppercase tracking-widest">Kcal</th>
                  <th className="pb-4 text-xs font-bold text-white/20 uppercase tracking-widest">P</th>
                  <th className="pb-4 text-xs font-bold text-white/20 uppercase tracking-widest">C</th>
                  <th className="pb-4 text-xs font-bold text-white/20 uppercase tracking-widest">F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.map((day) => (
                  <tr key={day.date} className="group">
                    <td className="py-4 text-sm font-medium">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 text-sm font-bold text-emerald-500">{Math.round(day.calories)}</td>
                    <td className="py-4 text-sm text-white/60">{Math.round(day.protein)}g</td>
                    <td className="py-4 text-sm text-white/60">{Math.round(day.carbs)}g</td>
                    <td className="py-4 text-sm text-white/60">{Math.round(day.fat)}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
