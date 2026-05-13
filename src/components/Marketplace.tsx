import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, MapPin, Star, ShieldCheck, 
  MessageCircle, Loader2, X, ChevronRight,
  Briefcase, Award, Languages, DollarSign, Clock,
  ArrowRight, Phone, FileCheck, Send, User as UserIcon
} from 'lucide-react';
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, serverTimestamp, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, WorkerProfile, WORKER_CATEGORIES, Chat, Message } from '../types';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

export interface WorkerCardProps {
  key?: string;
  worker: User;
  profile: WorkerProfile;
  onClick: () => void;
}

export const WorkerCard = ({ worker, profile, onClick }: WorkerCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-[32px] overflow-hidden shadow-soft hover:shadow-trust transition-all border border-slate-100 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img 
          src={worker.photoURL || `https://ui-avatars.com/api/?name=${worker.firstName}+${worker.surname}&background=0D9488&color=fff`} 
          alt={worker.firstName} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {profile.isVerified && (
            <div className="flex items-center justify-center w-8 h-8 bg-brand-green text-white rounded-full shadow-lg" title="Verified Professional">
              <ShieldCheck size={18} />
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-4 h-10 w-10 bg-brand-gold rounded-full flex items-center justify-center text-white shadow-lg">
          <Star size={18} fill="currentColor" />
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-tight mb-1">{worker.firstName}<br />{worker.surname}</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-2 py-0.5 bg-brand-green/10 text-brand-green rounded text-[8px] font-black uppercase tracking-widest">
                {profile.category}
              </div>
              {profile.age && (
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{profile.age} Yrs Old</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 mt-3">
              <MapPin size={12} className="text-brand-green" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{worker.location || 'Zimbabwe'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
          <div className="text-center flex-1">
             <span className="block text-xs font-black text-slate-800 tracking-tighter">{profile.yearsExperience}+ Yrs</span>
             <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Exp</span>
          </div>
          <div className="w-px h-6 bg-slate-100" />
          <div className="text-center flex-1">
             <span className="block text-xs font-black text-slate-800 tracking-tighter">{Math.round(profile.rating)}</span>
             <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Rating</span>
          </div>
          <div className="w-px h-6 bg-slate-100" />
          <div className="text-center flex-1">
               <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-0.5 ${profile.availability === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
             <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">{profile.availability}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Marketplace = ({ onAuth }: { onAuth: () => void }) => {
  const { user, profile, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [workers, setWorkers] = useState<{ user: User; profile: WorkerProfile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<{ user: User; profile: WorkerProfile } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<WorkerProfile>>({});
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAvailability, setFilterAvailability] = useState<string>('All');
  const [filterExperience, setFilterExperience] = useState<number>(0);
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Messaging state
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isChatsListOpen, setIsChatsListOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  const { updateProfile } = useAuth();
  
  const [userProfileData, setUserProfileData] = useState<Partial<User>>({});

  useEffect(() => {
    if (profile) {
      setUserProfileData({
        firstName: profile.firstName,
        surname: profile.surname,
        phone: profile.phone,
        location: profile.location,
        photoURL: profile.photoURL
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchWorkers();
  }, [isAdmin]);

  useEffect(() => {
    if (!profile) return;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', profile.uid), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));
    });
    return () => unsubscribe();
  }, [profile]);

  const handleDeleteWorker = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this worker profile? This cannot be undone.')) return;
    
    try {
      await setDoc(doc(db, 'worker_profiles', uid), { ...selectedWorker?.profile, availability: 'Deleted' }, { merge: true });
      // In a real app we'd delete the doc, but for safety in this demo we might just mark as hidden/deleted 
      // or actually delete if rules allow. The user said delete.
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'worker_profiles', uid));
      await deleteDoc(doc(db, 'users', uid));
      
      setWorkers(prev => prev.filter(w => w.user.uid !== uid));
      setSelectedWorker(null);
      alert('Worker profile deleted successfully.');
    } catch (err) {
      console.error("Delete error:", err);
      alert('Failed to delete worker.');
    }
  };

  const handleUpdateWorker = async () => {
    if (!selectedWorker) return;
    try {
      await setDoc(doc(db, 'worker_profiles', selectedWorker.user.uid), {
        ...selectedWorker.profile,
        ...editData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setWorkers(prev => prev.map(w => 
        w.user.uid === selectedWorker.user.uid 
        ? { ...w, profile: { ...w.profile, ...editData } } 
        : w
      ));
      setSelectedWorker(prev => prev ? { ...prev, profile: { ...prev.profile, ...editData } } : null);
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      console.error("Update error:", err);
      alert('Failed to update worker.');
    }
  };

  const seedWorkers = async () => {
    if (!isAdmin) return;
    
    const firstNames = ['Zinhle', 'Thandi', 'Chiedza', 'Nomalanga', 'Blessing', 'Farai', 'Tatenda', 'Rudo', 'Nyasha', 'Takudzwa', 'Anesu', 'Kumbirai', 'Tariro', 'Tendai', 'Rutendo', 'Nomsa', 'Sipho', 'Bongani', 'Dumisani', 'Lovemore', 'Gift', 'Tinashe', 'Memory', 'Prosper'];
    const surnames = ['Mdluli', 'Dlamini', 'Moyo', 'Sibanda', 'Gumede', 'Katsande', 'Chidziva', 'Ncube', 'Ndlovu', 'Mpofu', 'Khumalo', 'Phiri', 'Banda', 'Maposa', 'Zhou', 'Shumba', 'Gumbo', 'Nyoni', 'Mutasa', 'Makoni'];
    const locations = ['Harare, Mt Pleasant', 'Bulawayo, Suburbs', 'Mutare, Chikanga', 'Harare, Avondale', 'Gweru, Mkoba', 'Harare, Borrowdale', 'Masvingo, Rujeko', 'Kwekwe, Mbizo', 'Harare, Mabelreign', 'Bulawayo, Hillside'];
    
    const bios = [
      'Hardworking and experienced in deep cleaning and laundry.',
      'Lover of children with first aid training. Reliable and patient.',
      'Specialist in traditional Zimbabwean and continental dishes.',
      'Passion for landscaping and organic vegetable gardening.',
      'Trained in property protection and emergency response.',
      'Professional driver with a clean license and defensive driving.',
      'Strong and efficient in all household tasks.',
      'Compassionate care for elderly and patients.',
      'Detail-oriented laundry specialist and ironer.',
      'Energetic helper who enjoys organizing and maintaining tidy spaces.'
    ];

    const photos = [
      'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1522529599102-193c0d7607b2?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1523910367623-6827e2db34a9?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=400&h=400'
    ];

    const fullBodyPhotos = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=900',
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600&h=900',
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=600&h=900'
    ];

    try {
      for (let i = 0; i < 50; i++) {
        const uid = `seed_worker_${i}`;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const photoURL = photos[i % photos.length];
        const category = WORKER_CATEGORIES[Math.floor(Math.random() * WORKER_CATEGORIES.length)];
        const bio = bios[Math.floor(Math.random() * bios.length)];

        await setDoc(doc(db, 'users', uid), {
          uid,
          firstName,
          surname,
          location,
          role: 'worker',
          photoURL,
          email: `${firstName.toLowerCase()}.${i}@homehelp.co.zw`,
          phone: `+26377${Math.floor(1000000 + Math.random() * 9000000)}`,
          whatsapp: `+26377${Math.floor(1000000 + Math.random() * 9000000)}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, 'worker_profiles', uid), {
          userId: uid,
          category,
          age: 20 + Math.floor(Math.random() * 35),
          gender: Math.random() > 0.3 ? 'female' : 'male',
          yearsExperience: 2 + Math.floor(Math.random() * 15),
          languages: ['English', 'Shona', Math.random() > 0.5 ? 'Ndebele' : 'Chewa'],
          skills: [category, 'Housekeeping', 'Punctuality'],
          availability: Math.random() > 0.2 ? 'Available' : 'Busy',
          bio,
          isVerified: Math.random() > 0.1,
          hasPoliceClearance: Math.random() > 0.1,
          workPhotos: [fullBodyPhotos[0], fullBodyPhotos[1]],
          rating: 4.0 + (Math.random() * 1.0),
          reviewCount: Math.floor(Math.random() * 50)
        });
      }
      fetchWorkers();
    } catch (err) {
      console.error("Seeding error:", err);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'worker_profiles'), limit(50));
      const snap = await getDocs(q);
      
      if (snap.empty && isAdmin) {
        await seedWorkers();
        return;
      }

      const workersList = await Promise.all(snap.docs.map(async (docSnap) => {
        const workerProfile = docSnap.data() as WorkerProfile;
        const userRef = doc(db, 'users', workerProfile.userId);
        const userSnap = await getDoc(userRef);
        return {
          user: userSnap.data() as User,
          profile: workerProfile
        };
      }));

      setWorkers(workersList);
    } catch (err) {
      console.error("Fetch workers error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle back button for overlays
  useEffect(() => {
    const handlePopState = () => {
      if (selectedWorker) setSelectedWorker(null);
      if (isMessagingOpen) setIsMessagingOpen(false);
      if (isProfileEditing) setIsProfileEditing(false);
      if (isChatsListOpen) setIsChatsListOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedWorker, isMessagingOpen, isProfileEditing, isChatsListOpen]);

  const openWorker = (w: { user: User; profile: WorkerProfile }) => {
    window.history.pushState({ type: 'overlay' }, '');
    setSelectedWorker(w);
  };

  const openMessaging = (chat: Chat) => {
    window.history.pushState({ type: 'overlay' }, '');
    setActiveChat(chat);
    setIsMessagingOpen(true);
  };

  const openProfileEditing = () => {
    window.history.pushState({ type: 'overlay' }, '');
    setIsProfileEditing(true);
  };

  const openChatsList = () => {
    window.history.pushState({ type: 'overlay' }, '');
    setIsChatsListOpen(true);
  };
  const filteredWorkers = workers.filter(w => {
    const matchesCategory = filterCategory === 'All' || w.profile.category === filterCategory;
    const matchesAvailability = filterAvailability === 'All' || w.profile.availability === filterAvailability;
    const matchesExperience = w.profile.yearsExperience >= filterExperience;
    const matchesRating = w.profile.rating >= filterMinRating;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = w.user.firstName.toLowerCase().includes(searchLower) || 
                          w.user.surname.toLowerCase().includes(searchLower) ||
                          w.user.location.toLowerCase().includes(searchLower) ||
                          w.profile.bio.toLowerCase().includes(searchLower) ||
                          w.profile.skills.some(s => s.toLowerCase().includes(searchLower));
                          
    return matchesCategory && matchesAvailability && matchesExperience && matchesRating && matchesSearch;
  });

  const handleStartChat = async (worker: User) => {
    if (!profile) {
      onAuth();
      return;
    }
    
    if (profile.uid === worker.uid) {
      alert("You cannot message yourself.");
      return;
    }

    setLoading(true);
    try {
      // Check if chat exists
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', profile.uid));
      const snap = await getDocs(q);
      
      let existingChat = snap.docs.find(docSnap => {
        const data = docSnap.data() as Chat;
        return data.participants.includes(worker.uid);
      });

      if (existingChat) {
        setActiveChat({ id: existingChat.id, ...existingChat.data() } as Chat);
      } else {
        // Create new chat
        const newChatData = {
          participants: [profile.uid, worker.uid],
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          participantDetails: {
            [profile.uid]: { firstName: profile.firstName, photoURL: profile.photoURL },
            [worker.uid]: { firstName: worker.firstName, photoURL: worker.photoURL }
          }
        };
        const docRef = await addDoc(collection(db, 'chats'), newChatData);
        setActiveChat({ id: docRef.id, ...newChatData } as Chat);
      }
      setIsMessagingOpen(true);
    } catch (err) {
      console.error("Chat error:", err);
      alert("Failed to start chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(userProfileData);
      setIsProfileEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Failed to update profile.");
    }
  };

  const handleRequestVerification = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      await addDoc(collection(db, 'verifications'), {
        userId: profile.uid,
        status: 'pending',
        type: 'employer_verification',
        submittedAt: serverTimestamp()
      });
      alert("Verification request submitted! Admin will review your profile.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (worker: User) => {
    const text = encodeURIComponent(`Hi ${worker.firstName}, I saw your profile on ${settings?.siteName || 'ZIMBABWE MAIDS CENTRE'} and I'm interested in hiring you. Are you available?`);
    window.open(`https://wa.me/${worker.whatsapp || worker.phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-ivory">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-brand-green/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             {settings?.siteLogo ? (
              <img src={settings.siteLogo} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white font-black text-xl">
                {settings?.siteName?.charAt(0) || 'Z'}
              </div>
            )}
            <span className="font-black text-xl tracking-tighter text-slate-900 hidden sm:block uppercase">
                {settings?.siteName?.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? "text-brand-green" : ""}>{word} </span>
                ))}
            </span>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden md:flex relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              placeholder="Search by location or name..."
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-green/5 focus:border-brand-green transition-all text-sm outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            {profile ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="flex items-center gap-4">
                  <div 
                    className="relative cursor-pointer hover:scale-110 transition-transform"
                    onClick={openChatsList}
                  >
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                      <MessageCircle size={20} />
                    </div>
                    {chats.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">{chats.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">{profile.firstName}</p>
                    <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">{profile.role}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={openProfileEditing}>
                    <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.firstName}&background=0D9488&color=fff`} alt="User" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={onAuth} className="px-3 py-2 bg-white border-2 border-brand-green text-brand-green rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Login</button>
                <button onClick={onAuth} className="px-3 py-2 bg-brand-green text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-trust transition-all">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Marketplace</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Found {filteredWorkers.length} Professional Helpers</p>
            </div>
            <button className="md:hidden p-3 bg-white rounded-xl shadow-soft">
              <Filter size={20} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {['All', ...WORKER_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-bold tracking-widest uppercase transition-all ${
                  filterCategory === cat 
                  ? 'bg-brand-green text-white shadow-trust' 
                  : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-6 items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-brand-green" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Experience:</span>
              <select 
                value={filterExperience}
                onChange={e => setFilterExperience(Number(e.target.value))}
                className="bg-slate-50 border-none text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none"
              >
                {[0, 2, 5, 10, 15].map(v => <option key={v} value={v}>{v}+ Yrs</option>)}
              </select>
            </div>
            
            <div className="w-px h-4 bg-slate-100" />

            <div className="flex items-center gap-2">
              <Star size={16} className="text-brand-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Rating:</span>
              <select 
                value={filterMinRating}
                onChange={e => setFilterMinRating(Number(e.target.value))}
                className="bg-slate-50 border-none text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none"
              >
                {[0, 3, 4, 5].map(v => <option key={v} value={v}>{v}+ Stars</option>)}
              </select>
            </div>

            <div className="w-px h-4 bg-slate-100" />

            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability:</span>
              <select 
                value={filterAvailability}
                onChange={e => setFilterAvailability(e.target.value)}
                className="bg-slate-50 border-none text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none"
              >
                <option value="All">Any Status</option>
                <option value="Available">Available Only</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setFilterCategory('All');
                setFilterAvailability('All');
                setFilterExperience(0);
                setFilterMinRating(0);
                setSearchQuery('');
              }}
              className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand-green hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 size={40} className="text-brand-green animate-spin mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Finding trusted workers...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredWorkers.map(w => (
              <WorkerCard key={w.user.uid} worker={w.user} profile={w.profile} onClick={() => openWorker(w)} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredWorkers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
             <Search size={48} className="text-slate-200 mb-6" />
             <h3 className="text-xl font-bold text-slate-800">No workers found</h3>
             <p className="text-slate-400 max-w-xs text-center mt-2">Try adjusting your filters or search query to find more results.</p>
             <button onClick={() => {setFilterCategory('All'); setSearchQuery('');}} className="mt-8 text-brand-green font-bold text-sm uppercase tracking-widest underline underline-offset-4">Reset all filters</button>
          </div>
        )}

        {/* Value Proposition */}
        <section className="py-24 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Why Zimbabwe Maids Centre?</h2>
              <p className="text-[10px] font-black text-brand-green uppercase tracking-[0.3em]">Built on Trust, Delivered with Excellence</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="p-10 bg-white rounded-[48px] shadow-2xl border border-slate-50 relative group"
              >
                <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-[28px] flex items-center justify-center mb-8 group-hover:bg-brand-green group-hover:text-white transition-all duration-500">
                  <ShieldCheck size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Vetted Security</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Every professional undergoes a strict police clearance check and identity verification for your safety.
                </p>
              </motion.div>

              <motion.div 
                 whileHover={{ y: -10 }}
                 className="p-10 bg-brand-gold text-white rounded-[48px] shadow-2xl relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="w-20 h-20 bg-white/20 text-white rounded-[28px] flex items-center justify-center mb-8">
                  <Star size={40} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase">Top Ratings</h3>
                <p className="text-sm text-white/90 font-medium leading-relaxed">
                  Our rating system ensures you only see the most reliable and efficient domestic help in Zimbabwe.
                </p>
              </motion.div>

              <motion.div 
                 whileHover={{ y: -10 }}
                 className="p-10 bg-slate-900 text-white rounded-[48px] shadow-2xl relative group"
              >
                <div className="w-20 h-20 bg-white/10 text-brand-green rounded-[28px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <MessageCircle size={40} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase">Direct Hiring</h3>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Hire directly via WhatsApp. No middle-man fees, no complex contracts. Just direct connection.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedWorker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-white shadow-2xl relative overflow-y-auto"
            >
              <button 
                onClick={() => { setSelectedWorker(null); setIsEditing(false); }}
                className="absolute top-8 left-8 z-10 p-3 bg-white/90 backdrop-blur outline-none rounded-full shadow-xl hover:scale-110 transition-all"
              >
                <X size={24} />
              </button>

              {isAdmin && selectedWorker && (
                <div className="absolute top-8 right-8 z-10 flex gap-2">
                   <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditData(selectedWorker.profile);
                    }}
                    className="p-3 bg-white rounded-full shadow-xl hover:bg-slate-50 transition-all text-slate-600"
                  >
                    {isEditing ? <X size={20} /> : <Briefcase size={20} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteWorker(selectedWorker.user.uid)}
                    className="p-3 bg-red-50 text-red-500 rounded-full shadow-xl hover:bg-red-100 transition-all"
                  >
                    <X size={20} className="rotate-45" />
                  </button>
                </div>
              )}

              {/* Hero Section */}
              <div className="aspect-[16/10] relative">
                <img src={selectedWorker.user.photoURL} alt={selectedWorker.user.firstName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 w-full">
                  <div className="flex items-end justify-between">
                    <div>
                      {selectedWorker.profile.isVerified && (
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-brand-green text-white rounded-full text-[8px] font-black uppercase tracking-widest mb-3">
                          <ShieldCheck size={12} /> Verified Professional
                        </div>
                      )}
                      <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">{selectedWorker.user.firstName} {selectedWorker.user.surname}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-brand-earth font-black text-[10px] uppercase tracking-widest">
                           <MapPin size={14} /> <span>{selectedWorker.user.location}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <div className="text-slate-400 font-black uppercase tracking-widest text-[9px] italic">{selectedWorker.profile.category}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-10 pb-32">
                {isEditing ? (
                  <div className="py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Profile: {selectedWorker.user.firstName}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                        <select 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                          value={editData.category}
                          onChange={e => setEditData({ ...editData, category: e.target.value })}
                        >
                          {WORKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Biography</label>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none h-32"
                          value={editData.bio}
                          onChange={e => setEditData({ ...editData, bio: e.target.value })}
                        />
                      </div>

                      <div className="space-y-4">
                        <div 
                          onClick={() => setEditData({ ...editData, isVerified: !editData.isVerified })}
                          className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                            editData.isVerified 
                            ? 'bg-emerald-50 border-brand-green text-brand-green' 
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${editData.isVerified ? 'bg-brand-green text-white' : 'bg-slate-200'}`}>
                              <ShieldCheck size={24} />
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-widest">Verification Status</p>
                              <p className="text-xs font-bold opacity-60">{editData.isVerified ? 'Official Professional Status' : 'Not Verified Yet'}</p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${editData.isVerified ? 'bg-brand-green border-emerald-200' : 'bg-white border-slate-200'}`}>
                            {editData.isVerified && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>

                        <div 
                          onClick={() => setEditData({ ...editData, hasPoliceClearance: !editData.hasPoliceClearance })}
                          className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                            editData.hasPoliceClearance 
                            ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' 
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${editData.hasPoliceClearance ? 'bg-brand-gold text-white' : 'bg-slate-200'}`}>
                              <FileCheck size={24} />
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-widest">Police Clearance</p>
                              <p className="text-xs font-bold opacity-60">{editData.hasPoliceClearance ? 'Vetted & Cleared' : 'Not Cleared'}</p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${editData.hasPoliceClearance ? 'bg-brand-gold border-yellow-200' : 'bg-white border-slate-200'}`}>
                            {editData.hasPoliceClearance && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleUpdateWorker}
                        className="w-full py-5 bg-brand-green text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-trust hover:bg-emerald-800 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                   <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <Clock className="mx-auto text-brand-gold mb-2" size={24} />
                      <span className="block font-black text-lg leading-none">{selectedWorker.profile.yearsExperience}Y</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <Languages className="mx-auto text-brand-gold mb-2" size={24} />
                      <span className="block font-black text-lg leading-none">3</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Languages</span>
                   </div>
                   <div className={`p-6 rounded-3xl text-center border-2 transition-all ${selectedWorker.profile.hasPoliceClearance ? 'bg-brand-gold/5 border-brand-gold/20' : 'bg-slate-50 border-slate-100'}`}>
                      <FileCheck className={`mx-auto mb-2 ${selectedWorker.profile.hasPoliceClearance ? 'text-brand-gold' : 'text-slate-300'}`} size={24} />
                      <span className={`block font-black text-lg leading-none ${selectedWorker.profile.hasPoliceClearance ? 'text-brand-gold' : 'text-slate-400'}`}>{selectedWorker.profile.hasPoliceClearance ? 'Yes' : 'No'}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Police Cleared</span>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <Star className="mx-auto text-brand-gold mb-2" size={24} />
                      <span className="block font-black text-lg leading-none">{Math.round(selectedWorker.profile.rating)}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average</span>
                   </div>
                </div>

                <div className="space-y-12">
                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Professional Bio</h4>
                    <p className="text-lg text-slate-600 leading-relaxed italic pr-12">
                      "{selectedWorker.profile.bio}"
                    </p>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Specialized Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Housekeeping', 'Deep Cleaning', 'Cooking', 'Childcare', 'Pet Care'].map(s => (
                        <span key={s} className="px-5 py-2 bg-white border-2 border-slate-50 rounded-full text-xs font-bold text-slate-700">{s}</span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Verification Check</h4>
                    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-green shadow-sm">
                           <ShieldCheck size={32} />
                        </div>
                        <div>
                          <h5 className="font-bold text-brand-green text-lg">Identity & Security Verified</h5>
                          <p className="text-emerald-700/60 text-sm mt-1">This worker has successfully submitted a valid national ID and a recent Zimbabwean Police Clearance Certificate.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mb-6">Full Body & Work Photos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedWorker.profile.workPhotos && selectedWorker.profile.workPhotos.length > 0 ? (
                        selectedWorker.profile.workPhotos.map((photo, i) => (
                          <div key={i} className="aspect-[3/4] rounded-[32px] overflow-hidden shadow-soft">
                             <img src={photo} alt={`Work ${i}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-20 bg-slate-50 rounded-[40px] flex flex-col items-center justify-center text-slate-300">
                           <ShieldCheck size={48} className="mb-4 opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-widest">Full profile photos verified</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
              )}
            </div>

              {/* Bottom Action Bar */}
              <div className="sticky bottom-0 left-0 w-full p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex gap-4">
                {(profile?.isPremium || isAdmin) ? (
                  <>
                    <button 
                      onClick={() => handleWhatsApp(selectedWorker.user)}
                      className="flex-[2] py-5 bg-brand-green text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-trust hover:bg-emerald-800 transition-all"
                    >
                      <MessageCircle size={22} fill="currentColor" /> WhatsApp Hire
                    </button>
                    <button 
                      onClick={() => openMessaging(activeChat || { id: '', participants: [profile!.uid, selectedWorker.user.uid], lastMessage: '', lastMessageAt: {} as any })}
                      className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all"
                    >
                      <MessageCircle size={18} /> Chat
                    </button>
                  </>
                ) : (
                  <div className="flex-1 space-y-3">
                    <button 
                      onClick={() => alert("Premium access is required to view contact details and hire directly. Please upgrade your account.")}
                      className="w-full py-5 bg-slate-900/50 text-white/50 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed grayscale"
                    >
                      <ShieldCheck size={22} /> WhatsApp Contact Locked
                    </button>
                    <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest italic">
                      Upgrade to <span className="text-brand-gold">Premium Employer</span> to unlock hiring
                    </p>
                  </div>
                )}
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Phone size={24} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Room Overlay */}
      <AnimatePresence>
        {isMessagingOpen && activeChat && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl flex flex-col h-[80vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 overflow-hidden">
                    <img 
                      src={activeChat.participantDetails?.[activeChat.participants.find(p => p !== profile?.uid) || '']?.photoURL} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                      {activeChat.participantDetails?.[activeChat.participants.find(p => p !== profile?.uid) || '']?.firstName}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Chat Connected
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMessagingOpen(false)}
                  className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <ChatRoom chatId={activeChat.id} currentUserId={profile?.uid || ''} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileEditing && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Your Profile</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update your personal information</p>
                 </div>
                 <button onClick={() => setIsProfileEditing(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-10 space-y-6">
                 <div className="flex items-center gap-8 mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[32px] bg-slate-100 overflow-hidden border-4 border-white shadow-xl">
                            <img src={userProfileData.photoURL || `https://ui-avatars.com/api/?name=${userProfileData.firstName}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[32px]">
                            <UserIcon className="text-white" size={24} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Profile Image URL</label>
                        <input 
                            value={userProfileData.photoURL || ''}
                            onChange={e => setUserProfileData({...userProfileData, photoURL: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-brand-green"
                            placeholder="https://..."
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">First Name</label>
                        <input 
                            value={userProfileData.firstName || ''}
                            onChange={e => setUserProfileData({...userProfileData, firstName: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Surname Name</label>
                        <input 
                            value={userProfileData.surname || ''}
                            onChange={e => setUserProfileData({...userProfileData, surname: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">WhatsApp / Phone</label>
                    <input 
                        value={userProfileData.phone || ''}
                        onChange={e => setUserProfileData({...userProfileData, phone: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green"
                        placeholder="+263..."
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Location</label>
                    <input 
                        value={userProfileData.location || ''}
                        onChange={e => setUserProfileData({...userProfileData, location: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green"
                        placeholder="e.g. Harare, Zimbabwe"
                    />
                 </div>

                 <button 
                    onClick={handleUpdateProfile}
                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                 >
                    Save Profile Settings
                 </button>

                 {!profile?.isPremium && profile?.role === 'employer' && (
                   <button 
                    onClick={handleRequestVerification}
                    className="w-full py-5 bg-brand-gold text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-trust hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
                   >
                    <Award size={20} /> Request Professional Badge
                   </button>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chats List Drawer */}
      <AnimatePresence>
        {isChatsListOpen && (
          <div className="fixed inset-0 z-[160] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatsListOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Messages</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect with potential hires</p>
                </div>
                <button onClick={() => setIsChatsListOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chats.length > 0 ? chats.map(chat => {
                  const otherParticipant = chat.participantDetails?.[chat.participants.find(p => p !== profile?.uid) || ''];
                  return (
                    <button 
                      key={chat.id}
                      onClick={() => {
                        openMessaging(chat);
                        setIsChatsListOpen(false);
                      }}
                      className="w-full p-6 bg-slate-50 rounded-3xl flex items-center gap-4 hover:bg-brand-green/5 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                        <img src={otherParticipant?.photoURL} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-black text-slate-800 tracking-tight text-lg group-hover:text-brand-green transition-colors">{otherParticipant?.firstName}</h4>
                        <p className="text-xs font-bold text-slate-400 truncate max-w-[200px]">{chat.lastMessage || 'Start a conversation...'}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                    <MessageCircle size={64} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No active chats yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatRoom = ({ chatId, currentUserId }: { chatId: string; currentUserId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Message));
      setMessages(list);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msgData = {
        senderId: currentUserId,
        text: newMessage,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      
      // Update chat last message
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      }, { merge: true });

      setNewMessage('');
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-4"
      >
        {messages.map(msg => (
          <div 
            key={msg.id}
            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                msg.senderId === currentUserId 
                ? 'bg-brand-green text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
            <MessageCircle size={48} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Send a message to start hiring</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-8 bg-white border-t border-slate-100 flex gap-3">
        <input 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-green transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-14 h-14 bg-brand-green text-white rounded-2xl flex items-center justify-center shadow-trust hover:bg-emerald-800 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
