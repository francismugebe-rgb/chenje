import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Shield, FileCheck, AlertTriangle, 
  CheckCircle, XCircle, Search, 
  Eye, MoreVertical, Loader2, Database, RefreshCw,
  Edit, Trash2, MapPin, Briefcase, Star, Clock, Filter
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VerificationRequest, User, WorkerProfile, WORKER_CATEGORIES, AvailabilityStatus } from '../types';
import { useAuth } from '../AuthContext';

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<(VerificationRequest & { worker: User & { profile: WorkerProfile } })[]>([]);
  const [allWorkers, setAllWorkers] = useState<{ user: User; profile: WorkerProfile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'workers'>('pending');
  
  // States for worker editing
  const [selectedWorker, setSelectedWorker] = useState<{ user: User; profile: WorkerProfile } | null>(null);
  const [editData, setEditData] = useState<Partial<WorkerProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'workers') {
      fetchWorkers();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'verifications'), 
        where('status', '==', activeTab)
      );
      const snap = await getDocs(q);
      
      const list = await Promise.all(snap.docs.map(async (docSnap) => {
        const vReq = { id: docSnap.id, ...docSnap.data() } as VerificationRequest;
        const userRef = doc(db, 'users', vReq.userId);
        const workerRef = doc(db, 'worker_profiles', vReq.userId);
        
        const [uSnap, wSnap] = await Promise.all([getDoc(userRef), getDoc(workerRef)]);
        
        return {
          ...vReq,
          worker: {
            ...(uSnap.data() as User),
            profile: wSnap.data() as WorkerProfile
          }
        };
      }));

      setRequests(list);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'worker_profiles'), limit(100));
      const snap = await getDocs(q);
      
      const workersList = await Promise.all(snap.docs.map(async (docSnap) => {
        const workerProfile = docSnap.data() as WorkerProfile;
        const userRef = doc(db, 'users', workerProfile.userId);
        const userSnap = await getDoc(userRef);
        return {
          user: userSnap.data() as User,
          profile: workerProfile
        };
      }));

      setAllWorkers(workersList);
    } catch (err) {
      console.error("Admin fetch workers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorker = async () => {
    if (!selectedWorker) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'worker_profiles', selectedWorker.user.uid), {
        ...editData,
        updatedAt: serverTimestamp()
      });
      
      setAllWorkers(prev => prev.map(w => 
        w.user.uid === selectedWorker.user.uid 
        ? { ...w, profile: { ...w.profile, ...editData } } 
        : w
      ));
      setSelectedWorker(null);
      alert('Worker profile updated successfully.');
    } catch (err) {
      console.error("Update error:", err);
      alert('Failed to update worker.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorker = async (uid: string) => {
    if (!window.confirm('Delete this worker profile permanently?')) return;
    try {
      await deleteDoc(doc(db, 'worker_profiles', uid));
      await deleteDoc(doc(db, 'users', uid));
      setAllWorkers(prev => prev.filter(w => w.user.uid !== uid));
      alert('Worker deleted.');
    } catch (err) {
      console.error("Delete error:", err);
      alert('Failed to delete.');
    }
  };

  const handleVerify = async (requestId: string, userId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'verifications', requestId), {
        status: approved ? 'approved' : 'rejected',
        reviewedBy: currentUser?.uid,
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'worker_profiles', userId), {
        isVerified: approved,
        hasPoliceClearance: approved
      });

      fetchRequests();
    } catch (err) {
      console.error("Verification update error:", err);
    }
  };

  const seedWorkers = async () => {
    if (!currentUser || activeTab !== 'approved') {
       // Just a sanity check, usually admin check is done by the caller
    }
    
    setSeeding(true);
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
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1523910367623-6827e2db34a9?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400&h=400',
      'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=400&h=400'
    ];

    const fullBodyPhotos = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=900',
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600&h=900',
      'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=600&h=900'
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
          salaryExpectation: 'Negotiable',
          availability: Math.random() > 0.2 ? 'Available' : 'Busy',
          bio,
          isVerified: Math.random() > 0.1,
          hasPoliceClearance: Math.random() > 0.1,
          workPhotos: [fullBodyPhotos[0], fullBodyPhotos[1]],
          rating: 4.0 + (Math.random() * 1.0),
          reviewCount: Math.floor(Math.random() * 50)
        });
      }
      alert('Marketplace repopulated with 50 workers!');
    } catch (err) {
      console.error("Seeding error:", err);
      alert('Seeding failed.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
              onClick={seedWorkers} 
              disabled={seeding}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-trust hover:bg-emerald-800 transition-all disabled:opacity-50"
             >
                {seeding ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                Update Site Data
             </button>
             <button onClick={onBack} className="text-slate-400 hover:text-brand-green font-bold text-sm">← Back to Marketplace</button>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Control</h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {['pending', 'approved', 'rejected', 'workers'].map((tab: any) => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white shadow-sm text-brand-green' : 'text-slate-400'
                }`}
               >
                {tab}
               </button>
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-8 py-10 flex-1">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
           <StatCard icon={Users} label="Total Workers" value="280" trend="+12% this week" color="emerald" />
           <StatCard icon={Shield} label="Verification Queue" value={requests.length.toString()} trend="Action needed" color="gold" />
           <StatCard icon={AlertTriangle} label="Reported Profiles" value="1" color="red" />
           <StatCard icon={FileCheck} label="Verified Help" value="245" trend="Live on marketplace" color="earth" />
        </div>

        <div className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 tracking-tight capitalize">{activeTab} Queue</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input placeholder={`Search ${activeTab}...`} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none w-64 focus:border-brand-green transition-all" />
              </div>
           </div>

           <div className="overflow-x-auto">
              {activeTab === 'workers' ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                        <th className="px-8 py-4 text-left font-black">Worker</th>
                        <th className="px-8 py-4 text-left font-black">Details</th>
                        <th className="px-8 py-4 text-left font-black">Status</th>
                        <th className="px-8 py-4 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [1,2,3].map(i => <SkeletonRow key={i} />)
                    ) : (
                      allWorkers.map(w => (
                        <tr key={w.user.uid} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                                    <img src={w.user.photoURL} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="leading-tight">
                                    <p className="font-black text-slate-800 tracking-tight text-sm uppercase">{w.user.firstName} {w.user.surname}</p>
                                    <p className="text-[10px] font-bold text-slate-300 tracking-widest">{w.user.location}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{w.profile.category}</span>
                                 <div className="flex items-center gap-2">
                                    <Star className="text-brand-gold" size={10} fill="currentColor" />
                                    <span className="text-xs font-bold text-slate-600">{w.profile.rating}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex gap-2">
                                 {w.profile.isVerified && <Shield className="text-brand-green" size={16} />}
                                 {w.profile.hasPoliceClearance && <FileCheck className="text-brand-gold" size={16} />}
                                 <span className={`w-2 h-2 rounded-full mt-1.5 ${w.profile.availability === 'Available' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                  onClick={() => {
                                    setSelectedWorker(w);
                                    setEditData(w.profile);
                                  }}
                                  className="p-2 text-slate-400 hover:text-brand-green hover:bg-slate-50 rounded-lg transition-all"
                                 >
                                    <Edit size={16} />
                                 </button>
                                 <button 
                                  onClick={() => handleDeleteWorker(w.user.uid)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                        <th className="px-8 py-4 text-left font-black">Worker</th>
                        <th className="px-8 py-4 text-left font-black">Category</th>
                        <th className="px-8 py-4 text-left font-black">Location</th>
                        <th className="px-8 py-4 text-left font-black">Clearance Doc</th>
                        <th className="px-8 py-4 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [1,2,3].map(i => <SkeletonRow key={i} />)
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
                                    <img src={req.worker.photoURL || `https://ui-avatars.com/api/?name=${req.worker.firstName}`} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="leading-tight">
                                    <p className="font-black text-slate-800 tracking-tight text-sm uppercase">{req.worker.firstName} {req.worker.surname}</p>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest">{req.worker.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-[10px] font-black uppercase tracking-widest">
                                 {req.worker.profile.category}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                              {req.worker.location}
                           </td>
                           <td className="px-8 py-6">
                              <a 
                                href={req.policeClearanceUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:underline"
                              >
                                 <Eye size={14} /> Open Document
                              </a>
                           </td>
                           <td className="px-8 py-6 text-right">
                              {activeTab === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                   <button 
                                    onClick={() => handleVerify(req.id, req.userId, true)}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                   >
                                      Approve
                                   </button>
                                   <button 
                                    onClick={() => handleVerify(req.id, req.userId, false)}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                   >
                                      Reject
                                   </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 text-slate-300">
                                   {activeTab === 'approved' ? <CheckCircle size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-rose-500" />}
                                </div>
                              )}
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
              {!loading && ((activeTab === 'workers' && allWorkers.length === 0) || (activeTab !== 'workers' && requests.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                   <Shield size={48} className="mb-4 opacity-10" />
                   <p className="text-sm font-bold uppercase tracking-widest">No profiles found</p>
                </div>
              )}
           </div>
        </div>

        {/* Worker Edit Modal */}
        <AnimatePresence>
          {selectedWorker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
               >
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Edit Worker Profile</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedWorker.user.firstName} {selectedWorker.user.surname}</p>
                     </div>
                     <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                        <XCircle size={24} className="text-slate-300" />
                     </button>
                  </div>

                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                           <select 
                            value={editData.category}
                            onChange={(e) => setEditData({...editData, category: e.target.value})}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                           >
                              {WORKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Availability</label>
                           <select 
                            value={editData.availability}
                            onChange={(e) => setEditData({...editData, availability: e.target.value as AvailabilityStatus})}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                           >
                              <option value="Available">Available</option>
                              <option value="Busy">Busy</option>
                              <option value="Away">Away</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Age</label>
                           <input 
                            type="number"
                            value={editData.age}
                            onChange={(e) => setEditData({...editData, age: parseInt(e.target.value)})}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Years Exp</label>
                           <input 
                            type="number"
                            value={editData.yearsExperience}
                            onChange={(e) => setEditData({...editData, yearsExperience: parseInt(e.target.value)})}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Bio</label>
                        <textarea 
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm h-32"
                        />
                     </div>

                     <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input 
                            type="checkbox"
                            checked={editData.isVerified}
                            onChange={(e) => setEditData({...editData, isVerified: e.target.checked})}
                            className="w-4 h-4 accent-brand-green"
                           />
                           <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input 
                            type="checkbox"
                            checked={editData.hasPoliceClearance}
                            onChange={(e) => setEditData({...editData, hasPoliceClearance: e.target.checked})}
                            className="w-4 h-4 accent-brand-gold"
                           />
                           <span className="text-[10px] font-black uppercase tracking-widest">Police Cleared</span>
                        </label>
                     </div>

                     <button 
                      onClick={handleUpdateWorker}
                      disabled={isSaving}
                      className="w-full py-4 bg-brand-green text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-trust hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
                     >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save Worker Changes'}
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => {
  const shadowColors: any = {
    emerald: 'shadow-emerald-900/5',
    gold: 'shadow-brand-gold/5',
    red: 'shadow-rose-900/5',
    earth: 'shadow-brand-earth/5'
  };

  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    gold: 'bg-brand-gold/10 text-brand-gold border-brand-gold/10',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    earth: 'bg-brand-earth/10 text-brand-earth border-brand-earth/10'
  };

  return (
    <div className={`bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 transition-all hover:scale-[1.01] ${shadowColors[color]}`}>
       <div className={`w-12 h-12 rounded-xl ${colors[color]} border flex items-center justify-center mb-5`}>
          <Icon size={24} />
       </div>
       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">{label}</p>
       <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
       {trend && (
         <div className="flex items-center gap-1.5 mt-3">
            <span className={`w-1 h-1 rounded-full ${color === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <p className={`text-[8px] font-black uppercase tracking-widest ${color === 'red' ? 'text-rose-500' : 'text-emerald-500'}`}>{trend}</p>
         </div>
       )}
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
     <td className="px-8 py-6">
        <div className="flex items-center gap-3">
           <div className="h-10 bg-slate-100 rounded-full w-10" />
           <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-24" />
              <div className="h-2 bg-slate-50 rounded w-32" />
           </div>
        </div>
     </td>
     <td className="px-8 py-6"><div className="h-6 bg-slate-50 rounded-full w-24" /></td>
     <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-20" /></td>
     <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-32" /></td>
     <td className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl w-24 ml-auto" /></td>
  </tr>
);
