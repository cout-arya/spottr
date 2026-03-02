import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { FaPaperPlane, FaArrowLeft, FaCheck, FaCheckDouble, FaInfoCircle } from 'react-icons/fa';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
var socket, selectedChatCompare;

// Helper: relative time string
const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(date).toLocaleDateString();
};

// Helper: readable seen time
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
    const messagesEndRef = useRef(null);

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit('setup', user);
        socket.on('connected', () => setSocketConnected(true));
        fetchMatches();
        return () => { socket.disconnect(); }
    }, [user]);

    useEffect(() => {
        if (matchId && matches.length > 0) {
            const match = matches.find(m => m._id === matchId);
            if (match) {
                setActiveMatch(match);
                fetchMessages(matchId);
                socket.emit('join chat', matchId);
                selectedChatCompare = matchId;
                markMessagesAsRead(matchId);
            }
        }
    }, [matchId, matches]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMsg) => {
            if (!selectedChatCompare || selectedChatCompare !== newMsg.matchId) {
                fetchMatches();
            } else {
                setMessages(prev => {
                    if (prev.some(m => m._id === newMsg._id)) return prev;
                    return [...prev, newMsg];
                });
                setTimeout(scrollToBottom, 100);
                markMessagesAsRead(newMsg.matchId);
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

        const handleMatchFound = () => { fetchMatches(); };

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
        } catch (error) { console.error(error); }
    };

    const fetchMessages = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/chat/${id}`, config);
            setMessages(data);
            scrollToBottom();
        } catch (error) { console.error(error); }
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
                const contentToSend = newMessage;
                setNewMessage('');
                const { data } = await axios.post(`/chat/${activeMatch._id}`, { content: contentToSend }, config);
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

    const handleMatchSelect = (match) => { navigate(`/chat/${match._id}`); };

    const getPartner = (match) => match.users.find(u => u._id !== user._id) || {};

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

    const getLastSeenInfo = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.senderId._id === user._id && m.readAt) return m.readAt;
        }
        return null;
    };

    const partner = activeMatch ? getPartner(activeMatch) : null;
    const messageGroups = getMessageGroups();
    const lastSeenAt = getLastSeenInfo();
    const lastMsg = messages[messages.length - 1];
    const showSeenBelow = lastMsg && lastMsg.senderId._id === user._id && lastMsg.readAt;

    return (
        <div className="flex h-[calc(100dvh-4rem)] lg:h-[100dvh] w-full overflow-hidden" style={{ background: '#102216' }}>

            {/* ===== LEFT SIDEBAR: RECENT CHATS ===== */}
            <div className={`${matchId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-col shrink-0`} style={{ borderRight: '1px solid rgba(13,242,89,0.1)' }}>

                {/* Sidebar Header */}
                <div className="p-5 flex items-center gap-3">
                    <div className="bg-[#0df259] p-2 rounded-lg">
                        <span className="text-[#102216] font-bold text-lg">💪</span>
                    </div>
                    <h1 className="hidden md:block text-lg font-bold tracking-tight text-[#0df259] uppercase">Spottr</h1>
                </div>

                {/* Recent Chats Label */}
                <div className="hidden md:block text-[10px] uppercase tracking-widest text-[#0df259]/50 font-bold px-7 mb-2">Recent Chats</div>

                {/* Matches List */}
                <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                    {matches.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-sm font-medium">No matches yet</p>
                            <p className="text-xs mt-1">Start swiping to find Spottrs!</p>
                        </div>
                    ) : (
                        matches.map(match => {
                            const p = getPartner(match);
                            const isActive = activeMatch?._id === match._id;
                            const lastMsgPreview = match.lastMessage?.content || 'Start a conversation...';
                            const lastMsgTime = match.lastMessage?.createdAt;
                            const isMyLastMsg = match.lastMessage?.senderId?.toString() === user._id;

                            return (
                                <div
                                    key={match._id}
                                    onClick={() => handleMatchSelect(match)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive
                                            ? 'bg-[#0df259]/10 border border-[#0df259]/20'
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={p.profile?.photos?.[0] || 'https://placehold.co/150'}
                                            alt={p.name}
                                            className={`w-12 h-12 rounded-full object-cover ${!isActive ? 'grayscale group-hover:grayscale-0' : ''} transition-all`}
                                        />
                                        {match.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0df259] text-[#102216] text-[9px] font-black rounded-full flex items-center justify-center">
                                                {match.unreadCount > 9 ? '9+' : match.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    <div className="hidden md:block flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-sm truncate text-slate-100">{p.name}</h3>
                                            <span className={`text-[10px] ${isActive ? 'text-[#0df259]' : 'text-slate-500'}`}>
                                                {lastMsgTime ? getRelativeTime(lastMsgTime) : ''}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate font-medium ${match.unreadCount > 0 ? 'text-slate-300 italic' : 'text-slate-500'}`}>
                                            {isMyLastMsg ? 'You: ' : ''}{lastMsgPreview}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </nav>
            </div>

            {/* ===== MAIN CHAT AREA ===== */}
            <main className={`${!matchId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-white/[0.03]`}>
                {!activeMatch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <div className="text-5xl mb-4 opacity-50">💬</div>
                        <p className="text-sm font-medium">Select a match to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className="h-20 flex items-center justify-between px-6 backdrop-blur-md z-10 shrink-0" style={{ borderBottom: '1px solid rgba(13,242,89,0.1)', background: 'rgba(16,34,22,0.8)' }}>
                            <div className="flex items-center gap-4">
                                {/* Back button on mobile */}
                                <button onClick={() => { navigate('/messages'); setActiveMatch(null); }} className="md:hidden text-slate-400 hover:text-white p-1 -ml-1">
                                    <FaArrowLeft />
                                </button>
                                {/* Avatar on mobile */}
                                <div className="relative md:hidden">
                                    <img
                                        src={partner?.profile?.photos?.[0] || 'https://placehold.co/150'}
                                        alt={partner?.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-100">
                                            {partner?.name}{partner?.profile?.age ? `, ${partner.profile.age}` : ''}
                                        </h2>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {partner?.profile?.gymType && (
                                            <span className="px-2 py-0.5 rounded-full bg-[#0df259]/10 text-[#0df259] text-[10px] font-bold uppercase tracking-wider border border-[#0df259]/20">
                                                {partner.profile.gymType}
                                            </span>
                                        )}
                                        {partner?.profile?.fitnessLevel && (
                                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                                {partner.profile.fitnessLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-full hover:bg-[#0df259]/10 text-slate-400 hover:text-[#0df259] transition-colors">
                                    <FaInfoCircle className="text-lg" />
                                </button>
                            </div>
                        </header>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="text-center mt-16">
                                    <p className="text-slate-400 text-sm font-medium">
                                        You matched with <span className="text-[#0df259] font-bold">{partner?.name}</span>!
                                    </p>
                                    <p className="text-slate-600 text-xs mt-1">Say hello and plan your next workout.</p>
                                </div>
                            )}

                            {messageGroups.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={item.id} className="flex justify-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-800/30 px-3 py-1 rounded-full">
                                                {getDateLabel(item.date)}
                                            </span>
                                        </div>
                                    );
                                }

                                const m = item.data;
                                const isMe = m.senderId._id === user._id;
                                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const isLastSentByMe = isMe && idx === messageGroups.length - 1;

                                if (!isMe) {
                                    // ---- RECEIVED MESSAGE ----
                                    return (
                                        <div key={item.id} className="flex gap-3 max-w-[80%]">
                                            <img
                                                src={partner?.profile?.photos?.[0] || 'https://placehold.co/80'}
                                                alt=""
                                                className="w-8 h-8 rounded-full self-end object-cover shrink-0"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <div className="bg-slate-800/80 p-4 rounded-t-2xl rounded-r-2xl text-sm font-medium leading-relaxed text-slate-100">
                                                    {m.content}
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-medium">{time}</span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // ---- SENT MESSAGE ----
                                    return (
                                        <div key={item.id}>
                                            <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-[#0df259] text-[#102216] p-4 rounded-t-2xl rounded-l-2xl text-sm font-bold leading-relaxed shadow-lg shadow-[#0df259]/10">
                                                        {m.content}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 font-medium">{time}</span>
                                                        {m.readAt ? (
                                                            <FaCheckDouble className="text-[11px] text-[#0df259]" />
                                                        ) : (
                                                            <FaCheck className="text-[11px] text-slate-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {isLastSentByMe && showSeenBelow && (
                                                <div className="text-right pr-1 mt-1">
                                                    <span className="text-[10px] text-[#0df259]/60 font-medium italic">
                                                        {getSeenTime(lastSeenAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <footer className="p-4 md:p-6 backdrop-blur-sm shrink-0" style={{ borderTop: '1px solid rgba(13,242,89,0.1)', background: 'rgba(16,34,22,0.8)' }}>
                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={sendMessage} className="relative flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={`Send a message to ${partner?.name || 'them'}...`}
                                            className="w-full bg-slate-800/50 border border-[#0df259]/10 focus:border-[#0df259]/40 focus:outline-none focus:ring-0 rounded-full py-4 pl-6 pr-14 text-sm font-medium placeholder:text-slate-500 text-slate-100"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0df259] text-[#102216] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#0df259]/20 disabled:opacity-30 disabled:hover:scale-100"
                                        >
                                            <FaPaperPlane className="text-sm" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </footer>
                    </>
                )}
            </main>
        </div>
    );
};

export default Chat;
