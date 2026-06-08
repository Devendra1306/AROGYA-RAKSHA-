// Browser Client-Side Notification Manager for PWA Reminders

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support local desktop notifications.');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendLocalNotification = (title, body, tag = 'general') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options = {
    body,
    icon: '/logo.jpg',
    badge: '/favicon.svg',
    tag,
    renotify: true
  };

  // If service worker is active, send via Service Worker registration (better PWA integration)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, options);
    });
  } else {
    new Notification(title, options);
  }
};

// Start background timers for reminders if toggled on in settings
export const startNotificationScheduler = () => {
  if (typeof window === 'undefined') return;

  console.log('[Notification] Health Alerts Reminder Scheduler initialized.');

  // Interval check (every 1 minute for testing, simulating alerts)
  setInterval(() => {
    // 1. Water Reminder (every 2 hours simulated in background)
    const remindWater = localStorage.getItem('remind_water') === 'true';
    if (remindWater) {
      const lastWater = Number(localStorage.getItem('last_remind_water') || 0);
      const now = Date.now();
      // Simulate water reminder every 10 minutes for test mode (600,000ms), normally 2 hours
      if (now - lastWater > 600000) {
        sendLocalNotification('Hydration Check-in', 'Time to drink a glass of water and log it on your Arogya Dashboard!', 'water');
        localStorage.setItem('last_remind_water', now.toString());
      }
    }

    // 2. Diet Check (simulated alert checking)
    const remindDiet = localStorage.getItem('remind_diet') === 'true';
    if (remindDiet) {
      const lastDiet = Number(localStorage.getItem('last_remind_diet') || 0);
      const now = Date.now();
      // Simulate diet reminders every 15 minutes
      if (now - lastDiet > 900000) {
        sendLocalNotification('Meal Log Check-in', 'Log your recent meal on your daily macro planner to keep your health score updated.', 'diet');
        localStorage.setItem('last_remind_diet', now.toString());
      }
    }

    // 3. Health Assessment (simulated weekly alert check)
    const remindHealth = localStorage.getItem('remind_health') === 'true';
    if (remindHealth) {
      const lastHealth = Number(localStorage.getItem('last_remind_health') || 0);
      const now = Date.now();
      // Simulate health checklist reminders every 30 minutes
      if (now - lastHealth > 1800000) {
        sendLocalNotification('Wellness Tracker Check', 'Time to update your vitals data on Health Assessment to recalculate your wellness score.', 'health');
        localStorage.setItem('last_remind_health', now.toString());
      }
    }
  }, 60000); // Check every minute
};
