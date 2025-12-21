import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { FaPaperPlane, FaCircle, FaArrowLeft, FaSearch } from 'react-icons/fa';

const ENDPOINT = 'http://localhost:5000';
var socket, selectedChatCompare;

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
            }
        }
    }, [matchId, matches]);

    // Message Listener
    useEffect(() => {
        socket.on('message received', (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare !== newMessageRecieved.matchId) {
                // TODO: Update unread count in matches list
            } else {
                setMessages(prev => [...prev, newMessageRecieved]);
                scrollToBottom();
            }
        });
    }, []);

    const fetchMatches = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/matches', config);
            setMatches(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`http://localhost:5000/api/chat/${id}`, config);
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage && activeMatch) {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                setNewMessage('');
                const { data } = await axios.post(`http://localhost:5000/api/chat/${activeMatch._id}`, { content: newMessage }, config);

                socket.emit('new message', data);
                setMessages([...messages, data]);
                scrollToBottom();
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

    return (
        <div className="flex h-screen bg-black overflow-hidden">

            {/* Left Sidebar: Matches List */}
            <div className={`${matchId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-1/4 flex-col border-r border-gray-800 bg-dark`}>
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-4">Messages</h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search matches..."
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-10 text-white focus:border-primary focus:outline-none transition"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {matches.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No matches yet.</p>
                            <p className="text-xs mt-2">Start swiping to find new gym buddies!</p>
                        </div>
                    ) : (
                        matches.map(match => {
                            const partner = getPartner(match);
                            const isActive = activeMatch?._id === match._id;

                            return (
                                <div
                                    key={match._id}
                                    onClick={() => handleMatchSelect(match)}
                                    className={`flex items-center gap-4 p-4 cursor-pointer transition border-l-4 ${isActive ? 'bg-gray-900 border-primary' : 'border-transparent hover:bg-gray-900/50'}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700">
                                            <img src={partner.profile?.photos?.[0] || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                                        </div>
                                        {/* Online Indicator Mock */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-white font-bold truncate">{partner.name}</h3>
                                            <span className="textxs text-gray-500">Now</span>
                                        </div>
                                        <p className="text-gray-400 text-sm truncate">Click to start chatting...</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right Side: Chat Window */}
            <div className={`${!matchId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-black relative`}>
                {!activeMatch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                        <div className="text-6xl mb-4 opacity-50">💬</div>
                        <p className="text-lg">Select a match to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 px-6 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/messages')} className="md:hidden text-gray-400 hover:text-white">
                                    <FaArrowLeft />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600">
                                    <img src={getPartner(activeMatch).profile?.photos?.[0] || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{getPartner(activeMatch).name}</h3>
                                    <p className="text-primary text-xs font-bold flex items-center gap-1">
                                        <FaCircle size={6} /> Online
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.length === 0 && (
                                <div className="text-center mt-10">
                                    <p className="text-gray-500 text-sm">You matched with <span className="text-primary font-bold">{getPartner(activeMatch).name}</span>!</p>
                                    <p className="text-gray-600 text-xs mt-1">Say hello and set up a workout.</p>
                                </div>
                            )}

                            {messages.map((m, i) => {
                                const isMe = m.senderId._id === user._id;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-5 py-3 rounded-2xl ${isMe
                                                ? 'bg-primary text-dark font-medium rounded-tr-none shadow-[0_4px_15px_rgba(37,244,92,0.2)]'
                                                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                            }`}>
                                            <p>{m.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-900' : 'text-gray-500'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
                            <form onSubmit={sendMessage} className="relative flex items-center gap-4 max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-dark shadow-[0_0_15px_rgba(37,244,92,0.4)] hover:scale-110 hover:shadow-[0_0_25px_#25F45C] transition disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <FaPaperPlane size={18} />
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
