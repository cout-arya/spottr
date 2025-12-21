import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const [error, setError] = useState('');

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
        } else {
            try {
                await register(name, email, password);
                navigate('/profile-setup');
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-lg">
                <h2 className="mb-6 text-3xl font-bold text-center text-primary">Sign Up</h2>
                {message && <div className="p-2 mb-4 text-white bg-red-500 rounded">{message}</div>}
                {error && <div className="p-2 mb-4 text-white bg-red-500 rounded">{error}</div>}
                <form onSubmit={submitHandler}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-400">Name</label>
                        <input
                            type="text"
                            className="w-full p-3 text-white bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name"
                        />
                    </div>
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
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-400">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 text-white bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-400">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full p-3 text-white bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-3 font-bold text-white transition rounded bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                        Register
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <span className="text-gray-400">Have an account? </span>
                    <Link to="/login" className="font-bold text-primary hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
