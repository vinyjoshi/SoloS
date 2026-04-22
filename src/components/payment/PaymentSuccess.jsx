export default function PaymentSuccess({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-zinc-900 border border-emerald-500/30 p-8 rounded-2xl max-w-sm text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Pro!</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          Your payment was successful. You now have full access to all SoloS Pro features.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
