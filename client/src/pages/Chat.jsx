import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { FaPaperPlane, FaArrowLeft, FaCheck, FaCheckDouble, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [matches, setMatches] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [activeMatch, setActiveMatch] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Initial setup & Matches fetch
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit('setup', user);
        socket.on('connected', () => setSocketConnected(true));

        fetchMatches();

        return () => {
            socket.disconnect();
        }
    }, [user]);

    // Handle Route MatchId
    useEffect(() => {
        if (matchId && matches.length > 0) {
            const match = matches.find(m => m._id === matchId);
            if (match) {
                setActiveMatch(match);
                fetchMessages(matchId);
                socket.emit('join chat', matchId);
                selectedChatCompare = matchId;

                // Mark messages as read
                markMessagesAsRead(matchId);
            }
        }
    }, [matchId, matches]);

    // Message & Read Receipt Listeners
    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare !== newMessageRecieved.matchId) {
                // Update sidebar unread count
                fetchMatches();
            } else {
                setMessages(prev => {
                    if (prev.some(m => m._id === newMessageRecieved._id)) return prev;
                    return [...prev, newMessageRecieved];
                });
                setTimeout(scrollToBottom, 100);
                // Auto-mark as read since chat is open
                markMessagesAsRead(newMessageRecieved.matchId);
            }
        };

        const handleMessagesRead = (data) => {
            if (data.matchId === selectedChatCompare) {
                // Update all our sent messages to show as read
                setMessages(prev => prev.map(m => {
                    if (m.senderId._id === user._id && !m.readAt) {
                        return { ...m, readAt: data.readAt };
                    }
                    return m;
                }));
            }
            // Also refresh sidebar
            fetchMatches();
        };

        const handleMatchFound = () => {
            fetchMatches();
        };

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
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/chat/${id}`, config);
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const markMessagesAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`/chat/${id}/read`, {}, config);
        } catch (error) {
            // Silent fail — not critical
        }
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
                fetchMatches(); // Update sidebar preview
            } catch (error) {
                console.error(error);
            }
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleMatchSelect = (match) => {
        navigate(`/chat/${match._id}`);
    };

    // Helper to get other user in match
    const getPartner = (match) => {
        return match.users.find(u => u._id !== user._id) || {};
    };

    // Group messages by date for separators
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

    // Find the last sent message that was read (for "Seen X ago" display)
    const getLastSeenInfo = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.senderId._id === user._id && m.readAt) {
                return m.readAt;
            }
        }
        return null;
    };

    const partner = activeMatch ? getPartner(activeMatch) : null;
    const messageGroups = getMessageGroups();
    const lastSeenAt = getLastSeenInfo();
    // Check if last message is from current user (to show seen info below it)
    const lastMsg = messages[messages.length - 1];
    const showSeenBelow = lastMsg && lastMsg.senderId._id === user._id && lastMsg.readAt;

    return (
        <div className="flex h-[calc(100dvh-4rem)] lg:h-[100dvh] bg-[#0a0f0a] overflow-hidden">

            {/* Left Sidebar: Matches List */}
            <div className={`${matchId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[340px] flex-col border-r border-gray-800/50 bg-[#0d1117]`}>

                {/* Sidebar Header */}
                <div className="p-5 border-b border-gray-800/50">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <span className="text-primary">●</span> Messages
                    </h2>
                </div>

                {/* Matches List */}
                <div className="flex-1 overflow-y-auto">
                    {matches.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            <div className="text-4xl mb-3 opacity-50">💬</div>
                            <p className="text-sm font-medium">No matches yet</p>
                            <p className="text-xs mt-1 text-gray-700">Start swiping to find Spottrs!</p>
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
                                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 border-l-[3px] ${isActive
                                            ? 'bg-primary/10 border-primary'
                                            : 'border-transparent hover:bg-white/[0.03]'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-800">
                                            <img
                                                src={p.profile?.photos?.[0] || 'https://placehold.co/150'}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`font-bold text-sm truncate ${match.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                                                {p.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-600 font-medium shrink-0 ml-2">
                                                {lastMsgTime ? getRelativeTime(lastMsgTime) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs truncate max-w-[180px] ${match.unreadCount > 0 ? 'text-gray-300 font-semibold' : 'text-gray-600'}`}>
                                                {isMyLastMsg ? 'You: ' : ''}{lastMsgPreview}
                                            </p>
                                            {match.unreadCount > 0 && (
                                                <span className="shrink-0 ml-2 w-5 h-5 bg-primary text-dark text-[10px] font-black rounded-full flex items-center justify-center">
                                                    {match.unreadCount > 9 ? '9+' : match.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right Side: Chat Window */}
            <div className={`${!matchId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#0a0f0a] relative`}>
                {!activeMatch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-700">
                        <div className="w-20 h-20 bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-800/50">
                            <span className="text-3xl opacity-50">💬</span>
                        </div>
                        <p className="text-sm font-medium">Select a match to start chatting</p>
                        <p className="text-xs text-gray-800 mt-1">Your conversations will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-[72px] px-5 bg-[#0d1117]/90 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => { navigate('/messages'); setActiveMatch(null); }} className="md:hidden text-gray-400 hover:text-white p-1 -ml-1">
                                    <FaArrowLeft />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30">
                                    <img
                                        src={partner?.profile?.photos?.[0] || 'https://placehold.co/150'}
                                        alt={partner?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-[15px] leading-tight flex items-center gap-2">
                                        {partner?.name}
                                        {partner?.profile?.age && (
                                            <span className="text-gray-500 font-normal text-sm">{partner.profile.age}</span>
                                        )}
                                    </h3>
                                    {/* Tags */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {partner?.profile?.gymType && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                                {partner.profile.gymType}
                                            </span>
                                        )}
                                        {partner?.profile?.fitnessLevel && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                                                {partner.profile.fitnessLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="w-9 h-9 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 transition">
                                <FaInfoCircle className="text-sm" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-1">
                            {messages.length === 0 && (
                                <div className="text-center mt-16">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                        <span className="text-2xl">🤝</span>
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">
                                        You matched with <span className="text-primary font-bold">{partner?.name}</span>!
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">Say hello and plan your next workout.</p>
                                </div>
                            )}

                            {messageGroups.map((item, idx) => {
                                if (item.type === 'separator') {
                                    return (
                                        <div key={item.id} className="flex items-center justify-center py-4">
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] bg-[#0a0f0a] px-4 relative z-10">
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
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                            {/* Partner Avatar (received msgs only) */}
                                            {!isMe && (
                                                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mt-auto mb-5 shrink-0">
                                                    <img
                                                        src={partner?.profile?.photos?.[0] || 'https://placehold.co/80'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            <div className={`max-w-[75%] md:max-w-[65%]`}>
                                                <div className={`px-4 py-2.5 ${isMe
                                                        ? 'bg-gradient-to-br from-[#1a3a2a] to-[#0f2a1a] border border-primary/20 rounded-2xl rounded-br-md'
                                                        : 'bg-[#161b22] border border-gray-800/50 rounded-2xl rounded-bl-md'
                                                    }`}>
                                                    <p className={`text-[14px] leading-relaxed ${isMe ? 'text-gray-100' : 'text-gray-300'}`}>
                                                        {m.content}
                                                    </p>
                                                </div>

                                                {/* Time + Read Receipt */}
                                                <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[10px] text-gray-600">{time}</span>
                                                    {isMe && (
                                                        m.readAt ? (
                                                            <FaCheckDouble className="text-[10px] text-primary" title={`Seen ${getRelativeTime(m.readAt)}`} />
                                                        ) : (
                                                            <FaCheck className="text-[10px] text-gray-600" title="Sent" />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* "Seen X ago" below the last message sent by me */}
                                        {isLastSentByMe && showSeenBelow && (
                                            <div className="text-right pr-2 -mt-0.5 mb-2">
                                                <span className="text-[10px] text-primary/70 font-medium italic">
                                                    {getSeenTime(lastSeenAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="px-4 md:px-6 py-3 bg-[#0d1117]/80 backdrop-blur-xl border-t border-gray-800/30 shrink-0">
                            <form onSubmit={sendMessage} className="relative flex items-center gap-3 max-w-3xl mx-auto">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Send a message to ${partner?.name || 'them'}...`}
                                    className="flex-1 bg-[#161b22] border border-gray-800/50 rounded-full px-5 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-dark shadow-[0_0_12px_rgba(37,244,92,0.25)] hover:shadow-[0_0_20px_rgba(37,244,92,0.4)] hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
                                >
                                    <FaPaperPlane className="text-sm -ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;
