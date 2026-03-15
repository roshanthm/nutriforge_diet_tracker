import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, Check, Users, TrendingUp, X, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { auth, db, collection, query, where, onSnapshot, setDoc, updateDoc, doc, getDocs, getDoc, deleteDoc, handleFirestoreError, OperationType, orderBy, limit } from '../firebase';

export default function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [friendProgress, setFriendProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to friendships where current user is involved
    const q = query(
      collection(db, 'friendships'),
      where('user_ids', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendships = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // Clean up old friendships with random IDs
      for (const f of friendships) {
        if (!f.user_ids || f.user_ids.length !== 2) continue;
        const expectedId = [...f.user_ids].sort().join('_');
        if (f.id !== expectedId) {
          try {
            await deleteDoc(doc(db, 'friendships', f.id));
          } catch (e) {
            console.error('Cleanup failed', e);
          }
        }
      }

      // Fetch user details for each friend
      const friendsData = await Promise.all(friendships.map(async (f) => {
        const friendId = f.user_ids.find((id: string) => id !== auth.currentUser?.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users_public', friendId));
          return {
            id: f.id,
            friend_uid: friendId,
            name: userDoc.exists() ? userDoc.data().name : 'Unknown User',
            status: f.status,
            requester_id: f.requester_id
          };
        } catch (err) {
          console.error('Error fetching friend details:', err);
          return {
            id: f.id,
            friend_uid: friendId,
            name: 'Unknown User',
            status: f.status,
            requester_id: f.requester_id
          };
        }
      }));

      setFriends(friendsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendships');
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery || !auth.currentUser) return;
    setLoading(true);
    try {
      // Simple prefix search simulation in Firestore
      const q = query(
        collection(db, 'users_public'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => u.uid !== auth.currentUser?.uid);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (friendUid: string) => {
    if (!auth.currentUser) return;
    try {
      // Check if friendship already exists
      const q = query(
        collection(db, 'friendships'),
        where('user_ids', 'array-contains', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find(d => d.data().user_ids.includes(friendUid));
      
      if (existing) {
        alert('Friendship already exists or is pending.');
        return;
      }

      const friendshipId = [auth.currentUser.uid, friendUid].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        user_ids: [auth.currentUser.uid, friendUid],
        status: 'pending',
        requester_id: auth.currentUser.uid,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'friendships');
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `friendships/${friendshipId}`);
    }
  };

  const viewProgress = async (friend: any) => {
    setSelectedFriend(friend);
    setFriendProgress(null);
    try {
      const userDoc = await getDoc(doc(db, 'users', friend.friend_uid));
      const userData = userDoc.data();

      // Fetch today's calories
      const today = new Date().toISOString().split('T')[0];
      const logsQ = query(
        collection(db, 'users', friend.friend_uid, 'food_logs'),
        where('logged_at', '==', today)
      );
      const logsSnapshot = await getDocs(logsQ);
      const todayCalories = logsSnapshot.docs.reduce((acc, d) => acc + (d.data().calories || 0), 0);

      // Fetch weight history
      const weightQ = query(
        collection(db, 'users', friend.friend_uid, 'weight_logs'),
        orderBy('logged_at', 'desc'),
        limit(7)
      );
      const weightSnapshot = await getDocs(weightQ);
      const weightHistory = weightSnapshot.docs.map(d => d.data()).reverse();

      setFriendProgress({
        user: userData,
        todayCalories,
        weightHistory
      });
    } catch (error) {
      console.error('Failed to fetch friend progress:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Friends List */}
        <div className={cn("lg:col-span-4 space-y-6", selectedFriend ? "hidden lg:block" : "block")}>
          <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Friends
            </h3>
            
            <div className="space-y-4">
              {friends.length === 0 && (
                <p className="text-white/40 text-sm text-center py-8">No friends yet. Start searching!</p>
              )}
              {friends.map(friend => {
                const isAccepted = friend.status === 'accepted';
                const RowComponent = isAccepted ? 'button' : 'div';
                return (
                  <RowComponent 
                    key={friend.id} 
                    onClick={() => isAccepted && viewProgress(friend)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all text-left",
                      isAccepted ? "cursor-pointer hover:bg-white/10 hover:border-white/20" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 shrink-0">
                        {friend.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{friend.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{friend.status}</p>
                      </div>
                    </div>
                    
                    {isAccepted ? (
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-emerald-500 group-hover:text-black transition-all shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    ) : friend.status === 'pending' && friend.requester_id !== auth.currentUser?.uid ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptRequest(friend.id);
                        }}
                        className="p-2 bg-emerald-500 text-black rounded-lg hover:scale-105 transition-all shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/20 font-bold uppercase shrink-0">Waiting</span>
                    )}
                  </RowComponent>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6">Find Friends</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-3">
              {searchResults.map(user => (
                <div key={user.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-sm font-medium">{user.name}</span>
                  <button 
                    onClick={() => sendRequest(user.uid)}
                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Preview */}
        <div className={cn("lg:col-span-8", selectedFriend ? "block" : "hidden lg:block")}>
          <AnimatePresence mode="wait">
            {selectedFriend ? (
              <motion.div 
                key={selectedFriend.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 rounded-[2rem] p-4 sm:p-8 border border-white/10 h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 sm:p-8 flex gap-2">
                  <button 
                    onClick={() => setSelectedFriend(null)} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-sm font-bold lg:hidden"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setSelectedFriend(null)} 
                    className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden lg:block"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {friendProgress && friendProgress.user ? (
                  <div className="space-y-6 sm:space-y-8 mt-12 lg:mt-0">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500 flex items-center justify-center text-black text-2xl sm:text-3xl font-bold shrink-0">
                        {selectedFriend.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl sm:text-3xl font-bold truncate">{selectedFriend.name}'s Progress</h2>
                        <p className="text-white/40 text-sm">Goal: {friendProgress.user.target_weight}kg</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold mb-1">Current Weight</p>
                        <p className="text-2xl font-bold">{friendProgress.user.current_weight}kg</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold mb-1">Daily Target</p>
                        <p className="text-2xl font-bold">{Math.round(friendProgress.user.daily_target)} kcal</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold mb-1">Today's Intake</p>
                        <p className="text-2xl font-bold text-emerald-500">{Math.round(friendProgress.todayCalories)} kcal</p>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-3xl p-8 border border-white/5">
                      <h4 className="font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Weight Journey
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={friendProgress.weightHistory}>
                            <defs>
                              <linearGradient id="colorFriend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                              dataKey="logged_at" 
                              stroke="#ffffff20" 
                              fontSize={10}
                              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#ffffff20" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#151515', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            />
                            <Area type="monotone" dataKey="weight" stroke="#10b981" fill="url(#colorFriend)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-white/5 rounded-[2rem] border border-white/10 border-dashed flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Select a Friend</h3>
                <p className="text-white/40 max-w-xs">Click on the trend icon next to an accepted friend to see their progress journey.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
