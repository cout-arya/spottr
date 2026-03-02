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
        { path: '/home', icon: <FaFire className="text-xl md:text-2xl" />, label: 'Discovery' },
        { path: '/dashboard', icon: <FaDumbbell className="text-xl md:text-2xl" />, label: 'Dashboard' },
        { path: '/messages', icon: <FaRegCommentDots className="text-xl md:text-2xl" />, label: 'Messages' },
        { path: '/profile-setup', icon: <FaUser className="text-xl md:text-2xl" />, label: 'Profile', mobileOnly: true },
    ];

    return (
        <aside className="fixed bottom-0 left-0 w-full h-16 bg-dark/90 backdrop-blur-md border-t border-gray-800 flex flex-row items-center justify-around px-2 z-[60] lg:h-screen lg:w-64 lg:flex-col lg:justify-between lg:p-6 lg:border-r lg:border-t-0 lg:top-0 lg:bg-dark">
            {/* Nav Group */}
            <div className="w-full lg:w-auto lg:flex-1 lg:flex lg:flex-col">
                {/* Logo - Desktop Only */}
                <div className="hidden lg:block mb-8">
                    <NavLink to="/home" className="flex items-center gap-2 mb-10 no-underline">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
                            <div className="w-4 h-4 bg-dark rounded-full"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">Spottr</h1>
                    </NavLink>
                </div>

                {/* Navigation */}
                <nav className="flex flex-row w-full justify-around items-center lg:flex-col lg:gap-3 lg:justify-start">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-4 px-2 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 group overflow-hidden ${item.mobileOnly ? 'lg:hidden' : ''} ${isActive
                                    ? 'text-primary lg:bg-primary lg:text-dark font-bold lg:shadow-[0_0_20px_rgba(37,244,92,0.4)]'
                                    : 'text-gray-400 hover:text-white lg:hover:bg-gray-800/50'
                                }`
                            }
                        >
                            <span className="relative z-10">{item.icon}</span>
                            <span className="relative z-10 text-[10px] lg:text-base font-medium tracking-wide">{item.label}</span>

                            {/* Notification Badge Example using explicit check */}
                            {item.label === 'Messages' && (
                                <span className="absolute top-1 right-2 lg:right-3 w-3 h-3 lg:w-5 lg:h-5 bg-secondary text-white text-[8px] lg:text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg z-10">
                                    3
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile / Logout (Desktop Only) */}
            <div className="hidden lg:block border-t border-gray-800 pt-6">
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
