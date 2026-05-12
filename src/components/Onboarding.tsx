import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Briefcase, ChevronRight, Phone, MessageSquare, MapPin, Upload, Star, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole, WORKER_CATEGORIES, AvailabilityStatus, EmployerStatus } from '../types';

export const Onboarding = ({ onComplete, initialRole = null, initialLogin = false }: { 
  onComplete: () => void;
  initialRole?: UserRole | null;
  initialLogin?: boolean;
}) => {
  const [role, setRole] = useState<UserRole | null>(initialRole);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(initialLogin);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    phone: '',
    whatsapp: '',
    location: '',
    category: 'Maid',
    experience: 0,
    age: 18,
    gender: 'female' as 'male' | 'female',
    salary: '',
    bio: '',
    employerStatus: 'Mr' as EmployerStatus
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      let isNewUser = false;
      try {
        result = await signInWithEmailAndPassword(auth, email, password);
        
        // If logging in, check for verification
        if (!result.user.emailVerified) {
          await sendEmailVerification(result.user);
          setIsVerificationSent(true);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // If role is null, we are just trying to login. If it failed, don't auto-create.
          if (!role) throw new Error("User not found. Please check your credentials or create an account.");
          
          result = await createUserWithEmailAndPassword(auth, email, password);
          isNewUser = true;
          
          // Send verification for new users
          await sendEmailVerification(result.user);
          setIsVerificationSent(true);
        } else {
          throw err;
        }
      }
      
      if (result.user) {
        if (isNewUser) {
          await saveProfile(result.user.uid, result.user.email || email, result.user.photoURL);
        }
        
        if (result.user.emailVerified) {
          onComplete();
        }
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      alert(err.message);
    } finally {
      if (!isVerificationSent) setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
      setIsForgotPassword(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (uid: string, userEmail: string, photoURL: string | null) => {
    // Basic profile creation
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: userEmail,
      role: role || 'employer',
      firstName: formData.firstName || userEmail.split('@')[0] || '',
      surname: formData.surname || '',
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      location: formData.location,
      photoURL: photoURL || `https://ui-avatars.com/api/?name=${formData.firstName || userEmail.split('@')[0]}&background=random`,
      employerStatus: role === 'employer' ? formData.employerStatus : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (role === 'worker') {
      await setDoc(doc(db, 'worker_profiles', uid), {
        userId: uid,
        category: formData.category,
        age: Number(formData.age),
        gender: formData.gender,
        yearsExperience: Number(formData.experience),
        languages: ['English', 'Shona'],
        skills: [],
        salaryExpectation: 'Negotiable',
        availability: 'Available' as AvailabilityStatus,
        bio: formData.bio,
        isVerified: false,
        hasPoliceClearance: false,
        workPhotos: [],
        rating: 0,
        reviewCount: 0
      });

      if (verificationFile) {
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'verifications'), {
          userId: uid,
          status: 'pending',
          policeClearanceUrl: verificationFile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveProfile(result.user.uid, result.user.email!, result.user.photoURL);
      onComplete();
    } catch (err) {
      console.error("Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-soft overflow-hidden grid lg:grid-cols-2">
        <div className="hidden lg:block bg-brand-green p-12 text-white relative">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-6 tracking-tighter">Your safety matters most.</h2>
            <p className="text-emerald-100 mb-10 leading-relaxed">
              We verify every worker's police clearance and every employer's legitimacy to ensure a professional experience for both parties.
            </p>
            <div className="space-y-4">
              {[
                "Police Clearance Checks",
                "WhatsApp Powered Hiring",
                "Trusted Reviews",
                "Secure Payments"
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-brand-gold" />
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {!role && !isLoggingIn ? (
              <motion.div 
                key="role-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2 uppercase">ZIMBABWE MAIDS CENTRE</h1>
                <p className="text-slate-400 text-sm mb-8 uppercase font-bold tracking-widest leading-none">Safe & Professional Domestic Help</p>
                
                <div className="grid gap-4">
                  <button 
                    onClick={() => setRole('employer')}
                    className="group flex items-center gap-6 p-6 rounded-3xl border-2 border-slate-50 hover:border-brand-gold hover:bg-brand-gold/5 transition-all text-left"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                      <UserPlus size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">I'm an Employer</h4>
                      <p className="text-slate-400 text-sm">Hiring a helper for my home</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setRole('worker')}
                    className="group flex items-center gap-6 p-6 rounded-3xl border-2 border-slate-50 hover:border-brand-green hover:bg-brand-green/5 transition-all text-left"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                      <Briefcase size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">I'm a Worker</h4>
                      <p className="text-slate-400 text-sm">Looking for domestic work</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="h-px bg-slate-100 my-2" />

                  <button 
                    onClick={() => setIsLoggingIn(true)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-green transition-all"
                  >
                    Login to My Account
                  </button>

                  <button 
                    onClick={() => {
                        handleGoogleSignIn();
                    }}
                    className="w-full py-4 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                  >
                    <Star size={16} /> Admin Portal Login
                  </button>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-400">
                  By joining, you agree to our Terms of Use and Privacy Policy.
                </p>
              </motion.div>
            ) : isVerificationSent ? (
                <motion.div 
                    key="verification-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <MessageSquare size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Check your email</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        We've sent a verification link to <span className="font-bold text-slate-900">{email}</span>. Please verify your email to complete registration.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-green transition-all"
                    >
                        I've Verified My Email
                    </button>
                    <button 
                        onClick={() => setIsVerificationSent(false)}
                        className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    >
                        Try a different email
                    </button>
                </motion.div>
            ) : isForgotPassword ? (
                <motion.div 
                    key="forgot-password-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <button onClick={() => setIsForgotPassword(false)} className="text-xs font-bold text-brand-green uppercase tracking-widest mb-6 block">← Back to login</button>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Reset Password</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Enter your email to receive a reset link</p>
                    
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                            <input 
                                type="email"
                                required
                                className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green text-sm"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-green transition-all"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                </motion.div>
            ) : isLoggingIn ? (
                <motion.div 
                    key="login-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <button onClick={() => setIsLoggingIn(false)} className="text-xs font-bold text-brand-green uppercase tracking-widest mb-6 block">← Back to selection</button>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Sign in to your account</p>

                    <div className="p-6 bg-brand-green/5 rounded-3xl border border-brand-green/10 mb-8 items-center flex gap-4">
                        <div className="w-12 h-12 bg-brand-green text-white rounded-2xl flex items-center justify-center font-black">A</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Admin Access</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Management Credentials Required</p>
                        </div>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
                        <button 
                        onClick={() => setAuthMode('google')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'google' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                        Google
                        </button>
                        <button 
                        onClick={() => setAuthMode('email')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'email' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                        Email Login
                        </button>
                    </div>

                    {authMode === 'email' ? (
                        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                            <input 
                            type="email"
                            required
                            className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green text-sm"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Password</label>
                            <input 
                            type="password"
                            required
                            className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green text-sm"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                        >
                            {loading ? 'Processing...' : 'Login'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-green transition-all"
                        >
                            Forgot Password?
                        </button>
                        </form>
                    ) : (
                        <button 
                        disabled={loading}
                        onClick={handleGoogleSignIn}
                        className="w-full py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 disabled:opacity-50 transition-all mb-6 shadow-sm"
                        >
                        {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full" />
                        ) : (
                            <>
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                            Login with Google
                            </>
                        )}
                        </button>
                    )}
                </motion.div>
            ) : (
              <motion.div 
                key="form-steps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button onClick={() => setRole(null)} className="text-xs font-bold text-brand-green uppercase tracking-widest mb-6 block">← Back to role selection</button>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                  {role === 'worker' ? 'Professional Details' : 'Employer Details'}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Tell us a bit about yourself</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">First Name</label>
                      <input 
                        className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 transition-all"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Surname</label>
                      <input 
                        className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green focus:ring-4 focus:ring-brand-green/5 transition-all"
                        value={formData.surname}
                        onChange={e => setFormData({...formData, surname: e.target.value})}
                      />
                    </div>
                  </div>

                  {role === 'worker' && step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
                          <select 
                            className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-white"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          >
                            {WORKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Experience (Yrs)</label>
                          <input 
                            type="number"
                            className="w-full px-5 py-3 rounded-xl border border-slate-100"
                            value={formData.experience}
                            onChange={e => setFormData({...formData, experience: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Bio / About you</label>
                        <textarea 
                          rows={3}
                          className="w-full px-5 py-3 rounded-xl border border-slate-100"
                          value={formData.bio}
                          onChange={e => setFormData({...formData, bio: e.target.value})}
                        />
                      </div>
                      
                      <button 
                        onClick={() => setStep(2)}
                        className="w-full py-4 bg-brand-green text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-trust hover:bg-emerald-800 transition-all"
                      >
                        Next: Verification
                      </button>
                    </>
                  )}

                  {role === 'worker' && step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                       <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                          <Upload className="mx-auto text-brand-green mb-4" size={32} />
                          <h4 className="font-bold text-brand-green mb-2">Police Clearance Certificate</h4>
                          <p className="text-xs text-emerald-700/60 leading-relaxed">
                            Upload a photo of your recent police clearance to get the "Verified" badge. Verified workers get 5x more hire requests.
                          </p>
                          
                          <div className="mt-6 flex flex-col gap-3">
                             {verificationFile ? (
                               <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 truncate">clearance_doc_ready.jpg</span>
                                  <button onClick={() => setVerificationFile(null)} className="text-red-500 font-bold text-[10px] uppercase">Remove</button>
                               </div>
                             ) : (
                               <button 
                                onClick={() => setVerificationFile('https://example.com/mock-doc.jpg')}
                                className="w-full py-3 bg-white border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                               >
                                  Select Photo
                               </button>
                             )}
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <button 
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest"
                          >
                            Back
                          </button>
                          <button 
                            onClick={handleGoogleSignIn}
                            className="flex-[2] py-4 bg-brand-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-trust"
                          >
                            Submit & Finish
                          </button>
                       </div>
                       
                       <button onClick={handleGoogleSignIn} className="w-full text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] hover:text-slate-400 transition-all">
                          Skip for now
                       </button>
                    </div>
                  )}

                  {role === 'employer' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Status</label>
                          <select 
                            className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:ring-4 focus:ring-brand-green/5 bg-white"
                            value={formData.employerStatus}
                            onChange={e => setFormData({...formData, employerStatus: e.target.value as EmployerStatus})}
                          >
                            <option value="Mr">Mr.</option>
                            <option value="Mrs">Mrs.</option>
                            <option value="Miss">Miss.</option>
                            <option value="Family">Family</option>
                            <option value="Company">Company</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Location</label>
                          <input 
                            placeholder="e.g. Harare, Mt Pleasant"
                            className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green transition-all"
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Phone</label>
                          <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-100"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">WhatsApp</label>
                          <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-100"
                            value={formData.whatsapp}
                            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                          />
                        </div>
                      </div>

                  <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
                    <button 
                      onClick={() => setAuthMode('google')}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'google' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                      Google
                    </button>
                    <button 
                      onClick={() => setAuthMode('email')}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'email' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                      Email Login
                    </button>
                  </div>

                  {authMode === 'email' ? (
                    <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                        <input 
                          type="email"
                          required
                          className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green text-sm"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Password</label>
                        <input 
                          type="password"
                          required
                          className="w-full px-5 py-3 rounded-xl border border-slate-100 focus:border-brand-green text-sm"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                      >
                        {loading ? 'Processing...' : 'Continue with Email'}
                      </button>
                    </form>
                  ) : (
                    <button 
                      disabled={loading || !formData.firstName || !formData.surname}
                      onClick={handleGoogleSignIn}
                      className="w-full py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 disabled:opacity-50 transition-all mb-6 shadow-sm"
                    >
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                          Continue with Google
                        </>
                      )}
                    </button>
                  )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
