import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { 
  User as UserIcon, Calendar, Camera, Plus, Trash2, GripVertical, 
  ChevronLeft, Sparkles, MapPin, Heart, Shield, Settings,
  Hash, Info, Sliders, Save, CheckCircle2, LogOut
} from 'lucide-react';
import { PREDEFINED_INTERESTS, BIO_PROMPTS } from '../constants';

export const EditProfile = ({ onBack }: { onBack: () => void }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [photos, setPhotos] = useState<string[]>(profile?.photos || []);
  const [location, setLocation] = useState(profile?.location || '');
  
  // Preferences
  const [ageMin, setAgeMin] = useState(profile?.preferences?.ageMin || 18);
  const [ageMax, setAgeMax] = useState(profile?.preferences?.ageMax || 35);
  const [genderPref, setGenderPref] = useState(profile?.preferences?.genderPreference || 'any');

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        firstName,
        lastName,
        age: parseInt(age),
        bio,
        interests,
        photos,
        location,
        preferences: {
          ageMin,
          ageMax,
          genderPreference: genderPref,
          distance: 50 // default for now
        },
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const addPhoto = () => {
    const newPhoto = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=400&h=600`;
    setPhotos([...photos, newPhoto]);
  };

  return (
    <div className="min-h-screen bg-rose-50 font-sans pb-40">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-rose-100 z-50 py-6">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-full transition-all text-rose-500">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black uppercase tracking-tight text-gray-900">Edit Profile</h1>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Update your authentic self</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => auth.signOut()}
              className="p-3 hover:bg-rose-50 rounded-full transition-all text-gray-400 hover:text-rose-500"
              title="Logout"
            >
              <LogOut size={24} />
            </button>
            <button 
              disabled={loading}
              onClick={handleSave}
              className={`p-3 rounded-full transition-all ${success ? 'bg-green-500 text-white' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200'}`}
            >
              {success ? <CheckCircle2 size={24} /> : <Save size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 max-w-4xl mx-auto px-6 space-y-12">
        {/* Photos Section */}
        <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-rose-900/5 border border-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
              <Camera size={20} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase italic">Visual Story</h2>
          </div>
          
          <Reorder.Group axis="y" values={photos} onReorder={setPhotos} className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <Reorder.Item key={photo} value={photo} className="relative group aspect-[3/4.5] rounded-3xl overflow-hidden border-4 border-white shadow-lg cursor-grab active:cursor-grabbing">
                <img src={photo} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black text-white uppercase px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg">#{index + 1}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const newUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=400&h=600`;
                        const newPhotos = [...photos];
                        newPhotos[index] = newUrl;
                        setPhotos(newPhotos);
                      }}
                      className="p-2 bg-white text-rose-500 rounded-lg hover:bg-rose-50 shadow-md"
                      title="Replace Photo"
                    >
                      <Camera size={14} />
                    </button>
                    <button 
                      onClick={() => setPhotos(photos.filter(p => p !== photo))}
                      className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-md"
                      title="Remove Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
            {photos.length < 6 && (
              <button 
                onClick={addPhoto}
                className="aspect-[3/4.5] bg-rose-50 border-4 border-dashed border-rose-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-rose-300 hover:bg-rose-100 hover:border-rose-400 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
              </button>
            )}
          </Reorder.Group>
        </section>

        {/* Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-rose-900/5 border border-white space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><UserIcon size={20}/></div >
               <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase italic">Basic Details</h2 >
            </div>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-rose-50 p-4 rounded-2xl border-2 border-transparent focus:border-rose-200 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Surname</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-rose-50 p-4 rounded-2xl border-2 border-transparent focus:border-rose-200 outline-none transition-all text-sm font-medium" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Age</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-rose-50 p-4 rounded-2xl border-2 border-transparent focus:border-rose-200 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Location</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-rose-50 p-4 rounded-2xl border-2 border-transparent focus:border-rose-200 outline-none transition-all text-sm font-medium" />
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-rose-900/5 border border-white space-y-8">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Sparkles size={20}/></div >
               <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase italic">The Narrative</h2 >
            </div>
            <div className="space-y-4">
               <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Share your essence..." className="w-full bg-rose-50 p-6 rounded-3xl border-2 border-transparent focus:border-rose-200 outline-none transition-all text-sm font-medium h-40 resize-none" />
               <div className="flex flex-wrap gap-2">
                  {BIO_PROMPTS.slice(0, 4).map(prompt => (
                    <button key={prompt} onClick={() => setBio(prev => prev + (prev ? ' ' : '') + prompt)} className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-tight text-left">
                       + {prompt.slice(0, 30)}...
                    </button>
                  ))}
               </div>
            </div>
          </section>
        </div>

        {/* Interests */}
        <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-rose-900/5 border border-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Hash size={20}/></div >
            <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase italic">Passions & Hobbies</h2 >
          </div>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_INTERESTS.map(interest => (
              <button 
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  interests.includes(interest) 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                    : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Discovery Settings */}
        <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-rose-900/5 border border-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Sliders size={20}/></div >
            <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase italic">Discovery Preferences</h2 >
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Age Range</label>
                   <span className="text-xs font-black text-gray-900">{ageMin} - {ageMax}</span>
                </div>
                <div className="flex gap-4">
                   <input type="range" min="18" max="100" value={ageMin} onChange={e => setAgeMin(parseInt(e.target.value))} className="flex-1 accent-rose-500" />
                   <input type="range" min="18" max="100" value={ageMax} onChange={e => setAgeMax(parseInt(e.target.value))} className="flex-1 accent-rose-500" />
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">Interested In</label>
                <div className="flex p-1 bg-rose-50 rounded-2xl">
                   {['male', 'female', 'any'].map(pref => (
                     <button 
                       key={pref} 
                       onClick={() => setGenderPref(pref)}
                       className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${genderPref === pref ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
                     >
                       {pref}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button (Save) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-4 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};
