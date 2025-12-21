// Matchmaking Algorithm
// Score = Weighted Sum of Similarities

const WEIGHTS = {
    goals: 0.25,
    schedule: 0.20,
    level: 0.15,
    type: 0.10,
    personality: 0.10,
    commitment: 0.10,
    location: 0.10
};

// Calculate Jaccard Similarity for Arrays
const calculateJaccardSimilarity = (arr1, arr2) => {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
};

// Calculate Schedule Overlap
const calculateScheduleOverlap = (sched1, sched2) => {
    return calculateJaccardSimilarity(sched1, sched2);
};

// Calculate Level Similarity
const calculateLevelSimilarity = (level1, level2) => {
    if (level1 === level2) return 1.0;
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const idx1 = levels.indexOf(level1);
    const idx2 = levels.indexOf(level2);
    if (idx1 === -1 || idx2 === -1) return 0;
    return Math.abs(idx1 - idx2) === 1 ? 0.5 : 0;
};

// Calculate Gym Type Similarity
const calculateTypeSimilarity = (type1, type2) => {
    if (!type1 || !type2) return 0;
    if (type1 === type2) return 1.0;
    // Commercial is generally compatible with everything except maybe strict CrossFit/Calisthenics preferences
    if (type1 === 'Commercial' || type2 === 'Commercial') return 0.5;
    return 0;
};

// Calculate Personality Compatibility
// Motivator <-> Learner/Social (High)
// Silent grinder <-> Silent grinder (High)
// Planner <-> Planner (High)
const calculatePersonalityScore = (p1, p2) => {
    if (!p1 || !p2) return 0.5; // Default neutral
    if (p1 === p2) return 1.0; // Same energy usually works

    const pairs = [
        ['Motivator', 'Learner'],
        ['Motivator', 'Social'],
        ['Social', 'Learner']
    ];

    const isGoodPair = pairs.some(pair =>
        (pair[0] === p1 && pair[1] === p2) || (pair[0] === p2 && pair[1] === p1)
    );

    return isGoodPair ? 1.0 : 0.3; // Mismatched energies (e.g. Silent Grinder vs Social) get lower score
};

// Calculate Commitment Similarity
const calculateCommitmentScore = (c1, c2) => {
    if (!c1 || !c2) return 0;
    if (c1 === c2) return 1.0;
    const levels = ['Casual', 'Consistent', 'Hardcore'];
    const idx1 = levels.indexOf(c1);
    const idx2 = levels.indexOf(c2);
    if (idx1 === -1 || idx2 === -1) return 0;
    return Math.abs(idx1 - idx2) === 1 ? 0.5 : 0; // Adjacent is okay, casual vs hardcore is 0
};

// Calculate Location Score (Inverse Distance)
const calculateLocationScore = (loc1, loc2) => {
    if (!loc1 || !loc1.coordinates || !loc2 || !loc2.coordinates) return 0;
    const [lon1, lat1] = loc1.coordinates;
    const [lon2, lat2] = loc2.coordinates;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    if (d <= 5) return 1.0;
    if (d <= 15) return 0.8;
    if (d <= 30) return 0.5;
    return 0.1;
};

const calculateCompatibilityScore = (userA, userB) => {
    const pA = userA.profile || {};
    const pB = userB.profile || {};

    const sGoals = calculateJaccardSimilarity(pA.goals, pB.goals);
    const sSchedule = calculateScheduleOverlap(pA.availability, pB.availability);
    const sLevel = calculateLevelSimilarity(pA.fitnessLevel, pB.fitnessLevel);
    const sType = calculateTypeSimilarity(pA.gymType, pB.gymType);
    const sPersonality = calculatePersonalityScore(pA.gymPersonality, pB.gymPersonality);
    const sCommitment = calculateCommitmentScore(pA.commitment, pB.commitment);
    const sLoc = calculateLocationScore(pA.location, pB.location);

    const score = (
        (WEIGHTS.goals * sGoals) +
        (WEIGHTS.schedule * sSchedule) +
        (WEIGHTS.level * sLevel) +
        (WEIGHTS.type * sType) +
        (WEIGHTS.personality * sPersonality) +
        (WEIGHTS.commitment * sCommitment) +
        (WEIGHTS.location * sLoc)
    );

    return Math.round(score * 100); // 0-100
};

module.exports = { calculateCompatibilityScore };
