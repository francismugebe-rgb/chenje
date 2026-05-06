import React from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { 
  Heart, Check, Zap, Crown, Star, ChevronLeft, ShieldCheck, 
  Globe, MessageCircle, Phone, Lock, Sparkles 
} from 'lucide-react';
import { PremiumTier } from '../types';

export const PremiumUpgrade = ({ onBack }: { onBack: () => void }) => {
  const { profile } = useAuth();

  const tiers = [
    {
      id: 'gold' as PremiumTier,
      name: 'Gold',
      price: '$9.99',
      color: 'from-amber-400 to-yellow-600',
      features: [
        'See WhatsApp numbers',
        'Unlimited Messaging',
        '5 Super Blooms per day',
        'Basic Rewinds'
      ],
      icon: <Star size={24} />
    },
    {
      id: 'platinum' as PremiumTier,
      name: 'Platinum',
      price: '$19.99',
      color: 'from-slate-400 to-slate-700',
      features: [
        'Priority Discovery',
        'Message before matching',
        'Unlimited Rewinds',
        'All Gold features'
      ],
      icon: <Zap size={24} />,
      popular: true
    },
    {
      id: 'vip' as PremiumTier,
      name: 'VIP',
      price: '$49.99',
      color: 'from-rose-500 to-rose-900',
      features: [
        'Global Passport',
        'Stealth Mode',
        'Dedicated Concierge',
        'All Platinum features'
      ],
      icon: <Crown size={24} />
    }
  ];

  const handleUpgrade = async (tier: PremiumTier) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        premiumTier: tier,
        updatedAt: serverTimestamp()
      });
      onBack();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 font-sans pb-20">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-rose-100 z-50 py-6">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-full transition-all text-rose-500">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black uppercase tracking-tight text-gray-900">Bloom Premium</h1>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Elevate your connections</p>
          </div>
          <div className="w-12 h-12" /> {/* Spacer */}
        </div>
      </header>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-rose-100 shadow-sm"
          >
            <Sparkles size={14} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Bloom Beyond limits</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 italic uppercase">
            Unlock <span className="text-rose-500 underline decoration-rose-200">The Power</span> Of Bloom
          </h2>
          <p className="max-w-xl mx-auto text-gray-500 font-medium">
             Why wait for a reply? Premium members find matches 3x faster and get direct access to personal connections.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-white rounded-[3rem] p-10 border-4 ${tier.popular ? 'border-rose-400 shadow-2xl shadow-rose-500/20 scale-105' : 'border-white shadow-xl shadow-rose-900/5 hover:border-rose-100 transition-colors'}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className={`w-14 h-14 bg-gradient-to-tr ${tier.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-8 rotate-3 group-hover:rotate-0 transition-transform`}>
                {tier.icon}
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-2xl font-black text-gray-900">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black text-rose-500">{tier.price}</span>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">/ Month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-12">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                       <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(tier.id)}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                   tier.popular 
                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 hover:scale-[1.02]' 
                    : 'bg-rose-50 text-rose-500 border-2 border-rose-100 hover:bg-rose-100'
                }`}
              >
                Choose {tier.name}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="bg-white rounded-[4rem] p-12 lg:p-20 shadow-xl shadow-rose-900/5 border border-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
             <div className="space-y-3">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mx-auto shadow-sm">
                   <Phone size={24} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Direct Contact</h4>
                <p className="text-[8px] font-bold text-gray-400 leading-relaxed italic">View WhatsApp numbers instantly</p>
             </div>
             <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mx-auto shadow-sm">
                   <MessageCircle size={24} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Unlimited Chat</h4>
                <p className="text-[8px] font-bold text-gray-400 leading-relaxed italic">No limits on your conversations</p>
             </div>
             <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mx-auto shadow-sm">
                   <Lock size={24} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Elite Privacy</h4>
                <p className="text-[8px] font-bold text-gray-400 leading-relaxed italic">Control who sees your profile</p>
             </div>
             <div className="space-y-3">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto shadow-sm">
                   <Heart size={24} fill="currentColor" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Super Bloom</h4>
                <p className="text-[8px] font-bold text-gray-400 leading-relaxed italic">Stand out from the crowd</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
