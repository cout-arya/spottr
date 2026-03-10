import { FaDumbbell } from 'react-icons/fa';

const LoadingSpinner = ({ text = 'Loading...', fullScreen = true }) => {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-6 ${
                fullScreen ? 'w-full min-h-[60vh]' : 'w-full py-16'
            }`}
            id="loading-spinner"
        >
            {/* Animated Dumbbell Icon */}
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute w-24 h-24 rounded-full border-2 border-[#25F45C]/20 animate-ping" />
                {/* Inner glow ring */}
                <div className="absolute w-20 h-20 rounded-full border-2 border-[#25F45C]/30 animate-pulse" />
                {/* Dumbbell icon container */}
                <div className="relative w-16 h-16 rounded-full bg-[#25F45C]/10 flex items-center justify-center animate-bounce-slow">
                    <FaDumbbell className="text-3xl text-[#25F45C] animate-spin-slow" />
                </div>
            </div>

            {/* Loading text with shimmer */}
            <div className="flex flex-col items-center gap-2">
                <p className="text-white font-semibold text-lg tracking-wider animate-pulse">
                    {text}
                </p>
                {/* Progress bar */}
                <div className="w-40 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-[#25F45C] to-transparent rounded-full animate-loading-bar" />
                </div>
            </div>

            {/* Inline styles for custom animations */}
            <style>{`
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(-12px);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
