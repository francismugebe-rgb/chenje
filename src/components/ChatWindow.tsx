import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, onSnapshot, orderBy, addDoc, 
  serverTimestamp, doc, updateDoc, increment, getDoc 
} from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Message, UserProfile, Match } from '../types';
import { 
  ChevronLeft, Send, Image as ImageIcon, Smile, 
  MoreVertical, Phone, Video, Check, CheckCheck, 
  PhoneCall, ShieldCheck, MapPin, Sparkles, AlertCircle
} from 'lucide-react';

export const ChatWindow = ({ 
  matchId, 
  otherUser, 
  onBack,
  onUpgrade
}: { 
  matchId: string; 
  otherUser?: UserProfile; 
  onBack: () => void;
  onUpgrade: () => void;
}) => {
  const { user, profile: myProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const msgRef = doc(db, 'matches', matchId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;

      const currentReactions = msgSnap.data().reactions || {};
      const users = currentReactions[emoji] || [];
      
      let nextUsers;
      if (users.includes(user.uid)) {
        nextUsers = users.filter((id: string) => id !== user.uid);
      } else {
        nextUsers = [...users, user.uid];
      }

      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: nextUsers
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!matchId) return;

    // Listen for messages
    const q = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Listen for match data (for limits/counts)
    const unsubMatch = onSnapshot(doc(db, 'matches', matchId), (d) => {
      setMatchData(d.data() as Match);
    });

    // Fetch whatsapp if premium
    if (myProfile?.premiumTier !== 'free' && otherUser) {
        getDoc(doc(db, 'whatsappNumbers', otherUser.uid)).then(snap => {
            if (snap.exists()) setWhatsapp(snap.data().number);
        });
    }

    return () => {
      unsubMessages();
      unsubMatch();
    };
  }, [matchId, myProfile, otherUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !matchData) return;

    // Check tier limits
    const isPremium = myProfile?.premiumTier !== 'free';
    const myCount = matchData.messageCount?.[user.uid] || 0;
    
    if (!isPremium && myCount >= 1) {
       alert("Free users are limited to 1 message. Upgrade to Pro to chat unlimitedly!");
       return;
    }

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        senderId: user.uid,
        text,
        status: 'sent',
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'matches', matchId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        [`messageCount.${user.uid}`]: increment(1),
        [`unreadCount.${otherUser?.uid}`]: increment(1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isLimitReached = myProfile?.premiumTier === 'free' && (matchData?.messageCount?.[user?.uid || ''] || 0) >= 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#e5ddd5] flex flex-col font-sans">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} />
      {/* Header */}
      <header className="h-20 bg-white/90 backdrop-blur-md border-b border-rose-50 flex items-center px-4 md:px-8 shrink-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-full text-gray-500 mr-4 transition-all">
          <ChevronLeft size={24} />
        </button>

        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white rotate-2">
            <img 
               src={otherUser?.photos?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100'} 
               className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-lg font-black text-gray-900 tracking-tight italic uppercase">{otherUser?.firstName}</h2>
               {otherUser?.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
            </div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {whatsapp ? (
             <a 
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100 hover:scale-110 transition-transform"
             >
                <PhoneCall size={20} />
             </a>
           ) : (
             <button className="p-3 bg-gray-100 text-gray-400 rounded-2xl cursor-not-allowed opacity-50 grayscale">
                <Phone size={20} />
             </button>
           )}
           <button className="p-3 text-gray-400 hover:bg-rose-50 rounded-full transition-all">
              <MoreVertical size={20} />
           </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 bg-slate-50">
        <div className="flex justify-center mb-10">
           <div className="px-6 py-2 bg-rose-100/50 rounded-full border border-rose-200">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-center flex items-center gap-2">
                 <ShieldCheck size={12} />
                 End-to-end Bloom encryption
              </p>
           </div>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.uid;
          const showTime = i === 0 || (msg.timestamp?.seconds - messages[i-1].timestamp?.seconds > 300);
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 relative group`}>
              {showTime && (
                <div className="w-full text-center py-4">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[.2em]">
                    {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                  </span>
                </div>
              )}
              
              <div className="relative group max-w-[85%] md:max-w-[70%]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  onClick={() => setReactionTargetId(reactionTargetId === msg.id ? null : msg.id)}
                  className={`p-3 md:p-4 rounded-2xl text-sm font-medium shadow-sm relative
                    ${isMe 
                      ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                >
                  {msg.text}
                  <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] text-gray-400">
                    <span>
                        {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {isMe && (
                        msg.status === 'read' ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} />
                    )}
                  </div>
                </motion.div>

                {/* Reactions Display */}
                {msg.reactions && Object.entries(msg.reactions).some(([_, uids]) => (uids as string[]).length > 0) && (
                  <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm scale-90`}>
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (uids as string[]).length > 0 && (
                      <span key={emoji} className="text-xs">{emoji}</span>
                    ))}
                    <span className="text-[8px] font-bold text-gray-400 ml-1">
                      {(Object.values(msg.reactions).flat() as string[]).length}
                    </span>
                  </div>
                )}

                {/* Reaction Picker */}
                <AnimatePresence>
                  {reactionTargetId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: isMe ? 20 : 20, x: isMe ? -20 : 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white shadow-xl border border-gray-100 rounded-full p-1.5 flex gap-2 items-center`}
                    >
                      {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={(e) => {
                            e.stopPropagation();
                            addReaction(msg.id, emoji);
                            setReactionTargetId(null);
                          }}
                          className="hover:scale-125 transition-transform p-1 text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 md:p-10 bg-white border-t border-rose-50 shrink-0">
        {isLimitReached ? (
           <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-200">
                    <AlertCircle size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-gray-900 italic uppercase">Daily Limit Reached</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Upgrade to Premium to chat unlimitedly</p>
                 </div>
              </div>
              <button 
                onClick={onUpgrade}
                className="bg-rose-500 text-white px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:scale-105 transition-transform"
              >
                Upgrade Now
              </button>
           </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-4">
            <button type="button" className="p-4 text-gray-400 hover:bg-rose-50 rounded-2xl transition-all">
              <Smile size={24} />
            </button>
            <button type="button" className="p-4 text-gray-400 hover:bg-rose-50 rounded-2xl transition-all">
              <ImageIcon size={24} />
            </button>
            <div className="flex-1 relative">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-slate-50 p-5 px-8 rounded-3xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className={`p-5 rounded-3xl transition-all shadow-xl
                ${inputText.trim() 
                  ? 'bg-rose-500 text-white shadow-rose-200 hover:scale-110 active:scale-95' 
                  : 'bg-slate-100 text-slate-300'
                }`}
            >
              <Send size={24} />
            </button>
          </form>
        )}
      </footer>
    </div>
  );
};
