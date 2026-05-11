import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Shield, FileCheck, AlertTriangle, 
  CheckCircle, XCircle, Search, 
  Eye, MoreVertical, Loader2
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VerificationRequest, User, WorkerProfile } from '../types';
import { useAuth } from '../AuthContext';

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<(VerificationRequest & { worker: User & { profile: WorkerProfile } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="text-slate-400 hover:text-brand-green font-bold text-sm">← Back to Marketplace</button>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Control</h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {['pending', 'approved', 'rejected'].map((tab: any) => (
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
        <div className="grid md:grid-cols-4 gap-6 mb-10">
           <StatCard icon={Users} label="Total Workers" value="280" trend="+12% this week" color="emerald" />
           <StatCard icon={Shield} label="Verification Queue" value={requests.length.toString()} trend="Action needed" color="gold" />
           <StatCard icon={AlertTriangle} label="Reported Profiles" value="1" color="red" />
           <StatCard icon={FileCheck} label="Verified Help" value="245" trend="Live on marketplace" color="earth" />
        </div>

        <div className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 tracking-tight capitalize">{activeTab} Requests</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input placeholder="Search worker name..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none w-64 focus:border-brand-green transition-all" />
              </div>
           </div>

           <div className="overflow-x-auto">
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
              {!loading && requests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                   <Shield size={48} className="mb-4 opacity-10" />
                   <p className="text-sm font-bold uppercase tracking-widest">No profiles in this queue</p>
                </div>
              )}
           </div>
        </div>
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
    <div className={`bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 transition-all hover:scale-[1.02] ${shadowColors[color]}`}>
       <div className={`w-14 h-14 rounded-2xl ${colors[color]} border flex items-center justify-center mb-6`}>
          <Icon size={28} />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
       {trend && (
         <div className="flex items-center gap-1.5 mt-4">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest ${color === 'red' ? 'text-rose-500' : 'text-emerald-500'}`}>{trend}</p>
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
