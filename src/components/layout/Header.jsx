import { useRef, useState } from 'react';
import { Menu, User, DollarSign, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants';

const Header = ({
  user,
  synced,
  userTier,
  proExpiresAt,
  isDemoMode,
  setShowPricing,
  setIsMenuOpen,
  headerRef,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const profileMenuRef = useRef(null);

  return (
    <header
      ref={headerRef}
      data-header="main"
      className="relative overflow-visible border-b border-white/5 flex justify-center items-center sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md"
    >
      <div className="w-full max-w-5xl px-4 md:px-6 py-1 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <div className="w-13 h-12 bg-black text-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-white/15">
            <img src="/SolOS.png" alt="SolOS" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Sync indicator */}
          <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
            <div className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {synced ? 'Synced' : 'Saving'}
          </div>

          {/* Profile */}
          <div
            className="flex items-center gap-3 pl-4 border-l border-white/10 relative"
            ref={profileMenuRef}
          >
            <div className="hidden md:block text-right">
              <div className="text-xs font-medium text-white">{user.displayName}</div>
              <div className="text-[9px] text-zinc-500">{user.email}</div>
            </div>

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative group focus:outline-none"
            >
              {user.photoURL && !imageError ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-8 h-8 rounded-full border border-white/10 group-hover:border-white/30 transition-colors object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                  <User size={14} />
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Current Plan */}
                <div className="px-4 py-3 bg-zinc-800/50 border-b border-white/10">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Plan</div>
                  <div className="flex items-center gap-2">
                    {isDemoMode ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-emerald-400">Guest Mode</span>
                      </>
                    ) : userTier === 'pro' ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-bold text-emerald-400">SolOS Pro</span>
                        </div>
                        {proExpiresAt && (
                          <div className="text-[9px] text-zinc-500 ml-4">
                            Expires: {proExpiresAt.toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        <span className="text-sm font-bold text-zinc-400">Free Plan</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upgrade */}
                {!isDemoMode && userTier === 'free' && (
                  <button
                    onClick={() => { setShowPricing(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-3 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                  >
                    <DollarSign size={14} /> Upgrade to Pro
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={() => signOut(auth)}
                  className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />

          {/* Hamburger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
