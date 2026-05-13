import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
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

  // Sync state with browser history
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If it's an overlay pop, Marketplace handles it locally
      if (event.state && event.state.type === 'overlay') {
        return;
      }

      if (event.state && event.state.view) {
        setView(event.state.view);
      } else if (view !== 'landing') {
        const confirmExit = window.confirm("Do you want to exit the app?");
        if (confirmExit) {
          setView('landing');
        } else {
          window.history.pushState({ view: 'landing' }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  // Wrapper for setView that pushes to history
  const navigateTo = (newView: 'landing' | 'marketplace' | 'onboarding' | 'admin') => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '');
      setView(newView);
    }
  };

  React.useEffect(() => {
    // Basic navigation logic
    if (view === 'admin' && !isAdmin) {
      navigateTo('landing');
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
            onBrowse={() => navigateTo('marketplace')}
            onGetStarted={(role?: 'employer' | 'worker') => {
              if (user) {
                navigateTo('marketplace');
              } else {
                setOnboardingRole(role || null);
                setOnboardingLogin(false);
                navigateTo('onboarding');
              }
            }}
            onAdminPortal={() => {
              if (isAdmin) {
                navigateTo('admin');
              } else {
                setOnboardingLogin(true);
                navigateTo('onboarding');
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
            onAuth={() => navigateTo('onboarding')}
          />
          {/* Admin shortcut if logged in */}
          {isAdmin && (
            <button 
              onClick={() => navigateTo('admin')}
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
            onComplete={() => navigateTo('marketplace')} 
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
          <AdminDashboard onBack={() => navigateTo('marketplace')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </AuthProvider>
  );
}
