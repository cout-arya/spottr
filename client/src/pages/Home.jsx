import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "../components/SwipeCard";
import ProfileModal from "../components/ProfileModal";
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import {
    FaHeart,
    FaTimes,
    FaMapMarkerAlt,
    FaStar,
    FaSearch,
    FaBell,
} from "react-icons/fa";

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null); // Unified profile viewer

    // Feature States
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [matches, setMatches] = useState([]);
    const [likeNotifications, setLikeNotifications] = useState([]);

    // Socket Real-time Match Listener
    useEffect(() => {
        if (!user) return;

        const socket = io('http://localhost:5000');
        socket.emit('setup', user);

        socket.on('match found', (newMatch) => {
            // Provide visual feedback
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-primary`}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={newMatch.friend.photo || 'https://via.placeholder.com/150'}
                                    alt=""
                                />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-white">
                                    It's a Match! 🎉
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    You and {newMatch.friend.name} matched.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-700">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });

            // Update local state without needing to refresh
            fetchMatches();
        });

        socket.on('like received', (data) => {
            // Simpler notification for incoming likes
            setLikeNotifications(prev => [...prev, { _id: Date.now(), ...data, type: 'like' }]);

            toast(`${data.admirerName} liked your profile!`, {
                icon: '👀',
                style: {
                    borderRadius: '10px',
                    background: '#0F0F0F',
                    color: '#fff',
                    border: '1px solid #333',
                },
                duration: 4000
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchRecommendations();
        }
    }, [user]);

    // Fetch on open notifications
    useEffect(() => {
        if (showNotifs) fetchMatches();
    }, [showNotifs]);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 1) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchRecommendations = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(
                "/matches/recommendations",
                config,
            );
            setCandidates(data);
        } catch (error) {
            if (error.response?.status === 401) return;
            console.error(error);
        }
    };

    const fetchMatches = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(
                "/matches",
                config,
            );
            // Filter self out of the match pairs if necessary, usually backend populates both
            // Assuming backend returns { users: [me, them], ... }
            const processedMatches = data.map((match) => {
                const friend = match.users.find((u) => u._id !== user._id);
                return { ...match, friend };
            });
            setMatches(processedMatches);
        } catch (error) {
            if (error.response?.status === 401) return;
            console.error("Error fetching matches", error);
        }
    };

    const performSearch = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(
                `/users/search?q=${searchTerm}`,
                config,
            );
            setSearchResults(data);
        } catch (error) {
            if (error.response?.status === 401) return;
            console.error(error);
        }
    };

    const handleSwipe = async (direction) => {
        if (currentIndex >= candidates.length) return;

        const candidate = candidates[currentIndex].user;
        const type = direction === "right" ? "like" : "pass";

        setCurrentIndex((prev) => prev + 1);

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post(
                "/matches/swipe",
                { targetId: candidate._id, type },
                config,
            );

            if (data.isMatch) {
                // Success handled via Socket
                console.log("Match created via API response");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openProfile = (profileUser) => {
        setSelectedProfile(profileUser);
        setShowModal(true);
        // Close overlays
        setShowSearch(false);
        setShowNotifs(false);
    };

    const currentCandidate = candidates[currentIndex];

    return (
        <div className="relative w-full h-screen bg-black flex flex-col overflow-hidden font-sans">
            {/* Modal */}
            <ProfileModal
                user={
                    selectedProfile ||
                    (showModal && currentCandidate
                        ? {
                            ...currentCandidate.user,
                            matchPercentage: currentCandidate.score,
                        }
                        : null)
                }
                onClose={() => {
                    setShowModal(false);
                    setSelectedProfile(null);
                }}
            />

            {/* Subtle Background Grid/Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-black to-black pointer-events-none"></div>

            {/* Top Bar */}
            <div className="w-full h-20 px-6 flex justify-between items-center relative z-40 bg-gradient-to-b from-black via-black/80 to-transparent">
                {/* Logo/Context */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
                        <span className="text-xl">🔥</span>
                    </div>
                    <div>
                        <h1 className="text-white font-black text-lg leading-none tracking-tight">
                            DISCOVERY
                        </h1>
                        <div className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                            Live
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Search Button */}
                    <button
                        onClick={() => {
                            setShowSearch(!showSearch);
                            setShowNotifs(false);
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${showSearch ? "bg-white text-black" : "bg-gray-900/80 text-white border border-gray-800 hover:border-gray-600"}`}
                    >
                        <FaSearch className="text-lg" />
                    </button>

                    {/* Notification Button */}
                    <button
                        onClick={() => {
                            setShowNotifs(!showNotifs);
                            setShowSearch(false);
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-50 ${showNotifs ? "bg-white text-black" : "bg-gray-900/80 text-white border border-gray-800 hover:border-gray-600"}`}
                    >
                        <FaBell className="text-lg" />
                        {(matches.length > 0 || likeNotifications.length > 0) && !showNotifs && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-ping"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-0 w-full h-[calc(100vh-80px)] z-30 bg-black/95 backdrop-blur-xl p-6 overflow-y-auto"
                    >
                        <div className="max-w-2xl mx-auto">
                            <input
                                type="text"
                                placeholder="Find a Spottr..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 text-white text-xl font-bold p-6 rounded-3xl focus:outline-none focus:border-primary placeholder-gray-600"
                            />
                            <div className="mt-8 space-y-4">
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={() => openProfile(user)}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/50 hover:bg-gray-800 border border-gray-800 cursor-pointer transition"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden">
                                                {user.profile?.photos?.[0] ? (
                                                    <img
                                                        src={user.profile.photos[0]}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                                                        ?
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg">
                                                    {user.name}
                                                </h3>
                                                <p className="text-gray-500 text-sm">
                                                    {user.profile?.city || "No Location"}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : searchTerm.length > 1 ? (
                                    <div className="text-center text-gray-500 py-10">
                                        No users found for "{searchTerm}"
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-700 py-10 font-bold uppercase tracking-widest text-xs">
                                        Start typing to search
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications Overlay */}
            <AnimatePresence>
                {showNotifs && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="absolute top-20 right-0 w-full md:w-96 h-[calc(100vh-80px)] z-30 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 p-6 overflow-y-auto"
                    >
                        <h2 className="text-white font-black text-2xl mb-6">
                            It's a Match!{" "}
                            <span className="text-primary">({matches.length})</span>
                        </h2>
                        <div className="space-y-4">
                            {/* Likes Section */}
                            {likeNotifications.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-3">New Likes</h3>
                                    <div className="space-y-3">
                                        {likeNotifications.map((notif) => (
                                            <div key={notif._id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900 border border-gray-800">
                                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                                                    👀
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold">{notif.admirerName}</h3>
                                                    <p className="text-gray-500 text-xs">Liked your profile</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-3">Matches ({matches.length})</h3>
                            {matches.length > 0 ? (
                                matches.map((match) => (
                                    <div
                                        key={match._id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-black border border-gray-800"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden border-2 border-primary">
                                            {match.friend?.profile?.photos?.[0] ? (
                                                <img
                                                    src={match.friend.profile.photos[0]}
                                                    alt="Match"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    ?
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold">
                                                {match.friend?.name || "Unknown"}
                                            </h3>
                                            <p className="text-primary text-xs font-bold uppercase flex items-center gap-1">
                                                <FaHeart /> Confirmed Match
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/chat/${match._id}`)}
                                            className="ml-auto px-4 py-2 bg-gray-800 rounded-xl text-white text-xs font-bold hover:bg-gray-700"
                                        >
                                            Chat
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-12">
                                    <div className="text-4xl mb-3">🔕</div>
                                    <p>No matches yet. Keep swiping!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Card Area */}
            <div className="flex-1 flex items-center justify-center p-4 z-20 overflow-hidden">
                <div className="relative w-full max-w-[380px] h-full max-h-[600px] aspect-[3/4]">
                    <AnimatePresence>
                        {currentCandidate ? (
                            <SwipeCard
                                key={currentCandidate.user._id}
                                user={{
                                    ...currentCandidate.user,
                                    matchPercentage: currentCandidate.score,
                                }}
                                onSwipe={handleSwipe}
                                onInfoClick={() => {
                                    setSelectedProfile({
                                        ...currentCandidate.user,
                                        matchPercentage: currentCandidate.score,
                                    });
                                    setShowModal(true);
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gray-900/30 backdrop-blur-md rounded-[30px] border border-gray-800/50">
                                <div className="text-6xl mb-6">🎉</div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    You've seen everyone!
                                </h2>
                                <p className="text-gray-400 mb-6 text-sm max-w-xs">
                                    Broaden your filters or come back later for more potential gym
                                    buddies.
                                </p>
                                <button
                                    onClick={fetchRecommendations}
                                    className="px-8 py-3 bg-primary text-dark font-bold rounded-full hover:shadow-[0_0_20px_#25F45C] transition transform hover:scale-105"
                                >
                                    Refresh List
                                </button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="h-28 flex items-center justify-center gap-6 z-30 shrink-0 pb-4">
                {currentCandidate && (
                    <>
                        <button
                            onClick={() => handleSwipe("left")}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-900/80 border border-gray-700 text-red-500 text-xl shadow-lg hover:scale-110 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition duration-200"
                        >
                            <FaTimes />
                        </button>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/50 text-blue-400 text-md shadow-lg hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition duration-200 transform -translate-y-2">
                            <FaStar />
                        </button>

                        <button
                            onClick={() => handleSwipe("right")}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-dark text-xl shadow-[0_0_15px_rgba(37,244,92,0.3)] hover:scale-110 hover:shadow-[0_0_30px_#25F45C] transition duration-200"
                        >
                            <FaHeart />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;
