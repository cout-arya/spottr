import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { FaPaperPlane, FaArrowLeft, FaCheck, FaCheckDouble, FaInfoCircle, FaDumbbell } from 'react-icons/fa';
import ProfileModal from '../components/ProfileModal';
import LoadingSpinner from '../components/LoadingSpinner';

const ENDPOINT = import.meta.env.VITE_API_URL || 'https://spottr-1.onrender.com';
var socket, selectedChatCompare;

// Helper: relative time string
const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(date).toLocaleDateString();
};

// Helper: seen time label
const getSeenTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'Seen just now';
    if (diff < 3600) return `Seen ${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `Seen ${Math.floor(diff / 3600)}h ago`;
    return `Seen ${new Date(date).toLocaleDateString()}`;
};

// Helper: date separator label
const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [matches, setMatches] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [activeMatch, setActiveMatch] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);

    // Socket setup
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit('setup', user);
        socket.on('connected', () => setSocketConnected(true));
        fetchMatches();
        return () => { socket.disconnect(); }
    }, [user]);

    // Handle route matchId
    useEffect(() => {
        if (matchId && matches.length > 0) {
            const match = matches.find(m => m._id === matchId);
            if (match) {
                setActiveMatch(match);
                fetchMessages(matchId);
                if (socket) {
                    socket.emit('join chat', matchId);
                }
                selectedChatCompare = matchId;
                markMessagesAsRead(matchId);
            }
        }
    }, [matchId, matches, socketConnected]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (msg) => {
            if (!selectedChatCompare || selectedChatCompare !== msg.matchId) {
                fetchMatches();
            } else {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                setTimeout(scrollToBottom, 100);
                markMessagesAsRead(msg.matchId);
            }
        };

        const handleMessagesRead = (data) => {
            if (data.matchId === selectedChatCompare) {
                setMessages(prev => prev.map(m => {
                    if (m.senderId._id === user._id && !m.readAt) {
                        return { ...m, readAt: data.readAt };
                    }
                    return m;
                }));
            }
            fetchMatches();
        };

        const handleMatchFound = () => fetchMatches();

        socket.on('message received', handleMessageReceived);
        socket.on('messages read', handleMessagesRead);
        socket.on('match found', handleMatchFound);

        return () => {
            socket.off('message received', handleMessageReceived);
            socket.off('messages read', handleMessagesRead);
            socket.off('match found', handleMatchFound);
        };
    }, []);

    const fetchMatches = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/matches', config);
            setMatches(data);
        } catch (error) { console.error(error); } finally {
            setLoadingMatches(false);
        }
    };

    const fetchMessages = async (id) => {
        setLoadingMessages(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/chat/${id}`, config);
            setMessages(data);
            scrollToBottom();
        } catch (error) { console.error(error); } finally {
            setLoadingMessages(false);
        }
    };

    const markMessagesAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`/chat/${id}/read`, {}, config);
        } catch (error) { /* silent */ }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage && activeMatch) {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const content = newMessage;
                setNewMessage('');
                const { data } = await axios.post(`/chat/${activeMatch._id}`, { content }, config);
                setMessages(prev => {
                    if (prev.some(m => m._id === data._id)) return prev;
                    return [...prev, data];
                });
                scrollToBottom();
                fetchMatches();
            } catch (error) { console.error(error); }
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
    };

    const handleMatchSelect = (match) => navigate(`/chat/${match._id}`);

    const getPartner = (match) => match.users.find(u => u._id !== user._id) || {};

    // Message grouping with date separators
    const getMessageGroups = () => {
        const groups = [];
        let lastDate = null;
        messages.forEach((m) => {
            const msgDate = new Date(m.createdAt).toDateString();
            if (msgDate !== lastDate) {
                groups.push({ type: 'separator', date: m.createdAt, id: `sep-${m.createdAt}` });
                lastDate = msgDate;
            }
            groups.push({ type: 'message', data: m, id: m._id });
        });
        return groups;
    };

    // Last seen info for sent messages
    const getLastSeenAt = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].senderId._id === user._id && messages[i].readAt) return messages[i].readAt;
        }
        return null;
    };

    const partner = activeMatch ? getPartner(activeMatch) : null;
    const messageGroups = getMessageGroups();
    const lastSeenAt = getLastSeenAt();
    const lastMsg = messages[messages.length - 1];
    const showSeenBelow = lastMsg && lastMsg.senderId._id === user._id && lastMsg.readAt;

    return (
        <div className="flex w-full h-[calc(100dvh-4rem)] lg:h-[100dvh] overflow-hidden bg-dark font-sans">

            {/* ========== LEFT SIDEBAR: RECENT CHATS ========== */}
            <div className={`${matchId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-col shrink-0`} style={{ borderRight: '1px solid rgba(13,242,89,0.1)' }}>

                {/* Sidebar Header Removed per request */}

                {/* Recent Chats Label */}
                <div className="hidden md:block text-xs uppercase tracking-[0.15em] text-primary/50 font-bold px-7 pt-6 mb-2">Recent Chats</div>

                {/* Chat List */}
                <nav className="flex-1 overflow-y-auto px-3 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(13,242,89,0.1) transparent' }}>
                    {loadingMatches ? (
                        <LoadingSpinner text="Loading chats..." fullScreen={false} />
                    ) : matches.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-base text-gray-500 font-medium">No matches yet.</p>
                            <p className="text-sm text-gray-600 mt-1">Start swiping to find Spottrs!</p>
                        </div>
                    ) : (
                        matches.map(match => {
                            const p = getPartner(match);
                            const isActive = activeMatch?._id === match._id;
                            const preview = match.lastMessage?.content || 'Tap to start chatting...';
                            const isMyMsg = match.lastMessage?.senderId?.toString() === user._id;
                            const time = match.lastMessage?.createdAt;

                            return (
                                <div
                                    key={match._id}
                                    onClick={() => handleMatchSelect(match)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive
                                        ? 'bg-primary/10 border border-primary/20'
                                        : 'hover:bg-gray-800/30 border border-transparent'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={p.profile?.photos?.[0] || 'https://placehold.co/150'}
                                            alt={p.name}
                                            className={`w-12 h-12 rounded-full object-cover ${!isActive ? 'grayscale group-hover:grayscale-0' : ''} transition-all`}
                                        />
                                        {match.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[#102216] text-[10px] font-black rounded-full flex items-center justify-center">
                                                {match.unreadCount > 9 ? '9+' : match.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="hidden md:block flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-base truncate text-white">{p.name}</h3>
                                            <span className={`text-xs shrink-0 ml-2 ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                                                {time ? getRelativeTime(time) : ''}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate mt-0.5 ${match.unreadCount > 0 ? 'text-slate-300 font-semibold' : 'text-slate-500'} ${isActive ? 'italic font-medium' : ''}`}>
                                            {isMyMsg ? 'You: ' : ''}{preview}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </nav>
            </div>

            {/* ========== MAIN CHAT AREA ========== */}
            <div className={`${!matchId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative`}>
                {!activeMatch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <div className="text-5xl mb-4 opacity-30">💬</div>
                        <p className="text-base font-semibold">Select a conversation</p>
                        <p className="text-xs text-slate-700 mt-1">Your messages will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* ---- Chat Header ---- */}
                        <header className="h-[72px] flex items-center justify-between px-5 z-10 shrink-0 backdrop-blur-md bg-dark/80" style={{ borderBottom: '1px solid rgba(13,242,89,0.1)' }}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { navigate('/messages'); setActiveMatch(null); }} className="md:hidden text-slate-400 hover:text-white p-1 -ml-1">
                                    <FaArrowLeft />
                                </button>
                                {/* Mobile avatar */}
                                <div className="md:hidden relative">
                                    <img src={partner?.profile?.photos?.[0] || 'https://placehold.co/150'} alt="" className="w-10 h-10 rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-extrabold text-white tracking-tight">{partner?.name}{partner?.profile?.age ? `, ${partner.profile.age}` : ''}</h2>
                                    </div>
                                    <div className="flex gap-1.5 mt-0.5">
                                        {partner?.profile?.gymType && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'rgba(13,242,89,0.1)', color: '#25F45C', borderColor: 'rgba(13,242,89,0.2)' }}>
                                                {partner.profile.gymType}
                                            </span>
                                        )}
                                        {partner?.profile?.fitnessLevel && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                                {partner.profile.fitnessLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="p-2 rounded-full hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <FaInfoCircle className="text-base" />
                                </button>
                            </div>
                        </header>

                        {/* ---- Messages Area ---- */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(13,242,89,0.1) transparent' }}>

                            {loadingMessages ? (
                                <LoadingSpinner text="Loading messages..." fullScreen={false} />
                            ) : messages.length === 0 ? (
                                <div className="text-center mt-16">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border" style={{ background: 'rgba(13,242,89,0.1)', borderColor: 'rgba(13,242,89,0.2)' }}>
                                        <span className="text-2xl">🤝</span>
                                    </div>
                                    <p className="text-base text-slate-400 font-medium">
                                        You matched with <span className="text-primary font-bold">{partner?.name}</span>!
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">Say hello and plan your next workout.</p>
                                </div>
                            ) : null}

                            {messageGroups.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={item.id} className="flex justify-center py-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ background: 'rgba(30,60,45,0.5)' }}>
                                                {getDateLabel(item.date)}
                                            </span>
                                        </div>
                                    );
                                }

                                const m = item.data;
                                const isMe = m.senderId._id === user._id;
                                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const isLastSentByMe = isMe && idx === messageGroups.length - 1;

                                return (
                                    <div key={item.id}>
                                        {/* === RECEIVED MESSAGE === */}
                                        {!isMe && (
                                            <div className="flex gap-3 max-w-[80%]">
                                                <img
                                                    src={partner?.profile?.photos?.[0] || 'https://placehold.co/80'}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full self-end object-cover shrink-0"
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <div className="p-4 rounded-t-2xl rounded-r-2xl text-base font-medium leading-relaxed" style={{ background: 'rgba(30,60,45,0.8)' }}>
                                                        {m.content}
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium">{time}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* === SENT MESSAGE === */}
                                        {isMe && (
                                            <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="p-4 rounded-t-2xl rounded-l-2xl text-base font-bold leading-relaxed shadow-lg text-[#102216]" style={{ background: '#25F45C', boxShadow: '0 4px 15px rgba(37,244,92,0.15)' }}>
                                                        {m.content}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-500 font-medium">{time}</span>
                                                        {m.readAt ? (
                                                            <FaCheckDouble className="text-xs text-primary" />
                                                        ) : (
                                                            <FaCheck className="text-xs text-slate-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* "Seen X ago" below last sent message */}
                                        {isLastSentByMe && showSeenBelow && (
                                            <div className="text-right mt-1">
                                                <span className="text-xs text-primary/60 font-medium italic">{getSeenTime(lastSeenAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ---- Input Area ---- */}
                        <footer className="p-4 md:p-5 backdrop-blur-sm shrink-0 bg-dark/80" style={{ borderTop: '1px solid rgba(13,242,89,0.1)' }}>
                            <div className="max-w-3xl mx-auto">
                                <form onSubmit={sendMessage} className="relative flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={`Send a message to ${partner?.name || 'them'}...`}
                                            className="w-full rounded-full py-3.5 px-6 text-base font-medium text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                                            style={{
                                                background: 'rgba(30,60,45,0.3)',
                                                border: '1px solid rgba(13,242,89,0.1)',
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(13,242,89,0.4)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(13,242,89,0.1)'}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${newMessage.trim()
                                            ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(37,244,92,0.4)]'
                                            : 'bg-primary/20 text-white cursor-not-allowed'
                                            }`}
                                    >
                                        <FaPaperPlane className={`text-sm -ml-0.5 ${newMessage.trim() ? '' : 'opacity-100'}`} />
                                    </button>
                                </form>
                            </div>
                        </footer>
                    </>
                )}
            </div>
            {/* ========== PROFILE MODAL ========== */}
            {isProfileModalOpen && partner && (
                <ProfileModal
                    user={partner}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Chat;
