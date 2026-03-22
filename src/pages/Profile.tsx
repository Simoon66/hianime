import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Bookmark, Play, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const qWatchlist = query(
      collection(db, 'watchlist'),
      where('userId', '==', user.uid)
    );

    const unsubWatchlist = onSnapshot(qWatchlist, async (snap) => {
      try {
        const entries = await Promise.all(snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const animeRef = doc(db, 'anime', data.animeId);
          const animeSnap = await getDoc(animeRef);
          return {
            id: docSnap.id,
            ...data,
            anime: animeSnap.exists() ? { id: animeSnap.id, ...animeSnap.data() } : null
          };
        }));
        
        setWatchlist(entries.filter(e => e.anime));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'watchlist/anime');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'watchlist');
    });

    return () => unsubWatchlist();
  }, [user]);

  const handleRemoveFromWatchlist = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'watchlist', entryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `watchlist/${entryId}`);
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;

  const watching = watchlist.filter(e => e.status === 'Watching');
  const planToWatch = watchlist.filter(e => e.status === 'Plan to Watch');
  const completed = watchlist.filter(e => e.status === 'Completed');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 bg-[#141414] p-8 rounded-xl border border-white/5">
        <img 
          src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name}&background=random`} 
          alt={profile?.name} 
          className="w-24 h-24 rounded-full border-2 border-rose-500"
          referrerPolicy="no-referrer"
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black text-white mb-1">{profile?.name}</h1>
          <p className="text-zinc-400 text-sm mb-4">{profile?.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900/50 px-3 py-1.5 rounded border border-white/5">
              <Play className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-white">{watching.length}</span> Watching
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900/50 px-3 py-1.5 rounded border border-white/5">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">{planToWatch.length}</span> Plan to Watch
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900/50 px-3 py-1.5 rounded border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">{completed.length}</span> Completed
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <WatchlistSection title="Currently Watching" icon={<Play className="w-6 h-6 text-rose-500" />} entries={watching} onRemove={handleRemoveFromWatchlist} />
        <WatchlistSection title="Plan to Watch" icon={<Bookmark className="w-6 h-6 text-emerald-400" />} entries={planToWatch} onRemove={handleRemoveFromWatchlist} />
        <WatchlistSection title="Completed" icon={<CheckCircle2 className="w-6 h-6 text-blue-400" />} entries={completed} onRemove={handleRemoveFromWatchlist} />
      </div>
    </motion.div>
  );
}

function WatchlistSection({ title, icon, entries, onRemove }: { title: string, icon: React.ReactNode, entries: any[], onRemove: (id: string) => void, key?: any }) {
  if (entries.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {entries.map(entry => (
          <div key={entry.id} className="flex gap-4 bg-[#141414] p-3 rounded-lg border border-white/5 hover:border-rose-500/50 transition-colors group">
            <Link to={`/anime/${entry.anime.id}`} className="w-20 h-28 shrink-0 rounded overflow-hidden relative">
              <img 
                src={entry.anime.posterUrl || `https://picsum.photos/seed/${entry.anime.id}/200/300`} 
                alt={entry.anime.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-current" />
              </div>
            </Link>
            <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
              <div>
                <Link to={`/anime/${entry.anime.id}`} className="text-sm font-bold text-zinc-200 line-clamp-2 group-hover:text-rose-400 transition-colors">
                  {entry.anime.title}
                </Link>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1.5">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(entry.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                  {entry.episodesWatched} Episodes
                </span>
                <button 
                  onClick={() => onRemove(entry.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                  title="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
