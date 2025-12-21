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
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-lg">
                <h2 className="mb-6 text-3xl font-bold text-center text-primary">Login</h2>
                {error && <div className="p-2 mb-4 text-white bg-red-500 rounded">{error}</div>}
                <form onSubmit={submitHandler}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-400">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-3 text-white bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-400">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 text-white bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-3 font-bold text-white transition rounded bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <span className="text-gray-400">New Customer? </span>
                    <Link to="/register" className="font-bold text-primary hover:underline">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
