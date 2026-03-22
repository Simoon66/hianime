import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { ShieldAlert, Plus, Edit2, Trash2, Video, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'anime' | 'episodes'>('anime');
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAnimeForm, setShowAnimeForm] = useState(false);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [animeForm, setAnimeForm] = useState({
    title: '', description: '', releaseDate: '', status: 'Ongoing', posterUrl: '', rating: 0, isTrending: false, sliderOrder: 0, genres: '', tags: ''
  });

  const [episodeForm, setEpisodeForm] = useState({
    animeId: '', episodeNumber: 1, title: '', videoUrl: '', duration: 0
  });

  useEffect(() => {
    if (!isAdmin) return;

    const qAnime = query(collection(db, 'anime'), orderBy('createdAt', 'desc'));
    const unsubAnime = onSnapshot(qAnime, (snap) => {
      setAnimeList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'anime'));

    const qEpisodes = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'));
    const unsubEpisodes = onSnapshot(qEpisodes, (snap) => {
      setEpisodesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'episodes'));

    return () => {
      unsubAnime();
      unsubEpisodes();
    };
  }, [isAdmin]);

  const handleAnimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...animeForm,
        rating: Number(animeForm.rating),
        sliderOrder: Number(animeForm.sliderOrder),
        genres: animeForm.genres.split(',').map(g => g.trim()).filter(Boolean),
        tags: animeForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'anime', editingId), data);
      } else {
        await addDoc(collection(db, 'anime'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      setShowAnimeForm(false);
      setEditingId(null);
      setAnimeForm({ title: '', description: '', releaseDate: '', status: 'Ongoing', posterUrl: '', rating: 0, isTrending: false, sliderOrder: 0, genres: '', tags: '' });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'anime');
    }
  };

  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...episodeForm,
        episodeNumber: Number(episodeForm.episodeNumber),
        duration: Number(episodeForm.duration),
      };

      if (editingId) {
        await updateDoc(doc(db, 'episodes', editingId), data);
      } else {
        await addDoc(collection(db, 'episodes'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      setShowEpisodeForm(false);
      setEditingId(null);
      setEpisodeForm({ animeId: '', episodeNumber: 1, title: '', videoUrl: '', duration: 0 });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'episodes');
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  if (authLoading || loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <ShieldAlert className="w-10 h-10 text-amber-500" />
        <div>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-zinc-400">Manage anime catalog and episodes</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('anime')}
          className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'anime' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Anime Catalog
        </button>
        <button
          onClick={() => setActiveTab('episodes')}
          className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'episodes' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Episodes
        </button>
      </div>

      {activeTab === 'anime' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">All Anime ({animeList.length})</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setAnimeForm({ title: '', description: '', releaseDate: '', status: 'Ongoing', posterUrl: '', rating: 0, isTrending: false, sliderOrder: 0, genres: '', tags: '' });
                setShowAnimeForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Anime
            </button>
          </div>

          {showAnimeForm && (
            <form onSubmit={handleAnimeSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Anime' : 'Add New Anime'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Title" value={animeForm.title} onChange={e => setAnimeForm({...animeForm, title: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <select value={animeForm.status} onChange={e => setAnimeForm({...animeForm, status: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white">
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
                <input type="text" placeholder="Release Date (YYYY-MM-DD)" value={animeForm.releaseDate} onChange={e => setAnimeForm({...animeForm, releaseDate: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Poster URL" value={animeForm.posterUrl} onChange={e => setAnimeForm({...animeForm, posterUrl: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input type="number" step="0.1" min="0" max="10" placeholder="Rating (0-10)" value={animeForm.rating} onChange={e => setAnimeForm({...animeForm, rating: Number(e.target.value)})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Genres (comma separated)" value={animeForm.genres} onChange={e => setAnimeForm({...animeForm, genres: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Tags (comma separated)" value={animeForm.tags} onChange={e => setAnimeForm({...animeForm, tags: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <label className="flex items-center gap-2 text-zinc-300">
                  <input type="checkbox" checked={animeForm.isTrending} onChange={e => setAnimeForm({...animeForm, isTrending: e.target.checked})} className="rounded border-zinc-700 text-rose-500 bg-zinc-900" />
                  Is Trending
                </label>
                {animeForm.isTrending && (
                  <input type="number" placeholder="Slider Order" value={animeForm.sliderOrder} onChange={e => setAnimeForm({...animeForm, sliderOrder: Number(e.target.value)})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                )}
              </div>
              <textarea required placeholder="Description" value={animeForm.description} onChange={e => setAnimeForm({...animeForm, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white min-h-[100px]" />
              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => setShowAnimeForm(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950 text-zinc-300 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {animeList.map(anime => (
                  <tr key={anime.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <img src={anime.posterUrl || `https://picsum.photos/seed/${anime.id}/40/60`} alt="" className="w-10 h-14 object-cover rounded" referrerPolicy="no-referrer" />
                      {anime.title}
                    </td>
                    <td className="px-6 py-4">{anime.status}</td>
                    <td className="px-6 py-4">{anime.rating}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => {
                        setAnimeForm({ title: anime.title, description: anime.description, releaseDate: anime.releaseDate || '', status: anime.status, posterUrl: anime.posterUrl || '', rating: anime.rating || 0, isTrending: anime.isTrending || false, sliderOrder: anime.sliderOrder || 0, genres: (anime.genres || []).join(', '), tags: (anime.tags || []).join(', ') });
                        setEditingId(anime.id);
                        setShowAnimeForm(true);
                      }} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg mr-2"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('anime', anime.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'episodes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">All Episodes ({episodesList.length})</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setEpisodeForm({ animeId: '', episodeNumber: 1, title: '', videoUrl: '', duration: 0 });
                setShowEpisodeForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Episode
            </button>
          </div>

          {showEpisodeForm && (
            <form onSubmit={handleEpisodeSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Episode' : 'Add New Episode'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select required value={episodeForm.animeId} onChange={e => setEpisodeForm({...episodeForm, animeId: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white">
                  <option value="">Select Anime</option>
                  {animeList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Episode Number" value={episodeForm.episodeNumber} onChange={e => setEpisodeForm({...episodeForm, episodeNumber: Number(e.target.value)})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input required type="text" placeholder="Episode Title" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input required type="text" placeholder="Video URL (HLS .m3u8 or MP4)" value={episodeForm.videoUrl} onChange={e => setEpisodeForm({...episodeForm, videoUrl: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
                <input type="number" placeholder="Duration (seconds)" value={episodeForm.duration} onChange={e => setEpisodeForm({...episodeForm, duration: Number(e.target.value)})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => setShowEpisodeForm(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950 text-zinc-300 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Anime</th>
                  <th className="px-6 py-4">Ep #</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {episodesList.map(ep => {
                  const anime = animeList.find(a => a.id === ep.animeId);
                  return (
                    <tr key={ep.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{anime?.title || 'Unknown Anime'}</td>
                      <td className="px-6 py-4">{ep.episodeNumber}</td>
                      <td className="px-6 py-4">{ep.title}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => {
                          setEpisodeForm({ animeId: ep.animeId, episodeNumber: ep.episodeNumber, title: ep.title, videoUrl: ep.videoUrl, duration: ep.duration || 0 });
                          setEditingId(ep.id);
                          setShowEpisodeForm(true);
                        }} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg mr-2"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('episodes', ep.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
