import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Match, UserProfile } from '../types';
import { 
  ChevronLeft, Search, MoreVertical, MessageSquare, 
  Heart, Zap, Star, ShieldCheck, User as UserIcon, Crown
} from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export const Messaging = ({ onBack, onUpgrade, activeMatchId }: { onBack: () => void, onUpgrade: () => void, activeMatchId?: string | null }) => {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<(Match & { otherUser?: UserProfile })[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(activeMatchId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const matchData = await Promise.all(
        snap.docs.map(async (d) => {
          const match = d.data() as Match;
          const otherUserId = match.users.find(u => u !== user.uid);
          let otherUser;
          if (otherUserId) {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            otherUser = userSnap.data() as UserProfile;
          }
          return { ...match, otherUser };
        })
      );
      setMatches(matchData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (selectedMatch) {
    const match = matches.find(m => m.id === selectedMatch);
    return (
      <ChatWindow 
        matchId={selectedMatch} 
        otherUser={match?.otherUser} 
        onBack={() => setSelectedMatch(null)} 
        onUpgrade={onUpgrade}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
       <header className="fixed top-0 left-0 right-0 h-28 bg-white border-b border-rose-50 flex items-center px-6 md:px-10 z-40">
          <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-full text-rose-500 mr-4 md:mr-8 transition-all">
             <ChevronLeft size={24} />
          </button>
          
          <div className="flex-1">
             <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic italic">Connections</h1>
                <div className="bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">{matches.length}</div>
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Keep the spark alive</p>
          </div>

          <div className="flex items-center gap-4">
             <button className="p-3 bg-rose-50 text-rose-500 rounded-full">
                <Search size={20} />
             </button>
             <button className="p-3 text-gray-400">
                <MoreVertical size={20} />
             </button>
          </div>
       </header>

       <main className="pt-28 flex-1 overflow-y-auto">
          {matches.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center py-40 px-10 text-center">
                <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-300 mb-8 border border-rose-100 shadow-xl shadow-rose-200">
                   <Heart size={48} fill="currentColor" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide italic">No Sparks Yet</h3>
                <p className="text-xs text-gray-400 mt-3 max-w-[240px] leading-relaxed font-medium">Keep discovering and liking profiles. Your matches will appear here when they like you back!</p>
                <button 
                  onClick={onBack}
                  className="mt-10 px-8 py-3 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200"
                >
                  Start Discovering
                </button>
             </div>
          ) : (
            <div className="divide-y divide-rose-50">
               {matches.map((match) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ backgroundColor: '#fff1f2' }}
                    onClick={() => setSelectedMatch(match.id)}
                    className="p-6 md:p-8 flex items-center gap-6 cursor-pointer transition-colors relative group"
                  >
                     <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                        <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                           <img 
                            src={match.otherUser?.photos?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100'} 
                            className="w-full h-full object-cover" 
                           />
                        </div>
                        {match.otherUser?.isVerified && (
                           <div className="absolute -bottom-1 -right-1 p-1 bg-blue-500 text-white rounded-full border-2 border-white">
                              <ShieldCheck size={12} strokeWidth={3} />
                           </div>
                        )}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                           <h3 className="text-lg font-black text-gray-900 tracking-tight">{match.otherUser?.firstName} {match.otherUser?.lastName}</h3>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{match.lastMessageAt ? new Date(match.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-sm font-medium text-gray-500 truncate pr-8 italic">
                              {match.lastMessage || `You and ${match.otherUser?.firstName} are now Bloom companions!`}
                           </p>
                           {(match.unreadCount?.[user?.uid || ''] || 0) > 0 && (
                              <div className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black min-w-[20px] text-center shadow-lg shadow-rose-200">
                                 {match.unreadCount?.[user?.uid || '']}
                              </div>
                           )}
                        </div>
                     </div>
                     
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        <ChevronLeft className="rotate-180 text-rose-300" size={24} />
                     </div>
                  </motion.div>
               ))}
            </div>
          )}
       </main>

       {/* Premium Teaser */}
       <div className="p-8 bg-rose-50/50">
          <div className="bg-gradient-to-r from-rose-500 to-orange-400 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl shadow-rose-200">
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <Crown size={18} fill="white" />
                   <h4 className="text-sm font-black uppercase tracking-widest">Go Unlimited</h4>
                </div>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Chat without limits and view numbers</p>
             </div>
             <button 
                onClick={onUpgrade}
                className="bg-white text-rose-500 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl hover:scale-105 transition-all"
             >
                Upgrade
             </button>
          </div>
       </div>
    </div>
  );
};
