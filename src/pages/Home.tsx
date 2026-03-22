import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Play, TrendingUp, Star, Calendar, ChevronRight, List } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qTrending = query(
      collection(db, 'anime'),
      where('isTrending', '==', true)
    );

    const unsubTrending = onSnapshot(qTrending, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      docs.sort((a, b) => (a.sliderOrder || 0) - (b.sliderOrder || 0));
      setTrending(docs.slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'anime');
    });

    const qRecent = query(
      collection(db, 'anime'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubRecent = onSnapshot(qRecent, (snap) => {
      setRecent(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'anime');
    });

    return () => {
      unsubTrending();
      unsubRecent();
    };
  }, []);

  if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading...</div>;

  const heroAnime = trending[0] || recent[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      {/* Hero Section */}
      {heroAnime && (
        <div className="relative h-[60vh] w-full overflow-hidden -mt-16">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent z-10" />
          <img 
            src={heroAnime.posterUrl || `https://picsum.photos/seed/${heroAnime.id}/1920/1080?blur=4`}
            alt={heroAnime.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 left-0 right-0 z-20 w-full p-8 md:p-16 max-w-[1600px] mx-auto flex flex-col justify-end h-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-rose-500 text-black text-xs font-bold rounded-md">
                {heroAnime.status}
              </span>
              <span className="px-2 py-0.5 bg-white text-black text-xs font-bold rounded-md flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> {heroAnime.rating || 'N/A'}
              </span>
              <span className="px-2 py-0.5 bg-zinc-800 text-white text-xs font-bold rounded-md">
                HD
              </span>
              <span className="px-2 py-0.5 bg-emerald-400 text-black text-xs font-bold rounded-md">
                SUB
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight max-w-3xl line-clamp-2">
              {heroAnime.title}
            </h1>
            <p className="text-zinc-300 text-sm md:text-base max-w-2xl mb-8 line-clamp-3">
              {heroAnime.description}
            </p>
            <div className="flex items-center gap-4">
              <Link 
                to={`/anime/${heroAnime.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white hover:bg-rose-600 font-bold rounded-full transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </Link>
              <Link 
                to={`/anime/${heroAnime.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white hover:bg-white/20 font-bold rounded-full transition-colors backdrop-blur-sm"
              >
                Detail <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area (75%) */}
        <div className="flex-1 space-y-12">
          {/* Trending Section */}
          {trending.length > 1 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-rose-500">Trending</h2>
                <Link to="/browse" className="text-sm text-zinc-400 hover:text-rose-500 flex items-center">View more <ChevronRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {trending.slice(1).map(anime => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </section>
          )}

          {/* Recently Added */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-rose-500">Recently Updated</h2>
              <Link to="/browse" className="text-sm text-zinc-400 hover:text-rose-500 flex items-center">View more <ChevronRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {recent.map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar (25%) */}
        <div className="w-full lg:w-80 shrink-0 space-y-8">
          <div className="bg-[#141414] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold text-rose-500">Top 10</h2>
            </div>
            <div className="space-y-4">
              {recent.slice(0, 10).map((anime, index) => (
                <Link to={`/anime/${anime.id}`} key={anime.id} className="flex gap-4 group">
                  <div className="w-12 text-2xl font-black text-zinc-700 group-hover:text-rose-500 transition-colors flex items-center justify-center border-b border-zinc-800">
                    {index + 1}
                  </div>
                  <div className="flex-1 flex gap-3 border-b border-zinc-800 pb-4">
                    <img 
                      src={anime.posterUrl || `https://picsum.photos/seed/${anime.id}/100/150`}
                      alt={anime.title}
                      className="w-12 h-16 object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-zinc-200 group-hover:text-rose-500 line-clamp-2 transition-colors">{anime.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-zinc-500">{anime.status}</span>
                        <span className="flex items-center gap-1 text-zinc-400"><Star className="w-3 h-3 text-yellow-500" /> {anime.rating || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function AnimeCard({ anime }: { anime: any; key?: any }) {
  return (
    <Link to={`/anime/${anime.id}`} className="group relative rounded-lg overflow-hidden bg-[#141414] aspect-[2/3] block border border-white/5">
      <img 
        src={anime.posterUrl || `https://picsum.photos/seed/${anime.id}/400/600`}
        alt={anime.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <span className="px-1.5 py-0.5 bg-emerald-400 text-black text-[10px] font-bold rounded shadow-sm">
          SUB
        </span>
        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded shadow-sm">
          HD
        </span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <h3 className="text-white font-bold text-sm line-clamp-2 mb-1 group-hover:text-rose-500 transition-colors">{anime.title}</h3>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
          <span>{anime.releaseDate?.substring(0, 4) || 'TBA'}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
          <span>{anime.status}</span>
        </div>
      </div>
    </Link>
  );
}
