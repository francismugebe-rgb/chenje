import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { LandingPage } from './components/LandingPage';
import { Marketplace } from './components/Marketplace';
import { Onboarding } from './components/Onboarding';
import { AdminDashboard } from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';

const Root = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [view, setView] = React.useState<'landing' | 'marketplace' | 'onboarding' | 'admin'>('landing');
  const [onboardingRole, setOnboardingRole] = React.useState<'employer' | 'worker' | null>(null);
  const [onboardingLogin, setOnboardingLogin] = React.useState(false);

  React.useEffect(() => {
    // Basic navigation logic
    if (view === 'admin' && !isAdmin) {
      setView('landing');
    }
  }, [isAdmin, view]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-ivory flex flex-col items-center justify-center p-10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-[10px] font-black text-brand-green uppercase tracking-[0.4em] animate-pulse">Syncing Connection...</h2>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <motion.div 
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingPage 
            onBrowse={() => setView('marketplace')}
            onGetStarted={(role?: 'employer' | 'worker') => {
              setOnboardingRole(role || null);
              setOnboardingLogin(false);
              setView('onboarding');
            }}
            onAdminPortal={() => {
              if (isAdmin) {
                setView('admin');
              } else {
                setOnboardingLogin(true);
                setView('onboarding');
              }
            }}
          />
        </motion.div>
      )}

      {view === 'marketplace' && (
        <motion.div 
          key="marketplace"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
        >
          <Marketplace 
            onAuth={() => setView('onboarding')}
          />
          {/* Admin shortcut if logged in */}
          {isAdmin && (
            <button 
              onClick={() => setView('admin')}
              className="fixed bottom-8 right-8 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl z-50 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Admin Dashboard
            </button>
          )}
        </motion.div>
      )}

      {view === 'onboarding' && (
        <motion.div 
          key="onboarding"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Onboarding 
            initialRole={onboardingRole}
            initialLogin={onboardingLogin}
            onComplete={() => setView('marketplace')} 
          />
        </motion.div>
      )}

      {view === 'admin' && isAdmin && (
        <motion.div 
          key="admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AdminDashboard onBack={() => setView('marketplace')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
