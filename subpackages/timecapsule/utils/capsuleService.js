// subpackages/timecapsule/utils/capsuleService.js
const storage = require('./storage');
const util = require('./util');
const cloudSync = require('../../../utils/cloudSync');

const KEY = 'TIME_CAPSULES';
const DISCOVERY_RADIUS = 50; // meters
const DISCOVERY_LIMIT = 5; // daily limit

// Helper to calculate distance between two coords in meters
const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth radius
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

const getCapsules = () => {
    return wx.getStorageSync(KEY) || [];
}

const saveCapsule = (capsule) => {
    const capsules = getCapsules();
    // Capsule structure:
    // { id, latitude, longitude, filePath, duration, createdAt, userId(mock), title }
    capsules.push(capsule);
    wx.setStorageSync(KEY, capsules);
    // 同步元数据到云端（filePath 为本地路径，音频文件需单独上传云存储）
    cloudSync.push('capsules', capsules);
    return capsules;
}

// Seed mock capsules near GPS — 用一次性 flag 控制，只生成一次
// 之前用 capsules.some(c => c.isMock) 判断会导致全删后重新生成
const MOCK_SEEDED_KEY = 'MOCK_CAPSULES_SEEDED';
const seedMockCapsules = (lat, lng) => {
    if (wx.getStorageSync(MOCK_SEEDED_KEY)) return;
    const capsules = getCapsules();
    for (let i = 0; i < 3; i++) {
        const latOffset = (Math.random() - 0.5) * 0.002;
        const lngOffset = (Math.random() - 0.5) * 0.002;
        capsules.push({
            id: util.uuid(),
            latitude: lat + latOffset,
            longitude: lng + lngOffset,
            filePath: '',
            duration: 30 + Math.floor(Math.random() * 30),
            createdAt: Date.now() - Math.floor(Math.random() * 10000000),
            userId: 'user_mock_' + i,
            title: `来自未来的声音 #${i+1}`,
            isMock: true
        });
    }
    wx.setStorageSync(KEY, capsules);
    wx.setStorageSync(MOCK_SEEDED_KEY, true);
}

const findNearbyCapsule = (lat, lng) => {
    const capsules = getCapsules();
    const todayStr = new Date().toDateString();
    const dailyCount = wx.getStorageSync('DAILY_DISCOVERY_' + todayStr) || 0;
    
    if (dailyCount >= DISCOVERY_LIMIT) {
        return { error: 'DAILY_LIMIT_REACHED' };
    }

    const nearby = capsules.filter(c => {
        const dist = getDistance(lat, lng, c.latitude, c.longitude);
        return dist <= DISCOVERY_RADIUS;
    });

    if (nearby.length > 0) {
        // Filter out recently played or own capsules if needed
        // For now just pick random
        const random = nearby[Math.floor(Math.random() * nearby.length)];
        
        // Increment count
        wx.setStorageSync('DAILY_DISCOVERY_' + todayStr, dailyCount + 1);
        return { capsule: random };
    }
    
    return { capsule: null };
}

const deleteCapsule = (id) => {
    let capsules = getCapsules();
    capsules = capsules.filter(c => c.id !== id);
    wx.setStorageSync(KEY, capsules);
    cloudSync.push('capsules', capsules);
}

const findNearbyCapsules = (lat, lng, radius = 1000) => {
    const capsules = getCapsules();
    
    const nearby = capsules.filter(c => {
        const dist = getDistance(lat, lng, c.latitude, c.longitude);
        return dist <= radius;
    });

    return nearby.map(c => ({
        ...c,
        distance: getDistance(lat, lng, c.latitude, c.longitude)
    }));
}

module.exports = {
    saveCapsule,
    getCapsules,
    findNearbyCapsule,
    findNearbyCapsules,
    seedMockCapsules,
    deleteCapsule
}
