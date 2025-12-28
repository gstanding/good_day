const { Solar, Lunar } = require('./lunar.js');

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${[year, month, day].map(formatNumber).join('/')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get Date object for calculation
const getTargetDateObj = (targetDateStr, type = 'solar', cycle = 'year') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  
  if (type === 'lunar') {
    const solarToday = Solar.fromDate(today);
    const lunarToday = solarToday.getLunar();
    const currentLunarYear = lunarToday.getYear();
    const currentLunarMonth = lunarToday.getMonth();
    
    // Cycle handling for Lunar
    if (cycle === 'week') {
      // Lunar Weekly doesn't really exist as a concept separate from Solar Weekly.
      // We'll treat "Weekly" as Solar Weekly even if type is Lunar, 
      // or we just find the next occurrence of that Lunar Day? 
      // Usually Weekly means "Every Friday". 
      // Let's fallback to Solar Weekly logic based on the original date's day of week.
      // Convert original lunar date to solar to find day of week
      const origLunar = Lunar.fromYmd(tYear, tMonth, tDay);
      const origSolar = origLunar.getSolar();
      const origDate = new Date(origSolar.getYear(), origSolar.getMonth() - 1, origSolar.getDay());
      return getNextWeekDay(origDate, today);
    } else if (cycle === 'month') {
      // Monthly: Next occurrence of Lunar Day (e.g. 15th)
      // Check current lunar month
      let targetLunar = Lunar.fromYmd(currentLunarYear, currentLunarMonth, tDay);
      let targetSolar = targetLunar.getSolar();
      let d = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
      
      if (d < today) {
        // Try next lunar month
        // Handle year rollover for lunar month
        let nextM = currentLunarMonth + 1;
        let nextY = currentLunarYear;
        if (nextM > 12) {
            nextM = 1;
            nextY++;
        }
        targetLunar = Lunar.fromYmd(nextY, nextM, tDay);
        targetSolar = targetLunar.getSolar();
        d = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
      }
      return d;
    } else {
      // Annual (default)
      let targetLunar = Lunar.fromYmd(currentLunarYear, tMonth, tDay);
      let targetSolar = targetLunar.getSolar();
      let d = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
      
      if (d < today) {
        targetLunar = Lunar.fromYmd(currentLunarYear + 1, tMonth, tDay);
        targetSolar = targetLunar.getSolar();
        d = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
      }
      return d;
    }

  } else {
    // Solar
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    
    if (cycle === 'week') {
      const origDate = new Date(tYear, tMonth - 1, tDay);
      return getNextWeekDay(origDate, today);
    } else if (cycle === 'month') {
      // Monthly: Next occurrence of Day
      // Check current month
      let d = new Date(currentYear, currentMonth - 1, tDay);
      // Handle end of month overflow automatically by Date? 
      // new Date(2023, 1, 30) -> March 2. 
      // We want to clamp or skip? Standard is usually clamp or use last day.
      // Let's simple check: if date.getDate() != tDay, it means overflowed.
      
      if (d.getDate() !== tDay) {
         // Overflowed (e.g. Feb 30), move to last day of that month? 
         // Or just let it be March? 
         // Let's strict it: if current month doesn't have that day, we might check if today is past the last day.
         // Simpler approach: construct date, if < today, try next month.
         // But we need to handle the overflow issue first.
         // Let's just use the JS behavior (overflow into next month) but checking if it's correct target?
         // No, users expect "Monthly on 31st" to skip Feb? or hit Feb 28?
         // Let's stick to simple JS Date behavior for now: overflow is valid date.
         // Actually, let's fix the day if it changes.
         d = new Date(currentYear, currentMonth - 1, tDay);
      }
      
      if (d < today) {
        d = new Date(currentYear, currentMonth, tDay); // Next month
      }
      return d;
    } else {
      // Annual
      let d = new Date(currentYear, tMonth - 1, tDay);
      if (d < today) {
        d = new Date(currentYear + 1, tMonth - 1, tDay);
      }
      return d;
    }
  }
}

const getNextWeekDay = (origDate, today) => {
  const targetDayOfWeek = origDate.getDay(); // 0-6
  const currentDayOfWeek = today.getDay();
  
  let diff = targetDayOfWeek - currentDayOfWeek;
  if (diff < 0) diff += 7;
  if (diff === 0 && origDate < today) {
      // If today is the day, but we might want next week if time passed?
      // Our logic compares dates at 00:00. If today is the day, diff is 0.
      // If we want "Today" to count as 0 days left, then diff 0 is fine.
      // If "Today" is passed (e.g. it's night), usually we still show 0.
      // But if user wants *next* occurrence? 
      // "Countdown" usually includes today.
      // If today is the target, return today.
      return today; 
  }
  
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

// Calculate days difference: target - today
const getDaysLeft = (targetDateStr, type = 'solar', cycle = 'year') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = getTargetDateObj(targetDateStr, type, cycle);
  const diffTime = Math.abs(targetDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

// Calculate accumulated days: today - start
const getDaysPassed = (startDateStr, type = 'solar') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate;
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);

  if (type === 'lunar') {
    const lunar = Lunar.fromYmd(sYear, sMonth, sDay);
    const solar = lunar.getSolar();
    startDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
  } else {
    startDate = new Date(sYear, sMonth - 1, sDay);
  }

  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

const getNextDate = (dateStr, type = 'solar', cycle = 'year') => {
   const d = getTargetDateObj(dateStr, type, cycle);
   const [year, month, day] = dateStr.split('-').map(Number); // Original
   
   let suffix = '';
   if (type === 'lunar') {
     suffix = ` (农历: ${month}/${day})`;
   }
   
   return `${d.getFullYear()}-${formatNumber(d.getMonth() + 1)}-${formatNumber(d.getDate())}${suffix}`;
}

const getCycleProgress = (dateStr, type = 'solar', cycle = 'year') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = getTargetDateObj(dateStr, type, cycle);
    
    // Find previous date
    let prevDate = new Date(nextDate);
    if (cycle === 'week') {
        prevDate.setDate(prevDate.getDate() - 7);
    } else if (cycle === 'month') {
        prevDate.setMonth(prevDate.getMonth() - 1);
        // Handle month length diff? 
        // Simply: if today is 10th, next is 15th. prev was 15th last month.
    } else {
        prevDate.setFullYear(prevDate.getFullYear() - 1);
    }
    
    const totalDuration = (nextDate - prevDate) / (1000 * 60 * 60 * 24);
    const passedDuration = (today - prevDate) / (1000 * 60 * 60 * 24);
    
    let percent = Math.floor((passedDuration / totalDuration) * 100);
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    
    return percent;
}

module.exports = {
  formatTime,
  uuid,
  getDaysLeft,
  getDaysPassed,
  getNextDate,
  getCycleProgress
}
