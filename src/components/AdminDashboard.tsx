import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, query, getDocs, doc, updateDoc, deleteDoc, 
  where, orderBy, limit, setDoc, serverTimestamp 
} from 'firebase/firestore';
import { UserProfile, Report } from '../types';
import { 
  Users, AlertTriangle, BarChart3, Settings, ShieldCheck, 
  Mail, LogOut, Search, UserMinus, CheckCircle, Ban, XCircle, 
  Sparkles, Database, ChevronLeft
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const AdminDashboard = ({ onBack }: { onBack?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'analytics' | 'settings'>('analytics');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const seedProfiles = async () => {
    setIsSeeding(true);
    const ladies = [
      { firstName: 'Zura', lastName: 'Mox', age: 22, bio: 'Art lover and coffee enthusiast. Living life in full bloom!', location: 'Harare', photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=600'], whatsapp: '+263771000001' },
      { firstName: 'Tendai', lastName: 'Bloom', age: 24, bio: 'Digital nomad exploring the world. Looking for a genuine connection.', location: 'Bulawayo', photos: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400&h=600'], whatsapp: '+263771000002' },
      { firstName: 'Sarah', lastName: 'Sky', age: 21, bio: 'Nature lover and bookworm.', location: 'Mutare', photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400&h=600'], whatsapp: '+263771000003' },
      { firstName: 'Elena', lastName: 'Rose', age: 26, bio: 'Fashion designer and dreamer.', location: 'Harare', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=600'], whatsapp: '+263771000004' },
      { firstName: 'Amara', lastName: 'Gold', age: 23, bio: 'Let’s talk about life and everything in between.', location: 'Victoria Falls', photos: ['https://images.unsplash.com/photo-1517841905240-472988bad1fa?auto=format&fit=crop&q=80&w=400&h=600'], whatsapp: '+263771000005' },
    ];

    try {
      for (const lady of ladies) {
        const uid = `seed_${lady.firstName.toLowerCase()}`;
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          uid,
          firstName: lady.firstName,
          lastName: lady.lastName,
          email: `${lady.firstName.toLowerCase()}@bloom.com`,
          age: lady.age,
          gender: 'female',
          premiumTier: 'free',
          location: lady.location,
          bio: lady.bio,
          photos: lady.photos,
          interests: ['Music', 'Travel', 'Art'],
          isVerified: true,
          isBanned: false,
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            ageMin: 18,
            ageMax: 99,
            genderPreference: 'male',
            distance: 100
          }
        });

        await setDoc(doc(db, 'whatsappNumbers', uid), {
          number: lady.whatsapp,
          userId: uid
        });
      }
      alert('Profiles seeded successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to seed profiles.');
    }
    setIsSeeding(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const q = query(collection(db, 'users'), limit(50));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => d.data() as UserProfile));
      } else if (activeTab === 'reports') {
        const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAction = async (uid: string, action: 'verify' | 'ban' | 'delete') => {
    try {
      if (action === 'verify') {
        await updateDoc(doc(db, 'users', uid), { isVerified: true });
      } else if (action === 'ban') {
        await updateDoc(doc(db, 'users', uid), { isBanned: true });
      } else if (action === 'delete') {
        await deleteDoc(doc(db, 'users', uid));
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const analyticsData = [
    { name: 'Active', value: 400 },
    { name: 'Banned', value: 20 },
    { name: 'Pending', value: 80 },
  ];
  const colors = ['#f43f5e', '#94a3b8', '#fbbf24'];

  const growthData = [
    { name: 'Mon', signups: 40, matches: 24 },
    { name: 'Tue', signups: 30, matches: 13 },
    { name: 'Wed', signups: 20, matches: 98 },
    { name: 'Thu', signups: 27, matches: 39 },
    { name: 'Fri', signups: 18, matches: 48 },
    { name: 'Sat', signups: 23, matches: 38 },
    { name: 'Sun', signups: 34, matches: 43 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">Bloom</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Admin Nexus</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('analytics')} className={`w-full p-4 flex items-center gap-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <BarChart3 size={18} /> Analytics
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full p-4 flex items-center gap-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Users size={18} /> User Mgmt
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full p-4 flex items-center gap-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <AlertTriangle size={18} /> Reports
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full p-4 flex items-center gap-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-rose-500 text-white shadow-xl shadow-rose-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Settings size={18} /> System
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
           {onBack && (
             <button onClick={onBack} className="w-full p-4 flex items-center gap-4 text-rose-300 hover:text-rose-100 transition-all text-xs font-black uppercase tracking-widest bg-rose-500/10 rounded-2xl">
               <ChevronLeft size={18} /> Back to App
             </button>
           )}
           <button className="w-full p-4 flex items-center gap-4 text-slate-500 hover:text-rose-400 transition-all text-xs font-black uppercase tracking-widest">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight capitalize">{activeTab} Dashboard</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">System status: Functional</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={seedProfiles}
              disabled={isSeeding}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shrink-0"
             >
                <Database size={14} />
                {isSeeding ? 'Seeding...' : 'Seed Data'}
             </button>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Search globally..." 
                  className="bg-white border-2 border-slate-100 p-3 pl-12 rounded-xl text-sm focus:border-rose-400 outline-none transition-all w-64 shadow-sm" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-md">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" />
             </div>
          </div>
        </header>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Growth & Engagement</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="signups" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="matches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               
               <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center flex flex-col gap-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">User Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {analyticsData.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6">
                     {analyticsData.map((d, i) => (
                       <div key={d.name} className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: colors[i] }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{d.name}</span>
                          <span className="text-sm font-black text-slate-800">{d.value}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                                <img src={u.photos?.[0]} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-800">{u.firstName} {u.lastName}</p>
                                <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                             </div>
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="flex gap-2">
                             {u.isVerified && <span className="bg-blue-50 text-blue-500 text-[10px] font-black uppercase px-2 py-1 rounded-md">Verified</span>}
                             {u.isBanned && <span className="bg-rose-50 text-rose-500 text-[10px] font-black uppercase px-2 py-1 rounded-md">Banned</span>}
                             {!u.isVerified && !u.isBanned && <span className="bg-slate-100 text-slate-400 text-[10px] font-black uppercase px-2 py-1 rounded-md">Standard</span>}
                           </div>
                        </td>
                        <td className="p-6 text-sm font-bold text-slate-500">{u.location}</td>
                        <td className="p-6">
                           <div className="flex gap-2">
                              {!u.isVerified && (
                                <button onClick={() => handleAction(u.uid, 'verify')} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><CheckCircle size={16}/></button>
                              )}
                              {!u.isBanned && (
                                <button onClick={() => handleAction(u.uid, 'ban')} className="p-2 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><Ban size={16}/></button>
                              )}
                              <button onClick={() => handleAction(u.uid, 'delete')} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><XCircle size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};
