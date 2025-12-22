import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FaMapMarkerAlt, FaRunning, FaClock, FaTrophy, FaInfo } from 'react-icons/fa';

const SwipeCard = ({ user, onSwipe, onInfoClick }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Dynamic Overlay Opacities
    const likeOpacity = useTransform(x, [10, 150], [0, 0.5]);
    const nopeOpacity = useTransform(x, [-10, -150], [0, 0.5]);

    // Scale effect creates a "lifting" feel during swipe
    const scale = useTransform(x, [-200, 0, 200], [1.05, 1, 1.05]);

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

    const hasPhoto = profile.photos && profile.photos.length > 0;

    const [isDragging, setIsDragging] = useState(false);

    return (
        <motion.div
            style={{ x, rotate, opacity, scale }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            whileTap={{ cursor: "grabbing" }}
            initial={{ scale: 0.95, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
            <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl bg-gray-900 border border-gray-800 select-none pointer-events-auto group">

                {/* Visual Overlays for Swipe Feedback */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-green-500 z-30 pointer-events-none mix-blend-overlay" />
                <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 bg-red-500 z-30 pointer-events-none mix-blend-overlay" />

                {/* LIKE / NOPE Stamps */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 z-40 border-4 border-green-500 rounded-lg px-4 py-2 -rotate-12">
                    <span className="text-green-500 font-black text-4xl uppercase tracking-widest">Like</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 z-40 border-4 border-red-500 rounded-lg px-4 py-2 rotate-12">
                    <span className="text-red-500 font-black text-4xl uppercase tracking-widest">Nope</span>
                </motion.div>

                {/* Background Image or Fallback */}
                {hasPhoto ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${profile.photos[0]})` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                        <FaRunning className="text-gray-800 text-9xl opacity-20 scale-150" />
                    </div>
                )}

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
                                <span>{profile.city || 'Spottr Member'}</span>
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
