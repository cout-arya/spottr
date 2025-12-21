import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaDumbbell, FaRulerCombined, FaFire, FaBed, FaBeer, FaSmoking, FaBrain, FaVenusMars, FaBullseye, FaHistory, FaCalendarAlt } from 'react-icons/fa';

const ProfileModal = ({ user, onClose }) => {
    if (!user) return null;

    const { profile } = user;
    const matchPercentage = user.matchPercentage || 95; // Default if not passed

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="w-full h-full md:h-[90vh] md:max-w-6xl bg-[#0F0F0F] md:rounded-[40px] overflow-hidden relative shadow-[0_0_50px_-12px_rgba(0,0,0,1)] border border-white/5 flex flex-col md:flex-row"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:bg-white hover:text-black transition-all duration-300 border border-white/10 group"
                    >
                        <FaTimes className="text-xl group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* LEFT COLUMN: Immersive Visuals (45%) */}
                    <div className="w-full md:w-[45%] h-[40vh] md:h-full relative shrink-0">
                        <img
                            src={profile.photos?.[0] || 'https://via.placeholder.com/800x1200'}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/30 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#0F0F0F]" />

                        {/* Mobile Overlay */}
                        <div className="absolute bottom-0 left-0 p-6 md:hidden z-10">
                            <h1 className="text-4xl font-black text-white leading-none tracking-tighter mb-1">{user.name}</h1>
                            <p className="text-lg text-gray-300 font-medium flex items-center gap-2">
                                {profile.age} • {profile.city}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content Scroll (55%) */}
                    <div className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#0F0F0F]">
                        <div className="p-6 md:p-12 space-y-10">

                            {/* Desktop Header */}
                            <div className="hidden md:block">
                                <h1 className="text-7xl font-black text-white tracking-tighter mb-2 leading-[0.9]">{user.name}</h1>
                                <div className="flex items-center gap-4 text-xl font-medium text-gray-400">
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-sm uppercase tracking-widest">{profile.age} Years Old</span>
                                    <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-primary" /> {profile.city}</span>
                                </div>
                            </div>

                            {/* Match DNA */}
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <div className="text-primary font-bold uppercase tracking-widest text-xs mb-1">Match Compatibility</div>
                                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300 tracking-tight">
                                            {matchPercentage}%
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-white leading-none">{profile.experienceYears}+</div>
                                        <div className="text-xs text-gray-500 uppercase font-bold mt-1">Years Exp</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio Quote */}
                            {profile.bio && (
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full" />
                                    <p className="text-xl md:text-2xl text-gray-200 font-light italic leading-relaxed">
                                        "{profile.bio}"
                                    </p>
                                </div>
                            )}

                            {/* Gym DNA Grid */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FaBrain className="text-primary" /> Gym DNA
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2">Primary Goal</div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.goals?.map(g => (
                                                <span key={g} className="text-white font-bold text-sm bg-black/20 px-2 py-1 rounded-md">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2">Personality</div>
                                        <div className="text-white font-bold text-lg">{profile.gymPersonality || 'N/A'}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2">Gym Type</div>
                                        <div className="text-white font-bold text-lg">{profile.gymType || 'Commercial'}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2">Level</div>
                                        <div className="text-white font-bold text-lg">{profile.fitnessLevel || 'Beginner'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Display */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FaFire className="text-primary" /> Confirmed Lifts
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Squat', 'Bench', 'Deadlift'].map(lift => (
                                        <div key={lift} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-1 group hover:border-primary/30 transition-all">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">{lift}</span>
                                            <span className="text-2xl font-black text-white group-hover:text-primary transition-colors">
                                                {profile.benchmarks?.[lift.toLowerCase()] || '-'}
                                                <span className="text-xs text-gray-500 font-medium ml-0.5">kg</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lifestyle Tags */}
                            <div className="pb-12">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FaBed className="text-primary" /> Lifestyle
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: profile.commitment, icon: <FaFire /> },
                                        { label: profile.lifestyle?.sleep, icon: <FaBed /> },
                                        { label: profile.lifestyle?.alcohol === 'None' ? 'No Alcohol' : 'Drinker', icon: <FaBeer /> },
                                        { label: profile.lifestyle?.smoker === 'Yes' ? 'Smoker' : 'Non-Smoker', icon: <FaSmoking /> },
                                    ].map((item, i) => (
                                        item.label && (
                                            <div key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-sm font-bold text-gray-300">
                                                <span className="text-gray-500">{item.icon}</span>
                                                {item.label}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;
