import React, { useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Heart, Mail, Lock, User as UserIcon, Calendar, Camera, Plus, X, GripVertical, Sparkles, ChevronLeft, Trash2, ShieldCheck } from 'lucide-react';
import { PREDEFINED_INTERESTS, BIO_PROMPTS } from '../constants';

import { useAuth } from '../AuthContext';

export const UserOnboarding = ({ onAdmin }: { onAdmin?: () => void }) => {
  const { isAdmin } = useAuth();
  const [step, setStep] = useState<'auth' | 'minimal' | 'interests' | 'complete'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>(['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400&h=600']);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      checkProfile(result.user.uid);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setStep('minimal');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const checkProfile = async (uid: string) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      // User already has profile, no need to onboard
    } else {
      setStep('minimal');
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests([...interests, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const addPhoto = () => {
    // In a real app, this would be a file upload. Here we'll add a placeholder.
    const newPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=400&h=600`;
    setPhotos([...photos, newPhoto]);
  };

  const finishOnboarding = async () => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        firstName,
        lastName,
        age: parseInt(age),
        gender,
        premiumTier: 'free',
        interests,
        bio,
        photos,
        role: 'user',
        isVerified: false,
        isBanned: false,
        location: 'Zimbabwe',
        preferences: {
          ageMin: 18,
          ageMax: 35,
          genderPreference,
          distance: 50
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (whatsappNumber) {
        await setDoc(doc(db, 'whatsappNumbers', auth.currentUser.uid), {
          number: whatsappNumber,
          userId: auth.currentUser.uid
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderAdminLink = () => {
    if (isAdmin && onAdmin) {
      return (
        <div className="mt-8 pt-8 border-t border-rose-100">
          <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest text-center mb-4">Admin Detected</p>
          <button 
            onClick={onAdmin}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200"
          >
            <ShieldCheck size={20} className="text-rose-500" /> 
            Enter Admin Backend
          </button>
        </div>
      );
    }
    return null;
  };

  const renderAuth = () => (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart size={32} fill="white" stroke="transparent" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center mb-2 tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-orange-500">Bloom</h2>
        <p className="text-gray-400 text-center text-sm font-bold uppercase tracking-widest mb-10">Pure Authentic Connection</p>
        
        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white border-2 border-rose-100 rounded-2xl font-black text-xs text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-rose-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-black text-rose-200">
              <span className="bg-white px-4">Or use email</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-rose-50 p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-rose-50 p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>
            <button 
              onClick={() => handleEmailAuth(false)}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-rose-200 mt-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleEmailAuth(true)}
              className="w-full text-center text-[10px] font-black text-rose-400 uppercase tracking-widest mt-4"
            >
              Create new account
            </button>
          </div>
        </div>
        {renderAdminLink()}
        {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center mt-6 tracking-widest">{error}</p>}
      </motion.div>
    </div>
  );

  const renderMinimal = () => (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white"
      >
        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Essential Setup</h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8">Tell us about yourself</p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1">First Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
                <input 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-rose-50 p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1">Surname</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
                <input 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-rose-50 p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1">Your Age</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
                <input 
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-rose-50 p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-rose-50 p-4 px-6 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium appearance-none"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1 text-center block">Looking for</label>
              <select 
                value={genderPreference}
                onChange={(e) => setGenderPreference(e.target.value as any)}
                className="w-full bg-rose-50 p-4 px-6 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium appearance-none"
              >
                <option value="female">Ladies</option>
                <option value="male">Men</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1 text-center block">WhatsApp No.</label>
              <input 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+263..."
                className="w-full bg-rose-50 p-4 px-6 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="pt-6">
             <button 
              onClick={() => setStep('interests')}
              className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-rose-200"
            >
              Continue
            </button>
          </div>
        </div>
        {renderAdminLink()}
      </motion.div>
    </div>
  );

  const renderInterests = () => (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-xl border border-white"
      >
        <button onClick={() => setStep('minimal')} className="flex items-center gap-2 text-[10px] font-black text-rose-300 uppercase tracking-widest mb-6 hover:text-rose-500 transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Interests & Hobbies</h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8">What makes you... you? Select at least 3.</p>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {PREDEFINED_INTERESTS.map(interest => (
            <button 
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                interests.includes(interest) 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105' 
                  : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="relative mb-8">
          <input 
            type="text"
            placeholder="Add a custom interest..."
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
            className="w-full bg-rose-50 p-4 pr-12 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium"
          />
          <button 
            onClick={addCustomInterest}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
          >
            <Plus size={20} />
          </button>
        </div>

        <button 
          onClick={() => setStep('complete')}
          disabled={interests.length < 3}
          className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:hover:scale-100"
        >
          Next: Photos & Bio
        </button>
        {renderAdminLink()}
      </motion.div>
    </div>
  );

  const renderComplete = () => (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white"
      >
        <button onClick={() => setStep('interests')} className="flex items-center gap-2 text-[10px] font-black text-rose-300 uppercase tracking-widest mb-6 hover:text-rose-500 transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Final Touches</h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8">Add your photos and tell your story.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1 flex items-center gap-2">
              <Camera size={14} /> Profile Photos (Drag to reorder)
            </label>
            <Reorder.Group axis="y" values={photos} onReorder={setPhotos} className="space-y-3">
              {photos.map((photo, index) => (
                <Reorder.Item key={photo} value={photo}>
                  <div className="flex items-center gap-4 bg-rose-50 p-3 rounded-2xl border border-rose-100 group">
                    <GripVertical className="text-rose-200 cursor-grab active:cursor-grabbing" size={18} />
                    <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                      <img src={photo} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-black text-rose-300 uppercase">Photo {index + 1}</span>
                    {photos.length > 1 && (
                      <button 
                        onClick={() => setPhotos(photos.filter(p => p !== photo))}
                        className="ml-auto p-2 text-rose-200 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {photos.length < 6 && (
              <button 
                onClick={addPhoto}
                className="w-full py-4 border-2 border-dashed border-rose-100 rounded-2xl text-[10px] font-black text-rose-300 uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Photo
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-1 flex items-center gap-2">
                <Sparkles size={14} /> Your Bio
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something authentic..."
                className="w-full bg-rose-50 p-4 rounded-2xl border-2 border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all text-sm font-medium h-48 resize-none"
              />
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest px-1">Need a prompt?</p>
              <div className="grid grid-cols-1 gap-2">
                {BIO_PROMPTS.slice(0, 3).map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => setBio(prev => prev + (prev ? ' ' : '') + prompt)}
                    className="text-left p-3 bg-white border border-rose-100 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-all leading-relaxed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <button 
            onClick={finishOnboarding}
            className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-rose-200"
          >
            Bloom My Profile
          </button>
        </div>
        {renderAdminLink()}
      </motion.div>
    </div>
  );

  switch (step) {
    case 'auth': return renderAuth();
    case 'minimal': return renderMinimal();
    case 'interests': return renderInterests();
    case 'complete': return renderComplete();
    default: return null;
  }
};

