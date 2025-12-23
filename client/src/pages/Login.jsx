import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md p-8 bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Welcome Back</h2>
                    <p className="text-gray-400 text-sm font-medium">Enter your credentials to access your dashboard</p>
                </div>

                {error && (
                    <div className="p-4 mb-6 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-4 text-white bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium placeholder-gray-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                        <input
                            type="password"
                            className="w-full p-4 text-white bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium placeholder-gray-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-4 mt-2 font-black text-black bg-gradient-to-r from-[#25F45C] to-[#1ee350] rounded-xl hover:shadow-[0_0_20px_rgba(37,244,92,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wide text-sm"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-800 pt-6">
                    <span className="text-gray-500 text-sm">Don't have an account? </span>
                    <Link to="/register" className="font-bold text-primary hover:text-white transition-colors ml-1">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
