// Default core data updated exactly to prompt instructions
const DEFAULT_ACTIVITIES = [
    { id: '1', name: 'SQL', timeRange: '5:30 AM – 6:00 AM', startTime: '05:30', endTime: '06:00', emoji: '📕', isOptional: true, desc: "Consistent effort brings results. Keep pushing forward!" },
    { id: '2', name: 'LeetCode', timeRange: '6:00 AM – 7:00 AM', startTime: '06:00', endTime: '07:00', emoji: '💻', isOptional: false, desc: "Practice DSA and improve problem solving skills." },
    { id: '3', name: 'Udemy Course', timeRange: '7:30 PM – 8:30 PM', startTime: '19:30', endTime: '20:30', emoji: '🎓', isOptional: false, desc: "Learn new concepts and build strong fundamentals." },
    { id: '4', name: 'Aptitude', timeRange: '9:30 PM – 10:30 PM', startTime: '21:30', endTime: '22:30', emoji: '🧠', isOptional: false, desc: "Improve speed and accuracy for placements." }
];

// 4 Specific pastel themes mapping to exactly 4 cols
const THEMES = ['theme-card-1', 'theme-card-2', 'theme-card-3', 'theme-card-4'];

// App State
let activities = [];
let historyData = {}; 
let todayDateStr = '';

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.dashboard-content');
const currentDateTop = document.getElementById('current-date-top');

const tasksGrid = document.getElementById('tasks-grid');
const scheduleListEl = document.getElementById('schedule-list');
const activityModal = document.getElementById('activity-modal');
const activityForm = document.getElementById('activity-form');

const currentStreakEl = document.getElementById('dash-current-streak');
const weeklyAvgEl = document.getElementById('dash-weekly-avg');

// Initialization
function initApp() {
    loadData();
    setTodayDate();
    setupEventListeners();
    updateUI();
}

function loadData() {
    const savedActivities = localStorage.getItem('studyTracker_activities');
    if (savedActivities) {
        activities = JSON.parse(savedActivities);
    } else {
        activities = [...DEFAULT_ACTIVITIES];
        saveActivities();
    }

    const savedHistory = localStorage.getItem('studyTracker_history');
    historyData = savedHistory ? JSON.parse(savedHistory) : {};
}

function saveActivities() { localStorage.setItem('studyTracker_activities', JSON.stringify(activities)); }
function saveHistory() { localStorage.setItem('studyTracker_history', JSON.stringify(historyData)); }

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setTodayDate() {
    todayDateStr = getTodayString();
    const d = new Date();
    currentDateTop.textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (!historyData[todayDateStr]) {
        historyData[todayDateStr] = { completions: {}, stats: { done: 0, total: activities.length, percent: 0 } };
        saveHistory();
    }
}

function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m} ${ampm}`;
}

function determineEmoji(name) {
    const lower = name.toLowerCase();
    if (lower.includes('code') || lower.includes('program')) return '💻';
    if (lower.includes('course') || lower.includes('study')) return '🎓';
    if (lower.includes('aptitude') || lower.includes('brain')) return '🧠';
    if (lower.includes('sql') || lower.includes('database')) return '📕';
    return '📝';
}

function setupEventListeners() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            // handle click on span vs button
            const targetBtn = e.target.closest('.nav-btn');
            targetBtn.classList.add('active');
            
            const tab = targetBtn.dataset.tab;
            views.forEach(v => v.classList.add('hidden'));
            document.getElementById(`${tab}-view`).classList.remove('hidden');

            if (tab === 'history') renderHistoryTabUi();
            else if (tab === 'schedule') renderSchedule();
            else renderToday();
        });
    });

    document.getElementById('open-add-modal-btn').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Add Activity';
        activityForm.reset();
        document.getElementById('activity-id').value = '';
        activityModal.classList.add('open');
    });

    document.getElementById('cancel-modal-btn').addEventListener('click', () => activityModal.classList.remove('open'));

    activityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('activity-id').value;
        const name = document.getElementById('activity-name').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const timeRange = `⏳ ${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
        const isOptional = document.getElementById('is-optional').checked;
        
        if (idInput) {
            const act = activities.find(a => a.id === idInput);
            if (act) {
                act.name = name; act.startTime = startTime; act.endTime = endTime;
                act.timeRange = timeRange; act.isOptional = isOptional;
            }
        } else {
            activities.push({
                id: Date.now().toString(), name, startTime, endTime, timeRange, isOptional,
                emoji: determineEmoji(name), desc: "A new activity to master."
            });
        }
        
        if (historyData[todayDateStr]) calculateDailyStats(todayDateStr);
        saveActivities(); saveHistory();
        
        activityModal.classList.remove('open');
        renderSchedule(); renderToday(); // Refresh
    });
}

function updateUI() {
    renderToday(); // renders dashboard
}

/* ---------------- DASHBOARD ---------------- */
function renderToday() {
    tasksGrid.innerHTML = '';
    const todayData = historyData[todayDateStr];
    
    if (activities.length === 0) {
        tasksGrid.innerHTML = `<p style="color:var(--text-muted)">No activities scheduled.</p>`;
    }
    
    activities.forEach((act, idx) => {
        const isCompleted = todayData.completions[act.id] || false;
        const theme = THEMES[idx % THEMES.length];
        
        const card = document.createElement('div');
        card.className = `task-panel ${theme} ${isCompleted ? 'is-completed' : ''}`;
        
        const optHtml = act.isOptional ? `<span class="opt-label">(Optional)</span>` : '';
        const descText = act.desc ? act.desc : 'Finish this task to stay consistent!';
        
        card.innerHTML = `
            <div class="time-label">⏳ ${act.timeRange.replace('⏳', '').trim()}</div>
            <div class="task-title">${act.emoji} ${act.name}</div>
            <div class="task-desc">
                ${optHtml} ${descText}
            </div>
            <div class="task-actions">
                <button class="status-btn done-btn" onclick="toggleTask('${act.id}', true)">
                    ${isCompleted ? '✓ Completed' : 'Mark Done'}
                </button>
                <button class="status-btn not-done-btn" onclick="toggleTask('${act.id}', false)">
                    ⏳ ${!isCompleted ? 'Not Completed' : 'Undo'}
                </button>
            </div>
        `;
        tasksGrid.appendChild(card);
    });

    calculateDailyStats(todayDateStr);
}

window.toggleTask = function(taskId, completeStatus) {
    const todayData = historyData[todayDateStr];
    if (completeStatus) todayData.completions[taskId] = true;
    else delete todayData.completions[taskId];
    
    calculateDailyStats(todayDateStr);
    saveHistory();
    renderToday();
};

function calculateDailyStats(dateStr) {
    const data = historyData[dateStr];
    if (!data) return;
    
    let done = 0; let total = 0;
    
    activities.forEach(act => {
        const isDone = data.completions[act.id];
        if (isDone) { done++; total++; }
        else if (!act.isOptional) { total++; }
    });
    if (total === 0) total = done > 0 ? done : 1; 

    const percent = Math.round((done / total) * 100);
    data.stats = { done, total, percent };
}

/* ---------------- SCHEDULE ---------------- */
function renderSchedule() {
    scheduleListEl.innerHTML = '';
    activities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.marginBottom = '1rem';
        item.innerHTML = `
            <div>
                <strong style="font-size:1.1rem; color:var(--text-main)">${act.emoji} ${act.name} ${act.isOptional ? '<i>(Opt)</i>' : ''}</strong>
                <div style="font-size: 0.85rem; color:var(--text-muted); margin-top:5px;">${act.timeRange}</div>
            </div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
                <button class="secondary-btn" onclick="editActivity('${act.id}')">Edit</button>
                <button class="secondary-btn" style="color:#ef4444" onclick="deleteActivity('${act.id}')">Delete</button>
            </div>
        `;
        scheduleListEl.appendChild(item);
    });
}

window.editActivity = function(id) {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    document.getElementById('modal-title').textContent = 'Edit Activity';
    document.getElementById('activity-id').value = act.id;
    document.getElementById('activity-name').value = act.name;
    document.getElementById('start-time').value = act.startTime || '06:00';
    document.getElementById('end-time').value = act.endTime || '07:00';
    document.getElementById('is-optional').checked = !!act.isOptional;
    activityModal.classList.add('open');
};

window.deleteActivity = function(id) {
    if (confirm('Delete this activity?')) {
        activities = activities.filter(a => a.id !== id);
        if(historyData[todayDateStr]) calculateDailyStats(todayDateStr);
        saveActivities(); saveHistory(); renderSchedule();
    }
};

/* ---------------- HISTORY ---------------- */
function calculateStreaks() {
    const dates = Object.keys(historyData).sort().reverse();
    let currentS = 0; let longestS = 0;
    let consecutiveCount = 0;
    let expectedDate = new Date(); 
    expectedDate.setHours(0,0,0,0);
    
    let isCurrentStreakAlive = true;

    for (let i = 0; i < dates.length; i++) {
        const parseDate = new Date(dates[i]);
        parseDate.setHours(0,0,0,0);
        
        const hasCompletedAnything = historyData[dates[i]].stats.percent > 0;
        const dayDiff = Math.round(Math.abs(expectedDate.getTime() - parseDate.getTime()) / (1000 * 3600 * 24));
        
        if (i === 0 && dayDiff > 1) isCurrentStreakAlive = false;
        if (dayDiff <= 1) {
            if (hasCompletedAnything) {
                consecutiveCount++;
                if (isCurrentStreakAlive) currentS = consecutiveCount;
                longestS = Math.max(longestS, consecutiveCount);
            } else {
                if (dayDiff > 0 || i > 0) { isCurrentStreakAlive = false; consecutiveCount = 0; }
            }
        } else {
            isCurrentStreakAlive = false;
            consecutiveCount = (hasCompletedAnything ? 1 : 0);
            longestS = Math.max(longestS, consecutiveCount);
        }
        expectedDate = new Date(parseDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
    }
    return { current: currentS, longest: longestS };
}

function calculateWeeklyAvg() {
    let totalPercent = 0; let daysCounted = 0;
    const today = new Date();
    let monToSunIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    let monday = new Date(today);
    monday.setDate(today.getDate() - monToSunIndex);
    
    for (let i = 0; i < 7; i++) {
        let loopDate = new Date(monday);
        loopDate.setDate(monday.getDate() + i);
        const key = `${loopDate.getFullYear()}-${String(loopDate.getMonth()+1).padStart(2,'0')}-${String(loopDate.getDate()).padStart(2,'0')}`;
        
        if (loopDate.getTime() <= today.getTime() || historyData[key]) {
            if (historyData[key]) totalPercent += historyData[key].stats.percent;
            daysCounted++;
        }
    }
    return daysCounted > 0 ? Math.round(totalPercent / daysCounted) : 0;
}

function renderHistoryTabUi() {
    const thead = document.getElementById('history-table-head');
    const tbody = document.getElementById('history-table-body');
    
    thead.innerHTML = `<tr><th>Date</th>`;
    activities.forEach(act => thead.innerHTML += `<th>${act.name}</th>`);
    thead.innerHTML += `<th>Progress</th></tr>`;

    tbody.innerHTML = '';
    Object.keys(historyData).sort().reverse().forEach(dateStr => {
        const data = historyData[dateStr];
        const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let rowHtml = `<td>${formattedDate}</td>`;
        activities.forEach(act => rowHtml += `<td>${data.completions[act.id] ? '✅' : '❌'}</td>`);
        rowHtml += `<td><strong>${data.stats.percent}%</strong></td>`;
        
        tbody.innerHTML += `<tr>${rowHtml}</tr>`;
    });

    const streaks = calculateStreaks();
    currentStreakEl.textContent = `${streaks.current} Days`;
    weeklyAvgEl.textContent = `${calculateWeeklyAvg()}%`;
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
