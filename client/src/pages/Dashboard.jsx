import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaDumbbell, FaUtensils, FaCheckCircle, FaTrophy, FaMedal, FaFire, FaRobot } from "react-icons/fa";
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0, badges: [] });
  const [plans, setPlans] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Smart Log State
  const [logInput, setLogInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const userRes = await axios.get("http://localhost:5000/api/users/profile", config);
      setStats(userRes.data.gamification || { xp: 0, level: 1, streak: 0, badges: [] });
      setProfile(userRes.data.profile);
      setPlans(userRes.data.plans);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("http://localhost:5000/api/gamification/leaderboard", config);
      setLeaderboard(data);
    } catch (error) {
      console.error("Error fetching leaderboard", error);
    }
  };

  const handleSmartLog = async () => {
    if (!logInput.trim()) return;
    setIsAnalyzing(true);
    const toastId = toast.loading("AI Analyzing your log...");

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      // 1. Analyze with AI
      const analyzeRes = await axios.post(
        "http://localhost:5000/api/ai/analyze-log",
        { text: logInput },
        config
      );

      const analysis = analyzeRes.data; // { type, xp, data, summary }

      // 2. Commit Log
      const logRes = await axios.post(
        "http://localhost:5000/api/gamification/log",
        {
          type: analysis.type,
          xpOverride: analysis.xp,
          details: analysis.summary,
          data: analysis.data
        },
        config
      );

      // 3. Update State
      setStats(logRes.data);
      setLogInput("");

      // Feedback
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">{analysis.summary} Logged!</span>
          <span className="text-xs text-primary">+{analysis.xp} XP Earned</span>
        </div>,
        { id: toastId, duration: 4000, icon: '🤖' }
      );

      // Check for new badges
      if (logRes.data.newBadges?.length > 0) {
        logRes.data.newBadges.forEach(badge => {
          toast(`New Badge Unlocked: ${badge}`, { icon: '🏆', duration: 5000 });
        });
      }

    } catch (error) {
      console.error(error);
      toast.error("Could not log activity", { id: toastId });
    } finally {
      setIsAnalyzing(false);
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
      setPlans((prev) => ({ ...prev, diet: data }));
      toast.success("✨ Fresh Indian diet plan generated!", {
        style: { background: '#1a1a1a', color: '#25F45C', border: '1px solid #25F45C' }
      });
    } catch (error) {
      console.error("Generate Diet Error:", error);
      const msg = error.response?.data?.message || "Failed to generate diet plan.";
      toast.error(`⚠️ Error: ${msg}`);
    } finally {
      setLoadingDiet(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8 pb-12 min-h-screen font-sans">
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
            <span className="text-white font-bold">{stats.xp} XP</span> Total •{" "}
            <span className="text-primary">{stats.streak} Day streak</span> 🔥
          </p>
        </div>

        {/* Badges Row */}
        <div className="flex gap-2">
          {stats.badges?.map((badge, i) => (
            <div key={i} className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-full text-xs font-bold text-yellow-500 flex items-center gap-1" title={badge}>
              {badge.includes('Streak') ? '🔥' : badge.includes('Machine') ? '🤖' : badge.includes('Early') ? '🌅' : '🏅'}
              <span className="hidden md:inline">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: 2/3 Width */}
        <div className="lg:col-span-2 space-y-6">

          {/* Smart Log Input */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[30px] p-1 border border-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <FaRobot className="text-6xl text-primary" />
            </div>
            <div className="p-6">
              <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                <FaRobot className="text-primary" /> Smart Log
              </h3>
              <p className="text-gray-500 text-xs mb-4">
                Tell AI what you did. E.g. "Ate 2 eggs" or "Hit chest for 45 mins".
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLog()}
                  placeholder="Type here..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                />
                <button
                  onClick={handleSmartLog}
                  disabled={isAnalyzing || !logInput}
                  className="px-6 py-3 bg-[#25F45C] hover:bg-[#1ee350] text-black font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,244,92,0.3)] hover:shadow-[0_0_20px_rgba(37,244,92,0.5)]"
                >
                  {isAnalyzing ? <span className="animate-spin">⌛</span> : 'LOG'}
                </button>
              </div>
            </div>
          </div>

          {/* Smart Diet Section (Premium UI) */}
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 relative overflow-hidden shadow-2xl">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-primary to-green-600 rounded-lg text-black shadow-lg shadow-primary/20">
                    <FaUtensils className="text-xl" />
                  </div>
                  <span className="text-xs font-bold text-primary tracking-[0.2em] uppercase">AI Nutritionist</span>
                </div>
                <h3 className="font-black text-white text-3xl tracking-tighter">Daily Fuel Plan</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  Optimized for: <span className="text-white border-b border-primary/30">{profile?.dietaryPreference || "Performance"}</span>
                </p>
              </div>

              <button
                onClick={handleGenerateDiet}
                disabled={loadingDiet}
                className="px-6 py-3 bg-[#25F45C] hover:bg-[#1ee350] text-black font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,244,92,0.3)] hover:shadow-[0_0_20px_rgba(37,244,92,0.5)] flex items-center gap-2"
              >
                {loadingDiet ? <span className="animate-spin">⌛</span> : <span className="text-xl">🔄</span>}
                {loadingDiet ? "COOKING..." : (plans?.diet ? "REGENERATE" : "CREATE PLAN")}
              </button>
            </div>

            {plans?.diet ? (
              <div className="space-y-8 relative z-10 animate-fade-in-up">

                {/* Nutrition Dashboard (Macros) */}
                <div className="bg-black/40 rounded-3xl p-6 border border-white/5 backdrop-blur-sm shadow-inner">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Intake</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{plans.diet.calories}</span>
                        <span className="text-sm text-gray-500 font-medium">kcal</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-primary mb-1">{plans.diet.protein}g Protein</span>
                    </div>
                  </div>
                  {/* Fake Progress Bars for Visuals */}
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full bg-primary shadow-[0_0_10px_#25F45C]" style={{ width: '45%' }} />
                    <div className="h-full bg-blue-500" style={{ width: '30%' }} />
                    <div className="h-full bg-orange-500" style={{ width: '25%' }} />
                  </div>
                  <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Protein</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Carbs</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Fats</span>
                  </div>
                </div>

                {/* Timeline Layout for Meals */}
                <div className="space-y-4">
                  {plans.diet.meals?.map((meal, idx) => (
                    <div key={idx} className="group flex gap-4 relative">
                      {/* Timeline Line */}
                      {idx !== plans.diet.meals.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-gray-800 group-hover:bg-gray-700 transition" />
                      )}

                      {/* Icon */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-orange-500/20 border-orange-500 text-orange-500' :
                        idx === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                          idx === 2 ? 'bg-purple-500/20 border-purple-500 text-purple-500' :
                            'bg-blue-500/20 border-blue-500 text-blue-500'
                        }`}>
                        {idx === 0 ? '🌅' : idx === 1 ? '☀️' : idx === 2 ? '🍿' : '🌙'}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-gray-800/40 border border-white/5 rounded-2xl p-4 hover:bg-gray-800 transition duration-300 hover:border-white/10">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition">{meal.food}</h4>
                          <div className="text-right">
                            <div className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded inline-block">{meal.calories} kcal</div>
                            <div className="text-[10px] text-primary font-bold mt-1">{meal.protein}g Pro</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-[90%]">{meal.suggestion}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{meal.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advice Footer */}
                <div className="relative pt-6 border-t border-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="min-w-[40px] h-[40px] rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center text-xl shadow-inner">
                      💡
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Coach's Tip</h5>
                      <p className="text-sm text-gray-300 italic font-medium leading-relaxed">"{plans.diet.advice}"</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <FaUtensils className="text-3xl text-gray-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Ready to Eat Clean?</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                  Get a personalized nutrition plan powered by AI, tailored exactly to your goals.
                </p>
                <div className="flex gap-2 text-2xl opacity-30 grayscale">
                  <span>🥗</span><span>🥩</span><span>🥑</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">

          {/* Weekly Goal Progress */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[30px] p-8 border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 shadow-[0_0_15px_#25F45C]" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition duration-700" />

            <div className="relative w-48 h-48 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(37,244,92,0.2)]">
                <circle cx="50%" cy="50%" r="80" stroke="#1A1A1A" strokeWidth="12" fill="transparent" />
                <circle
                  cx="50%" cy="50%" r="80" stroke="#25F45C" strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - (stats.xp % 1000) / 1000)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center animate-fade-in">
                <FaFire className="text-orange-500 text-2xl mb-2 animate-bounce-slow" />
                <span className="block text-4xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                  {Math.floor((stats.xp % 1000) / 10)}<span className="text-lg text-gray-500">%</span>
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">To Lvl {stats.level + 1}</span>
              </div>
            </div>

            <div className="text-center z-10">
              <h3 className="text-white font-bold text-xl mb-1 flex items-center justify-center gap-2">
                Weekly Grind
              </h3>
              <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto leading-relaxed">
                You're crushing it! Keep logging to hit that next level.
              </p>
            </div>
          </div>

          {/* Leaderboard Widget */}
          <div className="bg-gray-900 rounded-[30px] p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FaTrophy className="text-yellow-500" /> Leaderboard
              </h3>
              <span className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">Top 10</span>
            </div>

            <div className="space-y-4">
              {leaderboard.map((user, idx) => (
                <div key={user._id} className="flex items-center gap-4 group cursor-default">
                  <div className={`w-6 text-center font-black ${idx < 3 ? 'text-yellow-500 text-lg' : 'text-gray-600 text-sm'}`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-700 group-hover:border-primary transition">
                    {user.profile?.photos?.[0] ? (
                      <img src={user.profile.photos[0]} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm group-hover:text-primary transition">{user.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{user.gamification?.xp || 0} XP</div>
                  </div>
                  {idx === 0 && <FaMedal className="text-yellow-500 drop-shadow-md" />}
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center text-gray-600 text-xs py-4">No data yet</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
