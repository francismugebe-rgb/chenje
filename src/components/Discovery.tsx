import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MapPin, MessageCircle, X, ChevronRight, Menu, Filter, Bell, Home, Search, LogOut, User as UserIcon, Settings, ShieldCheck } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, getDocs, limit, onSnapshot, orderBy, 
  doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { UserProfile } from '../types';
import { useAuth } from '../AuthContext';

const ProfileCard = ({ profile, onClick }: { profile: UserProfile; onClick: () => void }) => {
  return (
    <motion.div
      layoutId={`card-${profile.uid}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.05 }}
      className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg shadow-rose-900/5 border border-white aspect-[3/4.5]"
      onClick={onClick}
    >
      <img
        src={profile.photos?.[0] || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400&h=600'}
        alt={profile.firstName}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white z-20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm md:text-base font-bold tracking-tight truncate">{profile.firstName} {profile.lastName}, {profile.age}</h3>
            <span className="shrink-0 w-2 h-2 bg-green-400 rounded-full border border-white" />
          </div>
          <p className="text-[10px] text-white/80 flex items-center gap-1 font-medium truncate">
            <MapPin size={10} className="text-rose-400 shrink-0" />
            {profile.location}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileDetails = ({ profile, onClose, onMatch }: { profile: UserProfile; onClose: () => void; onMatch: (matchId: string) => void }) => {
  const { profile: myProfile } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    if (myProfile?.premiumTier !== 'free' || myProfile?.uid === profile.uid) {
      fetchWhatsapp();
    }
  }, [myProfile]);

  const fetchWhatsapp = async () => {
    try {
      const snap = await getDoc(doc(db, 'whatsappNumbers', profile.uid));
      if (snap.exists()) {
        setWhatsapp(snap.data().number);
      }
    } catch (err) {
      console.log("Premium required for WhatsApp");
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser || !myProfile) return;
    setIsLiking(true);
    try {
      const likeId = `${auth.currentUser.uid}_${profile.uid}`;
      await setDoc(doc(db, 'likes', likeId), {
        from: auth.currentUser.uid,
        to: profile.uid,
        timestamp: serverTimestamp()
      });

      // Check for mutual like
      const mutualLikeId = `${profile.uid}_${auth.currentUser.uid}`;
      const mutualSnap = await getDoc(doc(db, 'likes', mutualLikeId));
      
      if (mutualSnap.exists()) {
        const matchId = [auth.currentUser.uid, profile.uid].sort().join('_');
        await setDoc(doc(db, 'matches', matchId), {
          id: matchId,
          users: [auth.currentUser.uid, profile.uid],
          timestamp: serverTimestamp(),
          messageCount: {
            [auth.currentUser.uid]: 0,
            [profile.uid]: 0
          },
          unreadCount: {
            [auth.currentUser.uid]: 0,
            [profile.uid]: 0
          }
        });
        onMatch(matchId);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
    setIsLiking(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-rose-950/20 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${profile.uid}`}
        className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden relative shadow-2xl border border-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-20 p-3 bg-white/90 hover:bg-rose-50 text-gray-800 rounded-full transition-all shadow-lg shadow-rose-900/10"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          <div className="lg:w-1/2 relative h-[450px] lg:h-auto overflow-hidden">
             <img
              src={profile.photos?.[0]}
              alt={profile.firstName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-8 left-8 text-white lg:hidden">
               <h2 className="text-4xl font-black tracking-tight">{profile.firstName} {profile.lastName}, {profile.age}</h2>
               <p className="text-lg opacity-90 flex items-center gap-2 mt-2">
                 <MapPin size={20} className="text-rose-400" />
                 {profile.location}
               </p>
            </div>
          </div>

          <div className="lg:w-1/2 p-10 lg:p-20 space-y-8 flex flex-col justify-center bg-white overflow-y-auto">
            <div className="hidden lg:block">
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black tracking-tighter text-gray-900">{profile.firstName} {profile.lastName}, {profile.age}</h2>
                <div className="w-3 h-3 bg-green-500 rounded-full border-4 border-rose-50 shadow-sm" />
              </div>
              <p className="text-xl text-rose-500 font-semibold flex items-center gap-3 mt-4">
                <MapPin size={22} />
                {profile.location}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400/80">The Story</h3>
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                {profile.bio || "This user hasn't written a bio yet."}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400/80">Passions</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests?.map(interest => (
                  <span key={interest} className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] text-rose-600 font-black uppercase tracking-widest hover:bg-rose-100 transition-colors shadow-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400/80">WhatsApp</h3>
              {whatsapp ? (
                <a 
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 font-bold hover:bg-green-100 transition-all shadow-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6" alt="WA" />
                  {whatsapp}
                </a>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group cursor-help">
                  <div className="flex items-center gap-3 text-gray-400 font-bold blur-[2px] group-hover:blur-0 transition-all">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 grayscale" alt="WA" />
                    +XXXXXXXXXXX
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">Premium Required</span>
                </div>
              )}
            </div>

            <div className="pt-8 flex gap-4">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-70"
              >
                <Heart size={20} fill={isLiking ? "currentColor" : "white"} stroke="transparent" className={isLiking ? "animate-pulse" : ""} />
                {isLiking ? "Sending..." : "Interests Me"}
              </button>
              <button className="p-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all active:scale-95 shadow-lg shadow-rose-200">
                <MessageCircle size={24} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Discovery = ({ onEditProfile, onChat, onUpgrade, onAdmin }: { onEditProfile: () => void; onChat: () => void; onUpgrade: () => void; onAdmin: () => void }) => {
  const { profile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    if (profile) fetchProfiles();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [profile]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'user'),
        where('isBanned', '==', false),
        limit(50)
      );
      
      // Basic gender filter logic: Men look for Ladies, etc.
      // In a real app we'd use complex queries, here we'll filter on client for simplicity
      // and only if gender preference is explicitly set.
      
      const snap = await getDocs(q);
      let list = snap.docs.map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== profile?.uid);

      if (profile?.preferences?.genderPreference && profile.preferences.genderPreference !== 'any') {
        list = list.filter(u => u.gender === profile.preferences?.genderPreference);
      }
      
      setProfiles(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-rose-50 font-sans">
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-xl shadow-rose-900/5 py-4' : 'bg-transparent py-10'}`}>
        <div className="max-w-[1400px] mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-rose-200">
              <Heart size={20} fill="white" stroke="transparent" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-orange-500 uppercase italic leading-none">BLOOM SITE</span>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-rose-300 mt-0.5">Powered by Google AI</span>
            </div>
            {isAdmin && (
              <button 
                onClick={onAdmin}
                className="ml-4 p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all flex items-center gap-2 shadow-lg shadow-rose-200 hover:scale-105 active:scale-95"
                title="Admin Dashboard (Backend)"
              >
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin Backend</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-14 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/80">
            <a href="#" className="text-rose-500 border-b-2 border-rose-500 pb-1">Discover</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Matches</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Messaging</a>
          </div>

          <div className="flex items-center gap-6">
             <button className="p-3 bg-white rounded-full text-rose-500 shadow-lg shadow-rose-900/5 hover:bg-rose-50 transition-all relative group">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white" />
             </button>
             <div className="w-10 h-10 rounded-xl bg-slate-200 border-2 border-white shadow-xl overflow-hidden cursor-pointer" onClick={onEditProfile}>
                <img src={profile?.photos?.[0] || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100'} alt="Avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-40 px-6 md:px-10 max-w-[1400px] mx-auto">
        <div className="mb-12 flex flex-wrap items-center gap-3">
          <button className="px-6 py-2.5 bg-white rounded-full shadow-lg shadow-rose-900/5 border border-rose-100 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-all">Ages 18 - 35</button>
          <button className="px-6 py-2.5 bg-rose-500 rounded-full shadow-xl shadow-rose-200 text-[10px] font-black text-white uppercase tracking-widest hover:bg-rose-600 transition-all">Nearby (50mi)</button>
          <button className="px-6 py-2.5 bg-white rounded-full shadow-lg shadow-rose-900/5 border border-rose-100 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-rose-50 transition-all">Verified Only</button>
          <button className="px-6 py-2.5 bg-white rounded-full shadow-lg shadow-rose-900/5 border border-rose-100 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2">
            <Filter size={14} /> Filters
          </button>
          
          <div className="ml-auto hidden xl:flex items-center gap-3">
             <span className="text-[10px] font-black text-rose-300 uppercase tracking-[0.3em]">Sorted by</span>
             <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest cursor-pointer hover:text-rose-500 transition-colors">Recent Activity</span>
          </div>
        </div>

        {loading ? (
             <div className="flex justify-center items-center py-40">
                <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
             </div>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 md:gap-6">
            {profiles.map((p, i) => (
              <motion.div
                key={p.uid}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProfileCard 
                  profile={p} 
                  onClick={() => setSelectedProfile(p)} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

       {/* Floating Action Bar */}
       <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/90 backdrop-blur-3xl px-10 py-5 rounded-full shadow-[0_32px_64px_-12px_rgba(225,29,72,0.15)] border border-rose-100/50 gap-12">
        <button className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-colors">
          <Home size={22} />
          <span className="text-[8px] uppercase font-black tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-rose-500 group">
          <Heart size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
          <span className="text-[8px] uppercase font-black tracking-widest">BLOOM SITE</span>
        </button>
        <div className="h-8 w-px bg-rose-100/80" />
        <button onClick={onChat} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-colors">
          <MessageCircle size={22} />
          <span className="text-[8px] uppercase font-black tracking-widest">Chat</span>
        </button>
        <button onClick={onEditProfile} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-colors">
          <UserIcon size={22} />
          <span className="text-[8px] uppercase font-black tracking-widest">Profile</span>
        </button>
        {isAdmin && (
          <button onClick={onAdmin} className="flex flex-col items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors animate-pulse hover:animate-none">
            <ShieldCheck size={22} className="fill-rose-50" />
            <span className="text-[8px] uppercase font-black tracking-widest">Backend</span>
          </button>
        )}
      </div>

      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30">
        <button 
          onClick={onUpgrade}
          className="bg-white/80 backdrop-blur-xl border border-rose-100 px-6 py-2 rounded-full flex items-center gap-2 group animate-bounce hover:animate-none"
        >
          <div className="p-1 bg-gradient-to-r from-rose-500 to-orange-400 rounded-lg text-white shadow-lg shadow-rose-200">
            <Heart size={14} fill="currentColor" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:text-rose-500 transition-colors">Go Premium</span>
        </button>
      </div>

      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetails 
            profile={selectedProfile} 
            onClose={() => setSelectedProfile(null)} 
            onMatch={(id) => setMatchedId(id)}
          />
        )}

        {matchedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-rose-950/40 backdrop-blur-2xl"
          >
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-white text-center max-w-sm w-full">
              <div className="flex justify-center -space-x-4 mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
                  <img src={profile?.photos?.[0]} className="w-full h-full object-cover" />
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden translate-y-4">
                  <img src={selectedProfile?.photos?.[0]} className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter italic uppercase">It's a BLOOM SITE!</h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-10">You both matched with each other.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setMatchedId(null);
                    onChat();
                  }}
                  className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-3xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-rose-200"
                >
                  Start Messaging
                </button>
                <button 
                  onClick={() => setMatchedId(null)}
                  className="w-full py-4 text-[10px] font-black text-rose-300 uppercase tracking-widest hover:text-rose-500"
                >
                  Keep Browsing
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
