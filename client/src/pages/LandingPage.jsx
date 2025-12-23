import React from 'react';
import { Link } from 'react-router-dom';
import { FaFire, FaDumbbell, FaRobot, FaTrophy, FaUserFriends, FaComments } from 'react-icons/fa';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#25F45C] selection:text-black overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-2xl font-black tracking-tighter">
                        SPOTTR<span className="text-[#25F45C]">.</span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition py-2">LOGIN</Link>
                        <Link to="/register" className="bg-[#25F45C] text-black px-5 py-2 rounded-full font-bold text-sm hover:shadow-[0_0_15px_rgba(37,244,92,0.4)] transition transform hover:scale-105">
                            GET STARTED
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#25F45C]/10 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-[#25F45C] animate-pulse"></span>
                        <span className="text-xs font-bold tracking-widest uppercase text-gray-300">Live Beta</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
                        TRAIN HARDER. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25F45C] to-emerald-600">TOGETHER.</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Stop lifting alone. Connect with local gym-goers who match your goals, intensity, and schedule.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/register" className="bg-[#25F45C] text-black px-8 py-4 rounded-xl font-black text-lg hover:bg-[#1ee350] transition hover:scale-105 flex items-center justify-center gap-3">
                            <FaUserFriends /> FIND A PARTNER
                        </Link>
                        <Link to="/login" className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-3">
                            LOG IN
                        </Link>
                    </div>
                </div>
            </header>

            {/* Feature Showcase 1: Layout & Matching */}
            <section className="py-24 px-6 bg-gray-900/30 border-y border-white/5">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#25F45C]/20 to-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition duration-500"></div>
                        <div className="relative bg-black border border-white/10 rounded-3xl p-8 aspect-square flex flex-col items-center justify-center text-center overflow-hidden">
                            {/* Abstract UI Representation of a Match Card */}
                            <div className="w-64 h-80 bg-gray-800 rounded-2xl border border-gray-700 relative shadow-2xl rotate-3 transition duration-500 hover:rotate-0">
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>
                                <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop" className="w-full h-full object-cover rounded-2xl opacity-80" alt="Profile" />
                                <div className="absolute bottom-4 left-4 z-20 text-left">
                                    <h3 className="font-bold text-xl">Mike, 26</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold bg-[#25F45C] text-black px-2 py-0.5 rounded">Powerlifter</span>
                                        <span className="text-[10px] uppercase font-bold bg-gray-700 text-white px-2 py-0.5 rounded">Elite</span>
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-[#25F45C] border border-[#25F45C]/30">98%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-[#25F45C] text-3xl mb-8">
                            <FaUserFriends />
                        </div>
                        <h2 className="text-4xl font-black mb-6">Swipe. Match. <span className="text-[#25F45C]">Sync.</span></h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Our smart algorithm connects you with people who train at your gym and share your fitness interests. Filter by experience level, workout style, and availability.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Location-based matching (Same Gym)",
                                "Experience level filtering (Beginner to Elite)",
                                "Interest tagging (Bodybuilding, CrossFit, Yoga)"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                                    <span className="w-5 h-5 rounded-full bg-[#25F45C]/20 flex items-center justify-center text-[#25F45C] text-xs">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Feature Showcase 2: AI & Analytics */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-[#25F45C] text-3xl mb-8">
                            <FaRobot />
                        </div>
                        <h2 className="text-4xl font-black mb-6">Intelligent <span className="text-[#25F45C]">Growth</span></h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Not sure what to eat or how to train? Our integrated AI analyzes your goals and generates personalized diet and workout plans instantly.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Custom Macro & Calorie Targets",
                                "Weekly Workout Splits",
                                "Real-time Plan Regeneration"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                                    <span className="w-5 h-5 rounded-full bg-[#25F45C]/20 flex items-center justify-center text-[#25F45C] text-xs">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative group order-1 md:order-2">
                        <div className="absolute inset-0 bg-gradient-to-l from-[#25F45C]/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition duration-500"></div>
                        <div className="relative bg-black border border-white/10 rounded-3xl p-8 aspect-video flex flex-col justify-center overflow-hidden">
                            <div className="space-y-3 font-mono text-sm opacity-80">
                                <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-between">
                                    <span className="text-gray-400">Target Protocol</span>
                                    <span className="text-[#25F45C]">Hypertrophy</span>
                                </div>
                                <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-between">
                                    <span className="text-gray-400">Daily Protein</span>
                                    <span className="text-white">180g <span className="text-gray-600">/ 200g</span></span>
                                </div>
                                <div className="p-4 bg-[#25F45C]/10 border border-[#25F45C]/20 rounded-lg text-[#25F45C]">
                                    <p className="mb-2 font-bold flex items-center gap-2"><FaRobot /> AI Suggestion:</p>
                                    <p className="text-xs text-gray-300 leading-relaxed">Based on your log, increase post-workout carb intake to optimize recovery for tomorrow's leg day.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase 3: Gamification */}
            <section className="py-24 px-6 bg-gray-900/30 border-y border-white/5">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-red-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition duration-500"></div>
                        <div className="relative bg-black border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                            <FaTrophy className="text-6xl text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                            <h3 className="text-2xl font-black text-white mb-1">Level 24</h3>
                            <p className="text-gray-500 text-sm tracking-widest uppercase mb-6">Gold Tier Athlete</p>
                            <div className="w-full max-w-xs bg-gray-800 h-3 rounded-full overflow-hidden mb-2">
                                <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full w-[75%] shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                            </div>
                            <p className="text-xs text-gray-400">1,250 XP to Level 25</p>
                        </div>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-[#25F45C] text-3xl mb-8">
                            <FaFire />
                        </div>
                        <h2 className="text-4xl font-black mb-6">Compete & <span className="text-[#25F45C]">Win.</span></h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Turn your consistency into currency. Earn XP for every workout, log your meals to maintain streaks, and climb the local leaderboard.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Earn Badges (Streak Master, Early Bird)",
                                "Global & Local Leaderboards",
                                "Weekly Gym Challenges"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                                    <span className="w-5 h-5 rounded-full bg-[#25F45C]/20 flex items-center justify-center text-[#25F45C] text-xs">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <footer className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
                        READY TO <br />
                        <span className="text-[#25F45C]">LEVEL UP?</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-12">
                        Join the community today. Your perfect gym buddy is waiting.
                    </p>
                    <Link to="/register" className="inline-flex bg-[#25F45C] text-black px-12 py-5 rounded-full font-black text-xl hover:bg-[#1ee350] transition hover:scale-105 hover:shadow-[0_0_40px_rgba(37,244,92,0.3)]">
                        CREATE ACCOUNT
                    </Link>
                    <p className="mt-12 text-gray-600 text-sm">
                        © 2025 Spottr. Built for athletes.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
