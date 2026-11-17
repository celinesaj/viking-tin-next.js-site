'use client';

type AgeGateProps = {
  onConfirm: () => void;
  onReject: () => void;
};

export default function AgeGate({ onConfirm, onReject }: AgeGateProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-lg animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold text-gray-900">Age verification</h2>
        <p className="mt-2 text-sm text-gray-500">
          You must be 21 or older to enter.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black hover:ring-1 hover:ring-black"
          >
            Yes, I am
          </button>

          <button
            onClick={onReject}
            className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black ring-1 ring-gray-300 transition-all duration-200 hover:bg-black hover:text-white hover:ring-black"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}