import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaDumbbell, FaUtensils, FaCheckCircle } from "react-icons/fa";
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0 });
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false); // If no user, stop loading and show empty state or redirect
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Fetch latest user profile for stats
      const userRes = await axios.get(
        "http://localhost:5000/api/users/profile",
        config,
      );
      setStats(userRes.data.gamification || { xp: 0, level: 1, streak: 0 });
      setProfile(userRes.data.profile);
      setPlans(userRes.data.plans);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  const handleLogActivity = async (type) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        "http://localhost:5000/api/gamification/log",
        { type, details: `Logged ${type}` },
        config,
      );
      setStats(data); // API returns updated gamification stats
      const msg = type === "workout" ? "Workout crushed! +50 XP 🏋️" : "Meal logged! +25 XP 🥗";
      toast.success(msg, {
        style: {
          background: '#333',
          color: '#fff',
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const [loadingDiet, setLoadingDiet] = useState(false);

  const handleGenerateDiet = async () => {
    setLoadingDiet(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        "http://localhost:5000/api/ai/generate-diet",
        {},
        config,
      );

      // Update local plans state with new diet
      setPlans((prev) => ({ ...prev, diet: data }));
      toast.success("✨ Fresh Indian diet plan generated!", {
        style: { background: '#1a1a1a', color: '#25F45C', border: '1px solid #25F45C' }
      });
    } catch (error) {
      console.error("Generate Diet Error:", error);
      const msg =
        error.response?.data?.message || "Failed to generate diet plan.";
      toast.error(`⚠️ Error: ${msg}`);
    } finally {
      setLoadingDiet(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Legacy or Workout generation logic here if needed
      toast("Workout generation coming soon! Try the Diet Generator.", { icon: '🚧' });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return <div className="p-8 text-white">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8 pb-12 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase animate-pulse">
              ✨ Spottr AI
            </span>
          </div>
          <h1 className="text-6xl font-black text-white mb-2 tracking-tighter">
            Level {stats.level}
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            <span className="text-white font-bold">{stats.xp} XP</span> today •{" "}
            <span className="text-primary">{stats.streak} Day streak</span> 🔥
          </p>
        </div>
        {/* Level Progress Minimal */}
        <div className="text-right hidden md:block">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
            Next Rank
          </div>
          <div className="text-2xl font-bold text-white">Elite Lifter</div>
        </div>
      </div>

      {/* Key Stats Row */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Identity Card */}
          <div className="p-5 bg-gray-900 rounded-3xl border border-gray-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl">
              {profile.gymPersonality === "Powerlifter"
                ? "🦍"
                : profile.gymPersonality === "Bodybuilder"
                  ? "💪"
                  : "🏃"}
            </div>
            <div>
              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                Identity
              </div>
              <div className="text-white font-bold text-lg">
                {profile.gymPersonality || "Gym Bro"}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {["Squat", "Bench", "Deadlift"].map((lift) => (
            <div
              key={lift}
              className="p-5 bg-gray-900 rounded-3xl border border-gray-800 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                <FaDumbbell className="text-4xl text-white" />
              </div>
              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                {lift}
              </div>
              <div className="text-white font-black text-2xl tracking-tight">
                {profile.benchmarks?.[lift.toLowerCase()] || "-"}{" "}
                <span className="text-sm text-gray-600 font-medium">kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: AI Diet Plan (Now takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-[30px] p-8 border border-gray-800 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                  <FaUtensils className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-black text-white text-2xl tracking-tight">
                    Smart Diet
                  </h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">
                    AI Powered • {profile?.dietaryPreference || "Any Diet"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateDiet}
                disabled={loadingDiet}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-primary hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
              >
                {loadingDiet ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <span className="text-lg">✨</span>
                )}
                {loadingDiet ? "Generating..." : "Generate Daily Plan"}
              </button>
            </div>

            {plans?.diet ? (
              <div className="space-y-8 animate-fade-in">
                {/* Macros Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 bg-black rounded-3xl border border-gray-800 text-center">
                    <div className="text-4xl font-black text-white mb-1">
                      {plans.diet.calories}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Calories
                    </div>
                  </div>
                  <div className="p-6 bg-black rounded-3xl border border-gray-800 text-center">
                    <div className="text-4xl font-black text-primary mb-1">
                      {plans.diet.protein}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Protein (g)
                    </div>
                  </div>
                  <div className="p-6 bg-black rounded-3xl border border-gray-800 text-center">
                    <div className="text-4xl font-black text-white mb-1">
                      {plans.diet.macros?.carbs || "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Carbs (g)
                    </div>
                  </div>
                </div>

                {/* Meals List */}
                <div className="space-y-3">
                  {plans.diet.meals?.map((meal, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-5 bg-gray-800/30 rounded-2xl border border-gray-800 hover:border-primary/50 transition cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-12 bg-gray-700 rounded-full" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {meal.name}
                          </div>
                          <div className="text-white font-bold text-lg">
                            {meal.food}
                          </div>
                          {meal.suggestion && (
                            <div className="text-xs text-gray-400 mt-1">
                              {meal.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {meal.calories} kcal
                        </div>
                        <div className="text-xs text-primary font-bold">
                          {meal.protein}g pro
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Advice Footer */}
                <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 flex gap-4 items-start">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm text-gray-300 italic font-medium pt-1">
                    "{plans.diet.advice}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                <FaUtensils className="text-6xl text-gray-700 mb-4" />
                <h3 className="text-gray-400 font-bold text-xl">
                  No Active Plan
                </h3>
                <p className="text-gray-600">
                  Generate a new diet to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Quick Actions & Progress */}
        <div className="space-y-6">
          {/* Weekly Goal Progress */}
          <div className="bg-gray-900 rounded-[30px] p-8 border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />

            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  stroke="#2A2A2A"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  stroke="#25F45C"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={
                    2 * Math.PI * 70 * (1 - (stats.xp % 100) / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-3xl font-black text-white">
                  {stats.xp % 100}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-xl mb-1">Weekly Goal</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Keep pushing!
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-[30px] p-6 border border-gray-800">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 pl-2">
              Quick Log
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleLogActivity("workout")}
                className="w-full p-4 bg-gray-800 rounded-2xl hover:bg-white hover:text-black transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg text-white group-hover:bg-gray-200 group-hover:text-black transition">
                    <FaDumbbell />
                  </div>
                  <span className="font-bold">Log Workout</span>
                </div>
                <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded group-hover:bg-black/10 group-hover:text-black transition">
                  +50 XP
                </span>
              </button>
              <button
                onClick={() => handleLogActivity("meal")}
                className="w-full p-4 bg-gray-800 rounded-2xl hover:bg-white hover:text-black transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg text-white group-hover:bg-gray-200 group-hover:text-black transition">
                    <FaUtensils />
                  </div>
                  <span className="font-bold">Log Meal</span>
                </div>
                <span className="text-xs font-bold bg-secondary/20 text-secondary px-2 py-1 rounded group-hover:bg-black/10 group-hover:text-black transition">
                  +25 XP
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
