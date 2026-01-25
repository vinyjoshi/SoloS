const LoginPage = ({ onLogin, onDemoMode }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
      <img src="/SolOS.png" alt="SolOS Logo" className="w-full h-full object-cover"/>
    </div>
    
    <h1 className="text-4xl md:text-6xl font-bold text-zinc-600 mb-6 tracking-tight">
      Sol<span className="text-white">OS</span>
    </h1>
    
    <p className="text-zinc-400 max-w-md mb-12 text-lg leading-relaxed">
      The ruthlessly minimalist Operating System for Beginners. 
      Execution on the left. Strategy on the right.
    </p>
    
    {/* CONSTRAINED BUTTONS CONTAINER */}
    <div className="w-full max-w-xs space-y-3">
      {/* Google Sign In */}
      <button 
        onClick={onLogin}
        className="group relative flex items-center justify-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-200 active:scale-95 w-full"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="hidden sm:inline">Google</span>
        <span className="sm:hidden">Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-xs text-zinc-500 font-mono">OR</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* Demo Mode */}
      <button 
        onClick={onDemoMode}
        className="group relative flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all duration-200 active:scale-95 w-full"
      >
        <span className="hidden sm:inline">Guest Mode</span>
        <span className="sm:hidden">Demo</span>
      </button>
    </div>

    <div className="mt-12 text-xs text-zinc-600 font-mono">V3 • SECURE • ENCRYPTED</div>
  </div>
);

export default LoginPage;