export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes logo-breathe {
          0%, 100% { opacity: 0.25; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <img
          src="/images/logo/logo.png"
          alt="Viking Tin"
          className="h-24 w-auto object-contain"
          style={{ animation: "logo-breathe 1.8s ease-in-out infinite" }}
        />
      </div>
    </>
  );
}
