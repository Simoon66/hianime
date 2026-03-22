import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';
import { Play, Search, User, LogOut, ShieldAlert, Menu, Bell } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#141414] border-b border-white/5 shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-4 lg:gap-8">
            <button className="p-2 text-zinc-400 hover:text-white lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors">
              <Play className="w-7 h-7 fill-current" />
              <span className="font-black text-2xl tracking-tight text-white">Hi<span className="text-rose-500">Anime</span></span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-zinc-300">
              <Link to="/" className="hover:text-rose-500 transition-colors">Home</Link>
              <Link to="/browse" className="hover:text-rose-500 transition-colors">Movies</Link>
              <Link to="/browse" className="hover:text-rose-500 transition-colors">TV Series</Link>
              <Link to="/browse" className="hover:text-rose-500 transition-colors">Most Popular</Link>
              <Link to="/browse" className="hover:text-rose-500 transition-colors">Top Airing</Link>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border-none rounded-full py-2 pl-4 pr-10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-500">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <Link to="/admin" className="p-2 text-amber-400 hover:text-amber-300 transition-colors" title="Admin Dashboard">
                    <ShieldAlert className="w-5 h-5" />
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2">
                  <img 
                    src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name}&background=random`} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <button onClick={logout} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
