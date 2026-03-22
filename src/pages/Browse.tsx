import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function Browse() {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

  useEffect(() => {
    let q = query(collection(db, 'anime'), orderBy('createdAt', 'desc'));

    if (selectedGenre) {
      q = query(collection(db, 'anime'), where('genres', 'array-contains', selectedGenre));
    }

    const unsub = onSnapshot(q, (snap) => {
      setAnimeList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'anime');
    });

    return () => unsub();
  }, [selectedGenre]);

  const filteredAnime = animeList.filter(anime => 
    anime.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <h1 className="text-4xl font-black text-white tracking-tight">Browse Catalog</h1>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl leading-5 bg-[#141414] text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-all"
            placeholder="Search anime by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-white font-bold">
              <Filter className="w-5 h-5 text-rose-500" />
              Genres
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${!selectedGenre ? 'bg-rose-500 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                All
              </button>
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${selectedGenre === genre ? 'bg-rose-500 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-zinc-500 text-center py-20">Loading...</div>
          ) : filteredAnime.length === 0 ? (
            <div className="text-zinc-500 text-center py-20">No anime found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAnime.map(anime => (
                <Link key={anime.id} to={`/anime/${anime.id}`} className="group relative rounded-lg overflow-hidden bg-[#141414] aspect-[2/3] block border border-white/5">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
