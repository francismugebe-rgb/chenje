/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UserOnboarding } from './components/UserOnboarding';
import { Discovery } from './components/Discovery';
import { AdminDashboard } from './components/AdminDashboard';
import { EditProfile } from './components/EditProfile';
import { Messaging } from './components/Messaging';
import { PremiumUpgrade } from './components/PremiumUpgrade';
import { motion } from 'motion/react';

const Root = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [view, setView] = React.useState<'discovery' | 'edit-profile' | 'messaging' | 'premium' | 'admin'>('discovery');
  const [activeMatchId, setActiveMatchId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If we were in admin view and user logged out, reset to discovery
    if (!isAdmin && view === 'admin') {
      setView('discovery');
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-sm font-black text-rose-300 uppercase tracking-[0.3em] animate-pulse">Syncing Heartbeat...</h2>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <UserOnboarding onAdmin={() => setView('admin')} />;
  }

  // Admin can access dashboard even without a profile
  if (view === 'admin' && isAdmin) {
    return <AdminDashboard onBack={() => setView('discovery')} />;
  }

  // No profile yet, go to onboarding
  if (!profile) {
    return <UserOnboarding onAdmin={() => setView('admin')} />;
  }

  if (view === 'admin' && isAdmin) {
    return <AdminDashboard onBack={() => setView('discovery')} />;
  }

  if (view === 'edit-profile') {
    return <EditProfile onBack={() => setView('discovery')} />;
  }

  if (view === 'messaging') {
    return <Messaging onBack={() => setView('discovery')} onUpgrade={() => setView('premium')} activeMatchId={activeMatchId} />;
  }

  if (view === 'premium') {
    return <PremiumUpgrade onBack={() => setView('discovery')} />;
  }

  // Standard user with profile
  return (
    <Discovery 
      onEditProfile={() => setView('edit-profile')} 
      onChat={() => setView('messaging')}
      onUpgrade={() => setView('premium')}
      onAdmin={() => setView('admin')}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
