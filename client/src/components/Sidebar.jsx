import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaFire, FaDumbbell, FaRegCommentDots, FaUserFriends, FaSignOutAlt, FaUser
} from 'react-icons/fa';
import { IoSettingsSharp } from "react-icons/io5";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/home', icon: <FaFire size={24} />, label: 'Discovery' },
        { path: '/dashboard', icon: <FaDumbbell size={24} />, label: 'Dashboard' },
        { path: '/messages', icon: <FaRegCommentDots size={24} />, label: 'Messages' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-dark border-r border-gray-800 flex flex-col justify-between p-6 z-50">
            {/* Logo */}
            <div>
                <NavLink to="/home" className="flex items-center gap-2 mb-10 no-underline">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
                        <div className="w-4 h-4 bg-dark rounded-full"></div>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Spottr</h1>
                </NavLink>

                {/* Navigation */}
                <nav className="flex flex-col gap-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                                    ? 'bg-primary text-dark font-bold shadow-[0_0_20px_rgba(37,244,92,0.4)]'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`
                            }
                        >
                            <span className="relative z-10 text-xl">{item.icon}</span>
                            <span className="relative z-10 font-medium tracking-wide">{item.label}</span>

                            {/* Notification Badge Example using explicit check */}
                            {item.label === 'Matches' && (
                                <span className="absolute right-3 w-5 h-5 bg-secondary text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg z-10">
                                    3
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile / Logout */}
            <div className="border-t border-gray-800 pt-6">
                <div
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900 mb-4 cursor-pointer hover:bg-gray-800 transition"
                    onClick={() => navigate('/profile-setup')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold overflow-hidden">
                            {user?.profile?.photos?.[0] ? (
                                <img src={user.profile.photos[0]} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-semibold text-sm">{user?.name}</span>
                            <span className="text-gray-400 text-xs">View Profile</span>
                        </div>
                    </div>
                    <IoSettingsSharp
                        className="text-gray-400 hover:text-white z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            logout();
                        }}
                    />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
