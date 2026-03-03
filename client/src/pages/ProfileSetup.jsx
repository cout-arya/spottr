import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCamera, FaSave, FaDumbbell, FaRulerCombined, FaMapMarkerAlt, FaFire, FaBed, FaBeer, FaSmoking, FaBrain, FaUsers, FaUserSecret, FaClipboardList, FaVenusMars, FaCrop, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import toast from 'react-hot-toast';
import { indianCities } from '../data/indianCities';

const ProfileSetup = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();


    // Initial state with defaults
    const [formData, setFormData] = useState({
        // Basic
        name: user?.name || '',
        age: user?.profile?.age || '',
        gender: user?.profile?.gender || 'Male',
        state: user?.profile?.state || '',
        city: user?.profile?.city || '',
        height: user?.profile?.height || '',
        weight: user?.profile?.weight || '',
        dietaryPreference: user?.profile?.dietaryPreference || 'Non-vegetarian',
        bio: user?.profile?.bio || '',
        photos: user?.profile?.photos || [],

        // Fitness
        fitnessLevel: user?.profile?.fitnessLevel || 'Beginner',
        experienceYears: user?.profile?.experienceYears || 0,
        gymType: user?.profile?.gymType || 'Commercial',
        goals: user?.profile?.goals || [],

        // Enhanced
        benchmarks: {
            squat: user?.profile?.benchmarks?.squat && user.profile.benchmarks.squat !== 'None' && user.profile.benchmarks.squat !== 0 ? String(user.profile.benchmarks.squat).replace('kg', '') : '',
            bench: user?.profile?.benchmarks?.bench && user.profile.benchmarks.bench !== 'None' && user.profile.benchmarks.bench !== 0 ? String(user.profile.benchmarks.bench).replace('kg', '') : '',
            deadlift: user?.profile?.benchmarks?.deadlift && user.profile.benchmarks.deadlift !== 'None' && user.profile.benchmarks.deadlift !== 0 ? String(user.profile.benchmarks.deadlift).replace('kg', '') : ''
        },
        commitment: user?.profile?.commitment || 'Casual',
        lifestyle: {
            smoker: user?.profile?.lifestyle?.smoker || 'No',
            alcohol: user?.profile?.lifestyle?.alcohol || 'None',
            sleep: user?.profile?.lifestyle?.sleep || 'Irregular'
        },
        gymPersonality: user?.profile?.gymPersonality || 'Social',

        availability: user?.profile?.availability || []
    });

    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Photo Management States
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBenchmarkChange = (lift, value) => {
        setFormData({
            ...formData,
            benchmarks: { ...formData.benchmarks, [lift]: value }
        });
    };

    const handleLifestyleChange = (habit, value) => {
        setFormData({
            ...formData,
            lifestyle: { ...formData.lifestyle, [habit]: value }
        });
    };

    const toggleSelection = (field, value, max = null) => {
        const current = formData[field] || [];
        if (current.includes(value)) {
            setFormData({ ...formData, [field]: current.filter(item => item !== value) });
        } else {
            if (max && current.length >= max) return; // Enforce limit
            setFormData({ ...formData, [field]: [...current, value] });
        }
    };

    // --- Photo Management Logic ---
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
                setShowPhotoMenu(false);
                setShowCropper(true);
                // Reset file input so same file can be selected again
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const saveCroppedImage = async () => {
        try {
            const croppedImageBase64 = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            // Replace existing lead photo with new cropped version
            const newPhotos = [croppedImageBase64, ...(formData.photos.slice(1))];
            setFormData({ ...formData, photos: newPhotos });
            setShowCropper(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image.");
        }
    };

    const handleEditExistingPhoto = () => {
        if (formData.photos.length > 0) {
            setImageSrc(formData.photos[0]);
            setShowPhotoMenu(false);
            setShowCropper(true);
        }
    };

    const handleRemovePhoto = () => {
        // Remove the first photo (lead photo)
        const newPhotos = formData.photos.slice(1);
        setFormData({ ...formData, photos: newPhotos });
        setShowPhotoMenu(false);
    };
    // ------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Prevent massive legacy payloads from crashing the proxy/server
        if (formData.photos && formData.photos.length > 0) {
            if (formData.photos[0].length > 2000000) { // Approx 1.5MB
                toast.error("Photo is too large. Please remove it and re-upload to compress.", {
                    style: { background: '#333', color: '#EF4444', border: '1px solid #EF4444' }
                });
                setLoading(false);
                return;
            }
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { name, ...profileData } = formData;
            const payload = { ...profileData };

            if (payload.height) payload.height = Number(payload.height);
            if (payload.weight) payload.weight = Number(payload.weight);
            if (payload.experienceYears) payload.experienceYears = Number(payload.experienceYears);

            // Convert benchmarks to numbers if they exist
            if (payload.benchmarks) {
                payload.benchmarks.squat = Number(payload.benchmarks.squat) || 0;
                payload.benchmarks.bench = Number(payload.benchmarks.bench) || 0;
                payload.benchmarks.deadlift = Number(payload.benchmarks.deadlift) || 0;
            }

            const { data } = await axios.put('/users/profile', { name, profile: payload }, config);

            // Update Global State immediately
            // Merge returned profile into existing user object (since backend might return partial or just profile)
            const updatedUser = { ...user, name: data.name, profile: data.profile };
            if (data.token) updatedUser.token = data.token; // In case token is refreshed

            updateUser(updatedUser);

            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const SectionTitle = ({ icon, title }) => (
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-gray-800 pb-2">
            <span className="text-primary">{icon}</span> {title}
        </h3>
    );

    return (
        <div className="min-h-screen bg-black pb-32">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-2xl">
                <h1 className="text-2xl font-black text-white tracking-tight">Setup <span className="text-primary">Profile</span></h1>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-dark font-extrabold rounded-full hover:shadow-[0_0_30px_#25F45C] hover:scale-105 transition disabled:opacity-50"
                >
                    <FaSave /> {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">

                {/* 1. Identity Section (Premium Hero) */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-black p-8 md:p-12 rounded-[50px] border border-gray-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] isolation-auto">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                        {/* Profile Photo */}
                        <div className="relative shrink-0 flex flex-col items-center gap-4">
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                            />
                            <div className="relative group cursor-pointer" onClick={() => setShowPhotoMenu(!showPhotoMenu)}>
                                <div className="w-56 h-56 rounded-full p-2 bg-gradient-to-tr from-gray-800 to-gray-700 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 ease-out border border-gray-700/50">
                                    <div className="w-full h-full rounded-full overflow-hidden relative">
                                        {formData.photos.length > 0 ? (
                                            <img src={formData.photos[0]} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl text-gray-600">
                                                <FaCamera />
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                            <FaCamera className="text-white text-3xl mb-2 drop-shadow-md" />
                                            <span className="text-white font-bold text-xs uppercase tracking-widest text-shadow-md">Photo Options</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-primary text-dark rounded-full p-3 shadow-lg border-4 border-gray-900 z-10">
                                    <FaCamera className="text-lg" />
                                </div>
                            </div>

                            {/* Photo Options Menu */}
                            <AnimatePresence>
                                {showPhotoMenu && (
                                    <>
                                        {/* Click outside to close overlay */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowPhotoMenu(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-[80%] z-50 mt-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden w-48"
                                        >
                                            <button
                                                onClick={() => { fileInputRef.current?.click(); setShowPhotoMenu(false); }}
                                                className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-gray-800 flex items-center gap-3 transition-colors"
                                            >
                                                <FaCamera className="text-primary" /> Upload New
                                            </button>
                                            {formData.photos.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={handleEditExistingPhoto}
                                                        className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-gray-800 flex items-center gap-3 transition-colors border-t border-gray-800"
                                                    >
                                                        <FaCrop className="text-blue-400" /> Edit & Crop
                                                    </button>
                                                    <button
                                                        onClick={handleRemovePhoto}
                                                        className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-gray-800 flex items-center gap-3 transition-colors border-t border-gray-800"
                                                    >
                                                        <FaTrash className="text-red-500" /> Remove Photo
                                                    </button>
                                                </>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Identity Inputs */}
                        <div className="w-full space-y-8">
                            {/* Name Input - Full Width */}
                            <div className="relative group w-full">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-transparent shadow-inner"
                                    placeholder="Full Name"
                                    required
                                />
                                <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary transition-all">
                                    Full Name
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {/* Age Input - Floating Label Style */}
                                <div className="relative group">
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-transparent shadow-inner"
                                        placeholder="Age"
                                    />
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary transition-all">
                                        Age
                                    </label>
                                </div>

                                {/* Gender Select */}
                                <div className="relative group">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Non-binary</option>
                                        <option>Other</option>
                                    </select>
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-focus:text-primary transition-all">Gender</label>
                                    <FaVenusMars className="absolute right-6 top-5 text-gray-600 pointer-events-none text-xl" />
                                </div>
                            </div>

                            {/* State & City Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {/* State Select */}
                                <div className="relative group">
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="">Select State</option>
                                        {Object.keys(indianCities).sort().map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-focus:text-primary transition-all">State</label>
                                    <FaMapMarkerAlt className="absolute right-6 top-5 text-gray-600 pointer-events-none text-xl" />
                                </div>

                                {/* City Select */}
                                <div className="relative group">
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={!formData.state}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all appearance-none cursor-pointer shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select City</option>
                                        {formData.state && indianCities[formData.state]?.sort().map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-focus:text-primary transition-all">City</label>
                                    <FaMapMarkerAlt className="absolute right-6 top-5 text-gray-600 pointer-events-none text-xl" />
                                </div>
                            </div>

                            {/* Bio Input */}
                            <div className="relative group">
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-medium text-lg rounded-2xl px-6 py-4 pt-8 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-transparent shadow-inner min-h-[140px] resize-none leading-relaxed"
                                    placeholder="Bio"
                                />
                                <label className="absolute left-6 top-3 text-xs font-bold text-gray-500 uppercase tracking-wider peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary transition-all">
                                    Your Fitness Bio
                                </label>
                                <div className="absolute bottom-4 right-6 text-xs font-bold text-gray-600 pointer-events-none">
                                    {formData.bio.length} / 150
                                </div>
                            </div>

                            {/* Height & Weight */}
                            <div className="grid grid-cols-2 gap-6 w-full">
                                <div className="relative group">
                                    <input
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-transparent shadow-inner"
                                        placeholder="Height"
                                    />
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary transition-all">
                                        Height (cm)
                                    </label>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        className="peer w-full bg-gray-900/50 border-2 border-gray-800 text-white font-bold text-lg rounded-2xl px-6 py-4 pt-6 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-transparent shadow-inner"
                                        placeholder="Weight"
                                    />
                                    <label className="absolute left-6 top-2 text-xs font-bold text-gray-500 uppercase tracking-wider peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary transition-all">
                                        Weight (kg)
                                    </label>
                                </div>
                            </div>


                            {/* Dietary Preference */}
                            <div className="w-full">
                                <label className="label-text mb-4">Dietary Preference</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'].map(type => (
                                        <button key={type} type="button" onClick={() => setFormData({ ...formData, dietaryPreference: type })}
                                            className={`py-3 rounded-xl font-bold text-sm transition ${formData.dietaryPreference === type ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-900 border border-gray-800 text-gray-500 hover:bg-gray-800'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* 2. Fitness & Experience */}
                <section>
                    <SectionTitle icon={<FaDumbbell />} title="Training Experience" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card space-y-4">
                            <label className="label-text">Experience Level</label>
                            <div className="flex gap-2">
                                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                    <button key={level} type="button" onClick={() => setFormData({ ...formData, fitnessLevel: level })}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${formData.fitnessLevel === level ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <label className="label-text mt-4">Years Training</label>
                            <input type="range" name="experienceYears" min="0" max="20" value={formData.experienceYears} onChange={handleChange} className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            <div className="text-right text-primary font-mono text-xl">{formData.experienceYears} Years</div>
                        </div>

                        <div className="card space-y-4">
                            <label className="label-text">Primary Gym Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Commercial', 'CrossFit', 'Home Gym', 'Calisthenics'].map(type => (
                                    <button key={type} type="button" onClick={() => setFormData({ ...formData, gymType: type })}
                                        className={`py-3 rounded-xl font-bold text-sm transition ${formData.gymType === type ? 'bg-secondary text-white shadow-[0_0_15px_#A020F0]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Strength Benchmarks */}
                <section>
                    <SectionTitle icon={<FaFire />} title="Strength Benchmarks" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Squat', 'Bench', 'Deadlift'].map(lift => {
                            const key = lift.toLowerCase();
                            return (
                                <div key={lift} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl flex flex-col gap-4">
                                    <h4 className="text-2xl font-black text-white uppercase italic">{lift}</h4>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={formData.benchmarks[key]}
                                            onChange={(e) => handleBenchmarkChange(key, e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 text-white font-bold text-xl rounded-xl px-4 py-3 focus:border-primary focus:bg-gray-900 outline-none transition-all placeholder-gray-600"
                                            placeholder="0"
                                            min="0"
                                            max="500"
                                        />
                                        <span className="absolute right-4 top-3 text-gray-500 font-bold">kg</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4. Goals & Commitment */}
                <section>
                    <SectionTitle icon={<FaRulerCombined />} title="Goals & Commitment" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <label className="label-text mb-4 block">Primary Goals (Max 2)</label>
                            <div className="flex flex-wrap gap-3">
                                {['Fat Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness', 'Rehab'].map(goal => (
                                    <button key={goal} type="button" onClick={() => toggleSelection('goals', goal, 2)}
                                        className={`px-6 py-3 rounded-full font-bold text-sm transition border ${formData.goals.includes(goal) ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label-text mb-4 block">Commitment Level</label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { level: 'Casual', desc: '2–3x/week' },
                                    { level: 'Consistent', desc: '4–5x/week' },
                                    { level: 'Hardcore', desc: '6x/week' }
                                ].map(({ level, desc }) => (
                                    <button key={level} type="button" onClick={() => setFormData({ ...formData, commitment: level })}
                                        className={`py-6 rounded-2xl border-2 flex flex-col items-center gap-1 transition ${formData.commitment === level ? 'border-primary bg-primary/10 text-white' : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-600'}`}>
                                        <FaFire className={formData.commitment === level ? "text-primary text-2xl" : "text-gray-600 text-xl"} />
                                        <span className="font-bold text-sm">{level}</span>
                                        <span className="text-[10px] font-medium opacity-70">({desc})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Lifestyle Flags */}
                <section>
                    <SectionTitle icon={<FaUserSecret />} title="Lifestyle" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card">
                            <div className="flex items-center gap-3 mb-4 text-gray-400"><FaSmoking /> <span className="font-bold text-white">Smoker</span></div>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                {['Yes', 'No'].map(opt => (
                                    <button key={opt} type="button" onClick={() => handleLifestyleChange('smoker', opt)}
                                        className={`flex-1 py-2 rounded-md font-bold text-xs transition ${formData.lifestyle.smoker === opt ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3 mb-4 text-gray-400"><FaBeer /> <span className="font-bold text-white">Alcohol</span></div>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                {['None', 'Occasional', 'Frequent'].map(opt => (
                                    <button key={opt} type="button" onClick={() => handleLifestyleChange('alcohol', opt)}
                                        className={`flex-1 py-2 rounded-md font-bold text-xs transition ${formData.lifestyle.alcohol === opt ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-3 mb-4 text-gray-400"><FaBed /> <span className="font-bold text-white">Sleep</span></div>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                {['Early', 'Late', 'Irregular'].map(opt => (
                                    <button key={opt} type="button" onClick={() => handleLifestyleChange('sleep', opt)}
                                        className={`flex-1 py-2 rounded-md font-bold text-xs transition ${formData.lifestyle.sleep === opt ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Gym Personality */}
                <section>
                    <SectionTitle icon={<FaBrain />} title="Gym Personality" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {['Motivator', 'Silent grinder', 'Planner', 'Learner', 'Social'].map(type => (
                            <button key={type} type="button" onClick={() => setFormData({ ...formData, gymPersonality: type })}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition ${formData.gymPersonality === type ? 'border-secondary bg-secondary/10 text-white' : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-600'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${formData.gymPersonality === type ? 'bg-secondary text-white' : 'bg-gray-800 text-gray-600'}`}>
                                    {type[0]}
                                </div>
                                <span className="font-bold text-xs text-center">{type}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 7. Availability */}
                <section>
                    <SectionTitle icon={<FaClipboardList />} title="Preferred Times" />
                    <div className="flex flex-wrap gap-3">
                        {['Early Morning (5-8 AM)', 'Morning', 'Afternoon', 'Evening', 'Late Night'].map(time => (
                            <button key={time} type="button" onClick={() => toggleSelection('availability', time)}
                                className={`px-5 py-2 rounded-lg font-bold text-sm transition border ${formData.availability?.includes(time) ? 'bg-accent text-dark border-accent' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                                {time}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Logout Section */}
                <div className="pt-12 border-t border-gray-800 flex justify-center">
                    <button
                        onClick={logout}
                        className="px-8 py-3 rounded-full font-bold text-red-500 border-2 border-red-500/20 hover:bg-red-500/10 hover:border-red-500 transition-all"
                    >
                        Log Out
                    </button>
                </div>

            </div>

            {/* Global Styles for this page */}
            <style>{`
                .label-text { @apply block text-xs font-bold text-gray-500 uppercase mb-2 ml-1; }
                .input-field { @apply w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white font-medium focus:border-primary outline-none transition placeholder-gray-600; }
                .card { @apply bg-gray-900 rounded-3xl p-6 border border-gray-800; }
            `}</style>

            {/* Cropper Modal */}
            <AnimatePresence>
                {showCropper && imageSrc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col backdrop-blur-md"
                    >
                        <div className="flex-1 relative">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // 1:1 Aspect ratio for profile pictures
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={handleCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Cropper Controls */}
                        <div className="bg-gray-900 border-t border-gray-800 p-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                            <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-4 md:justify-between">
                                {/* Mobile Zoom Slider (Shows on both now, but styled for touch) */}
                                <div className="w-full md:flex-1 md:max-w-sm flex items-center gap-3">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Zoom</span>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(e.target.value)}
                                        className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex w-full md:w-auto gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCropper(false);
                                            setImageSrc(null);
                                        }}
                                        className="flex-1 md:flex-none px-6 py-3 rounded-full text-white font-bold bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaTimes /> <span className="hidden sm:inline">Cancel</span>
                                    </button>

                                    <button
                                        onClick={saveCroppedImage}
                                        className="flex-[2] md:flex-none px-8 py-3 rounded-full bg-primary text-dark font-extrabold active:scale-95 md:hover:scale-105 transition-transform shadow-[0_0_15px_#25F45C] flex items-center justify-center gap-2"
                                    >
                                        <FaCheck /> Save Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ProfileSetup;
