import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FaMapMarkerAlt, FaRunning, FaClock, FaTrophy, FaInfo } from 'react-icons/fa';

const SwipeCard = ({ user, onSwipe, onInfoClick }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (_, info) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    // Safe destructuring
    const {
        name = 'Gym Buddy',
        profile = {},
        matchPercentage = 94
    } = user || {};

    const bgImage = profile.photos?.[0] || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop';

    const [isDragging, setIsDragging] = useState(false);

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
                setTimeout(() => setIsDragging(false), 100);
                handleDragEnd(e, info);
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing perspective-1000 z-20"
            onClick={() => {
                if (!isDragging && onInfoClick) {
                    onInfoClick();
                }
            }}
        >
            <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl bg-gray-900 border border-gray-800 select-none pointer-events-auto">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />

                {/* Simplified Gradients for Depth */}
                <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="absolute bottom-0 w-full h-3/4 bg-gradient-to-t from-black via-black/80 to-transparent" />

                {/* Match Percentage Badge (Top Right) */}
                <div className="absolute top-6 right-6 z-10">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-primary/50 shadow-[0_0_20px_rgba(37,244,92,0.15)]">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#25F45C]"></div>
                        <span className="text-white font-black text-sm tracking-wide">{matchPercentage}% Match</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="absolute bottom-0 w-full p-6 flex flex-col z-10">

                    <div className="flex items-end justify-between mb-3">
                        <div className="flex flex-col">
                            <h2 className="text-4xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-xl flex items-center gap-3">
                                {name}<span className="text-white/50 font-medium text-2xl tracking-normal"> {profile.age || 25}</span>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onInfoClick && onInfoClick();
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition text-white/80 text-xs border border-white/10"
                                >
                                    <FaInfo />
                                </button>
                            </h2>
                            <div className="flex items-center gap-2 text-gray-300 text-sm font-bold mt-2 uppercase tracking-wide">
                                <FaMapMarkerAlt className="text-primary" size={12} />
                                <span>{profile.city || 'GymSync Member'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chips / Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { icon: <FaRunning />, label: profile.gymType || 'Commercial' },
                            { icon: <FaTrophy />, label: profile.gymPersonality || 'Member' },
                            { icon: <FaClock />, label: profile.commitment || 'Casual' },
                            ...(profile.goals?.slice(0, 1).map(g => ({ icon: <FaRunning />, label: g })) || [])
                        ].map((tag, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/5 text-[10px] font-bold text-white uppercase tracking-wider">
                                <span className={i === 0 ? "text-primary" : "text-gray-300"}>{tag.icon}</span>
                                <span>{tag.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bio Snippet with glass effect */}
                    <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/5">
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 italic font-medium">
                            "{profile.bio || "Ready to train hard. Let's hit the gym!"}"
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeCard;
