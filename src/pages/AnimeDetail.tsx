import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Play, Star, Calendar, BookmarkPlus, Check, Clock, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [watchlistEntry, setWatchlistEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAnime = async () => {
      try {
        const docRef = doc(db, 'anime', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnime({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `anime/${id}`);
      }
    };

    fetchAnime();

    const qEpisodes = query(
      collection(db, 'episodes'),
      where('animeId', '==', id)
    );

    const unsubEpisodes = onSnapshot(qEpisodes, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      docs.sort((a, b) => a.episodeNumber - b.episodeNumber);
      setEpisodes(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'episodes');
    });

    return () => unsubEpisodes();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    const qWatchlist = query(
      collection(db, 'watchlist'),
      where('userId', '==', user.uid),
      where('animeId', '==', id)
    );

    const unsubWatchlist = onSnapshot(qWatchlist, (snap) => {
      if (!snap.empty) {
        setWatchlistEntry({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setWatchlistEntry(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'watchlist');
    });

    return () => unsubWatchlist();
  }, [user, id]);

  const handleAddToWatchlist = async (status: string) => {
    if (!user || !id) return;
    
    try {
      const entryId = watchlistEntry?.id || `${user.uid}_${id}`;
      const ref = doc(db, 'watchlist', entryId);
      
      await setDoc(ref, {
        userId: user.uid,
        animeId: id,
        status,
        episodesWatched: watchlistEntry?.episodesWatched || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `watchlist/${user.uid}_${id}`);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!anime) return <div className="flex h-screen items-center justify-center">Anime not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      {/* Hero Banner */}
      <div className="relative h-[40vh] w-full overflow-hidden -mt-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent z-10" />
        <img 
          src={anime.posterUrl || `https://picsum.photos/seed/${anime.id}/1920/1080?blur=4`}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster & Actions */}
          <div className="w-64 shrink-0 mx-auto md:mx-0">
            <div className="rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-white/5 aspect-[2/3] mb-6 relative">
              <img 
                src={anime.posterUrl || `https://picsum.photos/seed/${anime.id}/400/600`}
                alt={anime.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 w-full p-2 flex justify-center gap-2 bg-gradient-to-t from-black/90 to-transparent">
                <span className="px-2 py-0.5 bg-emerald-400 text-black text-xs font-bold rounded shadow-sm">
                  SUB {episodes.length}
                </span>
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded shadow-sm">
                  HD
                </span>
              </div>
            </div>

            {user && (
              <div className="space-y-3">
                <button 
                  onClick={() => handleAddToWatchlist(watchlistEntry?.status === 'Watching' ? 'Plan to Watch' : 'Watching')}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-colors ${
                    watchlistEntry?.status === 'Watching' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                      : 'bg-zinc-800 text-white hover:bg-rose-500'
                  }`}
                >
                  {watchlistEntry?.status === 'Watching' ? <Check className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                  {watchlistEntry?.status === 'Watching' ? 'Watching' : 'Add to List'}
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 pt-8 md:pt-16">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-white text-black text-xs font-bold rounded-sm">
                {anime.status}
              </span>
              {anime.rating && (
                <span className="flex items-center gap-1 text-black text-xs font-bold bg-yellow-400 px-2 py-0.5 rounded-sm">
                  <Star className="w-3 h-3 fill-current" /> {anime.rating}
                </span>
              )}
              {anime.releaseDate && (
                <span className="flex items-center gap-1 text-zinc-400 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> {anime.releaseDate.substring(0, 4)}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
              {anime.title}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              {episodes.length > 0 && (
                <Link 
                  to={`/play/${episodes[0].id}`}
                  className="flex items-center gap-2 px-8 py-3 bg-rose-500 text-white hover:bg-rose-600 font-bold rounded-full transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </Link>
              )}
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-xl p-6 mb-8">
              <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                {anime.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex gap-2">
                  <span className="text-zinc-500 font-medium w-24">Type:</span>
                  <span className="text-zinc-200">TV</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-500 font-medium w-24">Status:</span>
                  <span className="text-zinc-200">{anime.status}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-500 font-medium w-24">Aired:</span>
                  <span className="text-zinc-200">{anime.releaseDate || 'Unknown'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-500 font-medium w-24">Genres:</span>
                  <div className="flex flex-wrap gap-1">
                    {anime.genres?.map((genre: string) => (
                      <span key={genre} className="text-rose-500 hover:underline cursor-pointer">
                        {genre}{anime.genres.indexOf(genre) < anime.genres.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes List */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-rose-500">Episodes</h2>
            <span className="text-zinc-500 text-sm ml-2">({episodes.length})</span>
          </div>

          {episodes.length === 0 ? (
            <div className="bg-[#141414] border border-white/5 rounded-xl p-12 text-center">
              <Info className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-300 mb-2">No Episodes Yet</h3>
              <p className="text-zinc-500">Episodes for this anime haven't been uploaded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {episodes.map((ep) => (
                <Link 
                  key={ep.id} 
                  to={`/play/${ep.id}`}
                  className="group flex items-center gap-3 p-3 bg-[#141414] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/50 rounded-lg transition-all"
                >
                  <div className="w-10 h-10 shrink-0 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-zinc-400 text-xs font-bold group-hover:text-rose-400 transition-colors">
                      EP {ep.episodeNumber}
                    </span>
                    <h4 className="text-zinc-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                      {ep.title || `Episode ${ep.episodeNumber}`}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
