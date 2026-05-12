import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Shield, Phone, MessageSquare, Star, ArrowRight, UserPlus, FileCheck, CheckCircle2, Loader2, ShieldCheck, MessageCircle, Heart } from 'lucide-react';
import { WORKER_CATEGORIES, User, WorkerProfile } from '../types';
import { collection, query, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkerCard } from './Marketplace';
import { useSettings } from '../SettingsContext';

const CategoryCard = ({ name, icon: Icon }: { name: string; icon: any }) => (
  <motion.button
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl shadow-soft hover:shadow-trust transition-all border border-brand-green/5"
  >
    <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
      <Icon size={28} />
    </div>
    <span className="font-semibold text-sm text-slate-700 whitespace-nowrap">{name}</span>
  </motion.button>
);

export const LandingPage = ({ onGetStarted, onBrowse, onAdminPortal }: { 
  onGetStarted: (role?: 'employer' | 'worker') => void; 
  onBrowse: () => void;
  onAdminPortal: () => void;
}) => {
  const { settings } = useSettings();
  const [featuredWorkers, setFeaturedWorkers] = useState<{ user: User; profile: WorkerProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'worker_profiles'), limit(24));
        const snap = await getDocs(q);
        const list = await Promise.all(snap.docs.map(async (docSnap) => {
          const profile = docSnap.data() as WorkerProfile;
          const userSnap = await getDoc(doc(db, 'users', profile.userId));
          return {
            user: userSnap.data() as User,
            profile
          };
        }));
        setFeaturedWorkers(list);
      } catch (err) {
        console.error("Error fetching featured workers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.siteLogo ? (
              <img src={settings.siteLogo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white font-black text-lg">
                {settings?.siteName?.charAt(0) || 'Z'}
              </div>
            )}
            <span className="font-black text-lg tracking-tighter text-slate-900 uppercase">
                {settings?.siteName?.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? "text-brand-green" : ""}>{word} </span>
                ))}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onGetStarted()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-brand-green transition-all shadow-lg md:px-5 md:py-2.5 md:rounded-xl md:text-[9px]"
            >
              Sign In
            </button>
            <button onClick={onBrowse} className="p-2 text-slate-400 hover:text-brand-green transition-all md:hidden">
              <Search size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/5 border border-brand-green/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">Verified Domestic Workers in Zimbabwe</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tighter mb-4 text-slate-900 uppercase">
              ZIMBABWE <br />
              <span className="text-brand-green">MAIDS CENTRE</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mb-8 max-w-lg leading-relaxed">
              Zimbabwe's premier domestic worker center. Connect with verified maids, gardeners, and caregivers. Professional excellence, vetted for your peace of mind.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={onBrowse}
                className="px-6 py-3.5 bg-brand-green text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-trust hover:bg-emerald-800 transition-all"
              >
                Find a Helper <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onGetStarted('worker')}
                className="px-6 py-3.5 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Post a Job
              </button>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 border-2 border-white rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-brand-gold">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">2,000+ Satisfied Families</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800&h=1000" 
                alt="Domestic Worker" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center text-white text-xl font-bold">Z</div>
                    <div>
                      <h4 className="text-white font-bold tracking-tight">Zinhle Mdluli</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-brand-gold text-xs font-bold uppercase tracking-widest">Verified Maid</span>
                        <div className="w-1 h-1 bg-white/30 rounded-full" />
                        <span className="text-white/70 text-[10px]">Harare</span>
                      </div>
                    </div>
                    <div className="ml-auto w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <Phone size={18} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Badge */}
            <div className="absolute -top-6 -right-6 p-6 bg-brand-gold rounded-[30px] shadow-xl text-white transform rotate-6">
              <div className="text-center">
                <span className="block text-3xl font-black">98%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Vetted Helpers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black mb-3 tracking-tighter uppercase text-slate-900">Featured Professionals</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] max-w-lg mx-auto mb-12">Verified and top-rated helpers ready to start</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-green" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
              {featuredWorkers.map((w, idx) => (
                <WorkerCard 
                  key={w.user.uid} 
                  worker={w.user} 
                  profile={w.profile} 
                  onClick={onBrowse}
                />
              ))}
            </div>
          )}
          
          <button 
            onClick={onBrowse}
            className="mt-12 px-8 py-3.5 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-soft"
          >
            View All Helpers
          </button>
        </div>

        <div className="max-w-7xl mx-auto mt-24">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-2xl font-black mb-4 tracking-tight">Browse by Category</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <CategoryCard name="Maids" icon={UserPlus} />
            <CategoryCard name="Gardeners" icon={ArrowRight} />
            <CategoryCard name="Nannies" icon={HeartIcon} />
            <CategoryCard name="Cooks" icon={Search} />
            <CategoryCard name="Caregivers" icon={CheckCircle2} />
            <CategoryCard name="Security" icon={Shield} />
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
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
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-0" />
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-brand-green rounded-[40px] p-12 md:p-20 relative overflow-hidden text-center text-white">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Ready to find <br className="hidden md:block" /> your next helper?</h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-lg mx-auto">Join thousands of Zimbabwean families finding security and quality help through ZIMBABWE MAIDS CENTRE.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={onBrowse} className="px-10 py-5 bg-white text-brand-green rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl">Start Browsing</button>
              <button onClick={() => onGetStarted('worker')} className="px-10 py-5 bg-brand-gold text-white rounded-2xl font-bold text-lg hover:bg-yellow-600 transition-all shadow-xl">Worker Sign-up</button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-6 text-center">
        <p className="text-slate-400 text-sm mb-4">© 2026 ZIMBABWE MAIDS CENTRE. All rights reserved.</p>
        <button 
          onClick={onAdminPortal}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-brand-green transition-all"
        >
          Admin Portal Login
        </button>
      </footer>
    </div>
  );
};

// Helper components for icons that might be missing from standard lucide
const HeartIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
