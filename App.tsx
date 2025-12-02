import React, { useState, useEffect } from 'react';
import { User, JournalEntry, ViewState, MOOD_EMOJIS } from './types';
import * as storage from './services/storage';
import * as gemini from './services/gemini';
import { Button } from './components/Button';
import { Trash2, Plus, LogOut, ArrowLeft, Sparkles, Pencil, Calendar, Loader2, Hash, X, Filter } from 'lucide-react';

// --- Sub-Components ---

const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-electric-purple/20 rounded-full blur-[120px] animate-blob"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-acid-green/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
    <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
  </div>
);

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    if (!email || !password) {
      setError("Email and password are required, bestie.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { user, error } = await storage.loginUser(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError(error || "Invalid credentials. Try again?");
        }
      } else {
        if (!name) {
          setError("What should we call you?");
          setLoading(false);
          return;
        }
        const { success, error } = await storage.registerUser(email, name, password);
        if (success) {
          // In production, Supabase often requires email verification. 
          // Instead of auto-logging in (which might fail), we guide the user.
          setSuccessMsg("Account created! ✨ Please login.");
          setIsLogin(true);
          setPassword(''); 
        } else {
          setError(error || "Could not create user.");
        }
      }
    } catch (err) {
      setError("Something went wrong. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
      <div className="w-full max-w-md p-8 rounded-3xl bg-glass-surface backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in">
        <h1 className="text-4xl font-sans font-bold mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          {isLogin ? 'Welcome Back' : 'Join the Club'}
        </h1>
        <p className="text-zinc-400 mb-8 font-mono text-sm">
          {isLogin ? 'Your digital sanctuary awaits.' : 'Start documenting your main character energy.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1 ml-2">NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-acid-green/50 focus:ring-1 focus:ring-acid-green/50 transition-all placeholder-zinc-700"
                placeholder="e.g. Alex"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1 ml-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-acid-green/50 focus:ring-1 focus:ring-acid-green/50 transition-all placeholder-zinc-700"
              placeholder="alex@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1 ml-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-acid-green/50 focus:ring-1 focus:ring-acid-green/50 transition-all placeholder-zinc-700"
              placeholder="••••••••"
            />
          </div>

          {successMsg && <p className="text-acid-green text-sm font-mono bg-acid-green/10 p-3 rounded-xl border border-acid-green/20">{successMsg}</p>}
          {error && <p className="text-red-400 text-sm font-mono bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

          <Button type="submit" className="w-full mt-4" isLoading={loading}>
            {isLogin ? 'Enter Journal' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
            className="text-zinc-500 hover:text-white text-sm font-mono underline underline-offset-4 decoration-zinc-700 hover:decoration-white transition-all"
          >
            {isLogin ? "New here? Create account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

const JournalEditor = ({ 
  entry, 
  onSave, 
  onCancel, 
  userId 
}: { 
  entry?: JournalEntry, 
  onSave: () => void, 
  onCancel: () => void,
  userId: string 
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState<JournalEntry['mood']>(entry?.mood || 'neutral');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsight, setAiInsight] = useState(entry?.aiVibeCheck || '');

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);

    const newEntry: JournalEntry = {
      id: entry?.id || crypto.randomUUID(),
      userId,
      title,
      content,
      date: entry?.date || new Date().toISOString(),
      mood,
      tags,
      aiVibeCheck: aiInsight
    };

    await storage.saveEntry(newEntry);
    setIsSaving(false);
    onSave();
  };

  const handleVibeCheck = async () => {
    if (!content) return;
    setIsGenerating(true);
    const insight = await gemini.getVibeCheck(content);
    setAiInsight(insight);
    setIsGenerating(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold font-sans">
          {entry ? 'Edit Entry' : 'New Entry'}
        </h2>
        <Button onClick={handleSave} disabled={!title || !content} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title your thoughts..."
            className="w-full bg-transparent text-4xl md:text-5xl font-bold text-white placeholder-zinc-700 focus:outline-none font-sans"
          />

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(Object.keys(MOOD_EMOJIS) as Array<JournalEntry['mood']>).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  mood === m 
                    ? 'bg-white text-black border-white scale-105' 
                    : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-lg">{MOOD_EMOJIS[m]}</span>
                <span className="capitalize font-mono text-sm">{m}</span>
              </button>
            ))}
          </div>

          {/* Tags Input */}
          <div className="flex flex-wrap items-center gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm font-mono text-acid-green border border-white/5">
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
              </span>
            ))}
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5 text-zinc-400 focus-within:border-white/30 transition-colors">
              <Hash size={14} />
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags..."
                className="bg-transparent border-none outline-none text-sm font-mono w-24 text-white placeholder-zinc-600"
              />
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Spill the tea..."
            className="w-full h-[50vh] bg-transparent text-lg text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none font-mono leading-relaxed p-4 border border-white/5 rounded-2xl focus:bg-white/5 transition-all"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-glass-surface backdrop-blur-lg border border-white/10 p-6 rounded-3xl sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-acid-green" />
                AI Vibe Check
              </h3>
            </div>
            
            {aiInsight ? (
              <div className="mb-4">
                <p className="text-sm font-mono text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                  {aiInsight}
                </p>
                <div className="mt-2 flex justify-end">
                   <button onClick={() => setAiInsight('')} className="text-xs text-zinc-500 hover:text-white">Clear</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-600 font-mono text-sm border-2 border-dashed border-white/5 rounded-xl mb-4">
                Write something then hit the button for an AI analysis.
              </div>
            )}

            <Button 
              variant="secondary" 
              className="w-full text-sm" 
              onClick={handleVibeCheck}
              isLoading={isGenerating}
              disabled={!content.length}
            >
              Generate Check
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTagClick: (tag: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onClick, onDelete, onTagClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative p-6 bg-glass-surface backdrop-blur-md border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full min-h-[220px]"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-3xl filter drop-shadow-lg">{MOOD_EMOJIS[entry.mood]}</span>
        <span className="text-xs font-mono text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
          {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 font-sans group-hover:text-acid-green transition-colors">
        {entry.title}
      </h3>
      
      <p className="text-zinc-400 text-sm line-clamp-3 font-mono leading-relaxed mb-4 flex-grow">
        {entry.content}
      </p>

      {/* Tags Display */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
          {entry.tags.slice(0, 3).map(tag => (
            <button 
              key={tag} 
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="text-[10px] uppercase tracking-wider text-acid-green/80 bg-acid-green/10 px-2 py-1 rounded-md hover:bg-acid-green hover:text-black transition-colors"
            >
              #{tag}
            </button>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-[10px] text-zinc-500 py-1">+{entry.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
         {entry.aiVibeCheck ? <Sparkles size={14} className="text-acid-green" /> : <div />}
         <button 
          onClick={onDelete}
          className="p-2 bg-black/20 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('auth');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const currentUser = await storage.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setView('home');
        const data = await storage.getEntries();
        setEntries(data);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshEntries = async () => {
    const data = await storage.getEntries();
    setEntries(data);
  };

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    setView('home');
    await refreshEntries();
  };

  const handleLogout = async () => {
    await storage.logoutUser();
    setUser(null);
    setView('auth');
    setEntries([]);
    setFilterTag(null);
  };

  const handleSaveEntry = async () => {
    await refreshEntries();
    setView('home');
    setSelectedEntry(undefined);
  };

  const handleDeleteEntry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this memory?")) {
      await storage.deleteEntry(id);
      await refreshEntries();
    }
  };

  // Views

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="animate-spin text-acid-green" size={48} />
        </div>
      );
    }

    if (view === 'auth') return <AuthScreen onLogin={handleLogin} />;

    if (!user) return null;

    if (view === 'create' || view === 'edit') {
      return (
        <JournalEditor 
          entry={selectedEntry} 
          onSave={handleSaveEntry} 
          onCancel={() => { setView('home'); setSelectedEntry(undefined); }}
          userId={user.id}
        />
      );
    }

    const displayedEntries = filterTag 
      ? entries.filter(e => e.tags?.includes(filterTag)) 
      : entries;

    return (
      <div className="max-w-6xl mx-auto w-full animate-fade-in pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-bold font-sans tracking-tight mb-2">
              Hey, {user.name} <span className="inline-block animate-pulse">✨</span>
            </h1>
            <p className="text-zinc-400 font-mono">
              You have {entries.length} entries recorded.
            </p>
          </div>
          <div className="flex gap-4">
             <Button onClick={handleLogout} variant="ghost">
              <LogOut size={20} />
            </Button>
            <Button onClick={() => { setSelectedEntry(undefined); setView('create'); }}>
              <Plus size={20} /> New Entry
            </Button>
          </div>
        </header>

        {/* Filter Indicator */}
        {filterTag && (
          <div className="flex items-center gap-2 mb-8 animate-fade-in">
            <span className="text-zinc-400 font-mono text-sm flex items-center gap-2"><Filter size={14}/> Filtered by:</span>
            <button 
              onClick={() => setFilterTag(null)}
              className="flex items-center gap-2 bg-acid-green text-black px-4 py-2 rounded-full font-bold font-mono text-sm hover:opacity-90 transition-opacity"
            >
              #{filterTag} <X size={14} />
            </button>
          </div>
        )}

        {displayedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            {filterTag ? (
              <>
                 <div className="bg-acid-green/10 p-6 rounded-full mb-6">
                  <Hash size={40} className="text-acid-green" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No vibes found here.</h3>
                <p className="text-zinc-400 mb-8 font-mono">Try clearing the filter.</p>
                <Button onClick={() => setFilterTag(null)}>Clear Filter</Button>
              </>
            ) : (
              <>
                <div className="bg-acid-green/10 p-6 rounded-full mb-6">
                  <Pencil size={40} className="text-acid-green" />
                </div>
                <h3 className="text-2xl font-bold mb-2">It's quiet... too quiet.</h3>
                <p className="text-zinc-400 mb-8 font-mono">Start your first journal entry now.</p>
                <Button onClick={() => setView('create')}>Create Entry</Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEntries.map((entry) => (
              <EntryCard 
                key={entry.id} 
                entry={entry} 
                onClick={() => { setSelectedEntry(entry); setView('edit'); }}
                onDelete={(e) => handleDeleteEntry(e, entry.id)}
                onTagClick={(tag) => { setFilterTag(tag); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white relative selection:bg-acid-green selection:text-black">
      <Background />
      <div className="relative z-10 p-6 md:p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;