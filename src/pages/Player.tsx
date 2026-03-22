import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Play, ArrowLeft, MessageSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export default function Player() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const [episode, setEpisode] = useState<any>(null);
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!episodeId) return;

    const fetchEpisodeAndAnime = async () => {
      try {
        const epRef = doc(db, 'episodes', episodeId);
        const epSnap = await getDoc(epRef);
        if (epSnap.exists()) {
          const epData = { id: epSnap.id, ...(epSnap.data() as any) };
          setEpisode(epData);

          const animeRef = doc(db, 'anime', epData.animeId);
          const animeSnap = await getDoc(animeRef);
          if (animeSnap.exists()) {
            setAnime({ id: animeSnap.id, ...animeSnap.data() });
          }

          const qEpisodes = query(
            collection(db, 'episodes'),
            where('animeId', '==', epData.animeId),
            orderBy('episodeNumber', 'asc')
          );
          
          const unsubEpisodes = onSnapshot(qEpisodes, (snap) => {
            setEpisodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'episodes');
          });

          return () => unsubEpisodes();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `episodes/${episodeId}`);
      }
    };

    fetchEpisodeAndAnime();

    const qComments = query(
      collection(db, 'comments'),
      where('episodeId', '==', episodeId)
    );

    const unsubComments = onSnapshot(qComments, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'comments');
    });

    return () => unsubComments();
  }, [episodeId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !episodeId || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        userId: user.uid,
        authorName: profile.name,
        authorAvatarUrl: profile.avatarUrl || '',
        episodeId,
        content: newComment.trim(),
        isSpoiler,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      setIsSpoiler(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!episode || !anime) return <div className="flex h-screen items-center justify-center">Episode not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#0f0f0f]">
      {/* Breadcrumb & Title */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Link to="/" className="hover:text-rose-500 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-rose-500 transition-colors">Anime</Link>
          <span>/</span>
          <Link to={`/anime/${anime.id}`} className="hover:text-rose-500 transition-colors truncate max-w-[200px]">{anime.title}</Link>
          <span>/</span>
          <span className="text-white">Episode {episode.episodeNumber}</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Player Area */}
          <div className="flex-1">
            <div className="bg-black aspect-video w-full relative rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
              <video 
                ref={videoRef}
                src={episode.videoUrl} 
                controls 
                className="w-full h-full"
                poster={`https://picsum.photos/seed/${episode.id}/1920/1080`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="mt-4 bg-[#141414] border border-white/5 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">{anime.title}</h1>
                <p className="text-zinc-400 text-sm">Episode {episode.episodeNumber}: {episode.title || `Episode ${episode.episodeNumber}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Report
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-bold text-rose-500">Comments</h2>
                <span className="text-zinc-500 text-sm ml-2">({comments.length})</span>
              </div>

              {user ? (
                <form onSubmit={handlePostComment} className="mb-8 bg-[#141414] border border-white/5 p-4 rounded-lg">
                  <div className="flex gap-4">
                    <img 
                      src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name}&background=random`} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded border border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 min-h-[80px] resize-y mb-3 text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isSpoiler}
                            onChange={(e) => setIsSpoiler(e.target.checked)}
                            className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500 bg-zinc-900"
                          />
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Contains spoilers
                        </label>
                        <button 
                          type="submit"
                          disabled={!newComment.trim()}
                          className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded transition-colors"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-8 bg-[#141414] border border-white/5 p-6 rounded-lg text-center">
                  <p className="text-zinc-400 text-sm">You must be logged in to post a comment.</p>
                </div>
              )}

              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    isOwner={user?.uid === comment.userId}
                    isAdmin={isAdmin}
                    onDelete={() => handleDeleteComment(comment.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Episodes */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-[#141414] border border-white/5 rounded-lg overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-white/5 bg-zinc-900/50">
                <h3 className="font-bold text-white mb-1">List of Episodes</h3>
                <p className="text-xs text-zinc-400 truncate">{anime.title}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {episodes.map((ep) => (
                  <Link 
                    key={ep.id} 
                    to={`/play/${ep.id}`}
                    className={`flex items-center gap-3 p-2 rounded transition-colors ${
                      ep.id === episodeId 
                        ? 'bg-rose-500 text-white' 
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded flex items-center justify-center text-xs font-bold ${
                      ep.id === episodeId ? 'bg-white/20' : 'bg-zinc-800'
                    }`}>
                      {ep.episodeNumber}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {ep.title || `Episode ${ep.episodeNumber}`}
                      </span>
                      {ep.id === episodeId && (
                        <span className="text-[10px] uppercase tracking-wider opacity-80">Playing</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CommentItem({ comment, isOwner, isAdmin, onDelete }: { comment: any, isOwner: boolean, isAdmin: boolean, onDelete: () => void, key?: any }) {
  const [showSpoiler, setShowSpoiler] = useState(false);

  return (
    <div className="flex gap-4 p-4 bg-[#141414] border border-white/5 rounded-lg">
      <img 
        src={comment.authorAvatarUrl || `https://ui-avatars.com/api/?name=${comment.authorName}&background=random`} 
        alt={comment.authorName} 
        className="w-10 h-10 rounded border border-white/10 shrink-0"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200 text-sm">{comment.authorName}</span>
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          {(isOwner || isAdmin) && (
            <button 
              onClick={onDelete}
              className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
              title="Delete comment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {comment.isSpoiler && !showSpoiler ? (
          <div 
            onClick={() => setShowSpoiler(true)}
            className="cursor-pointer bg-zinc-900/50 border border-white/5 p-3 rounded flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 transition-colors mt-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Spoiler hidden. Click to reveal.</span>
          </div>
        ) : (
          <div className="mt-1">
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
