let notificationAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

// Initialize audio on first user interaction
function initAudio() {
  if (notificationAudio) return;

  notificationAudio = new Audio('/sounds/notification.mp3');
  notificationAudio.volume = 0.5;
}

// Unlock audio context on user interaction (required by browsers)
export function unlockAudio() {
  if (audioUnlocked) return;

  initAudio();
  if (notificationAudio) {
    // Play and immediately pause to unlock
    const playPromise = notificationAudio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          notificationAudio?.pause();
          notificationAudio!.currentTime = 0;
          audioUnlocked = true;
        })
        .catch(() => {
          // Autoplay blocked, will retry on next interaction
        });
    }
  }
}

// Play notification sound
export function playNotificationSound() {
  if (!notificationAudio) {
    initAudio();
  }

  if (notificationAudio && audioUnlocked) {
    // Reset and play
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {
      // Silently fail if playback fails
    });
  }
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show browser notification
export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: 'feather-notification',
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
}
