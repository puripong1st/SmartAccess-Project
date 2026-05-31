'use client';

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFirebaseConfig, getVapidKey } from '@/lib/firebase';

interface PushNotificationManagerProps {
  studentDbId?: number; // Optional student database ID, if logged in as student
}

export default function PushNotificationManager({ studentDbId }: PushNotificationManagerProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenRegistered, setTokenRegistered] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [pushBlocked, setPushBlocked] = useState<boolean>(false);

  useEffect(() => {
    // Check support
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window;

    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
      
      // If permission is already granted, attempt automatic token registration
      if (Notification.permission === 'granted') {
        const hasRegistered = localStorage.getItem('smartaccess_fcm_registered') === 'true';
        if (!hasRegistered) {
          registerPushNotifications();
        } else {
          setTokenRegistered(true);
        }
      } else if (Notification.permission === 'default') {
        // Show banner to ask for permission after 3 seconds
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [studentDbId]);

  const registerPushNotifications = async () => {
    setLoading(true);
    try {
      const config = getFirebaseConfig();
      const vapidKey = getVapidKey();

      if (!config || !vapidKey) {
        console.warn('[FCM] Firebase config or VAPID key is missing in environment variables');
        setLoading(false);
        return;
      }

      // Initialize Firebase
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      const messaging = getMessaging(app);

      // Register or find service worker
      const reg = await navigator.serviceWorker.ready;
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: reg,
      });

      if (!token) {
        throw new Error('No FCM registration token received');
      }

      // Send to server
      const role = window.location.pathname.startsWith('/admin') ? 'admin' : 'student';
      
      // Resolve user DB ID
      let resolvedUserId = studentDbId;
      
      // If role is student and we don't have studentDbId, search user session in localStorage
      if (role === 'student' && !resolvedUserId) {
        try {
          const storedSuccess = localStorage.getItem('smartaccess_user_session');
          if (storedSuccess) {
            resolvedUserId = JSON.parse(storedSuccess).id;
          }
        } catch {}
      }

      // If we don't have user ID for student, we wait until they register successfully
      if (role === 'student' && !resolvedUserId) {
        console.log('[FCM] Postponing registration until student ID is available');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          role,
          userId: resolvedUserId,
          deviceInfo: navigator.userAgent.substring(0, 100),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      console.log('[FCM] Push Notification registered successfully!');
      localStorage.setItem('smartaccess_fcm_registered', 'true');
      localStorage.setItem('smartaccess_fcm_token', token);
      setTokenRegistered(true);
      setShowBanner(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      // กรณีพบบ่อย: เบราว์เซอร์บล็อกบริการพุชของ Google (พบใน Brave / Firefox ที่ปิด Google services,
      // หรือเปิดผ่าน http ที่ไม่ใช่ localhost). FCM จะโยน AbortError: "push service error"
      if (/push service error|AbortError/i.test(msg)) {
        console.warn(
          '[FCM] บริการพุชถูกบล็อกโดยเบราว์เซอร์ — ' +
          'หากใช้ Brave ให้เปิด brave://settings/privacy → "Use Google services for push messaging" แล้วรีโหลด. ' +
          'ต้องเปิดผ่าน HTTPS (หรือ localhost) เท่านั้น'
        );
        setPushBlocked(true);
      } else {
        console.error('[FCM] Token registration failed:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    if (!supported) return;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await registerPushNotifications();
      } else {
        console.log('[FCM] Permission was denied by the user');
        setShowBanner(false);
      }
    } catch (err) {
      console.error('[FCM] Permission request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smartaccess_fcm_token');
      if (token) {
        await fetch('/api/notifications/register', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      }
      localStorage.removeItem('smartaccess_fcm_registered');
      localStorage.removeItem('smartaccess_fcm_token');
      setTokenRegistered(false);
      setPermission('default');
    } catch (error) {
      console.error('[FCM] Failed to unregister notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // If not supported, do not show anything
  if (!supported) return null;

  return (
    <>
      {/* 1. Floating Banner Prompt (Displays if permission is 'default' and showBanner is true) */}
      {showBanner && permission === 'default' && (
        <div style={styles.bannerContainer}>
          <div style={styles.banner}>
            <div style={styles.bannerContent}>
              <span style={styles.bannerIcon}>🔔</span>
              <div>
                <strong style={styles.bannerTitle}>เปิดการแจ้งเตือนพุช (Push Notifications)</strong>
                <p style={styles.bannerDescription}>
                  รับการแจ้งเตือนสถานะการเปิดประตูและคำอนุมัติเข้าห้องเรียนแบบเรียลไทม์บนมือถือของคุณ
                </p>
              </div>
            </div>
            <div style={styles.bannerActions}>
              <button 
                onClick={() => setShowBanner(false)} 
                style={styles.btnDismiss}
                disabled={loading}
              >
                ไว้ทีหลัง
              </button>
              <button 
                onClick={handleRequestPermission} 
                style={styles.btnEnable}
                disabled={loading}
              >
                {loading ? 'กำลังเปิด...' : 'เปิดใช้งาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Dashboard Settings Trigger widget — Responsive positioning to avoid header overlapping on mobile */}
      <div className="fixed bottom-4 right-4 md:bottom-auto md:top-[18px] md:right-20 z-[999] transition-all">
        <button 
          onClick={tokenRegistered ? handleDisableNotifications : handleRequestPermission}
          style={{
            ...styles.widgetButton,
            background: tokenRegistered 
              ? 'rgba(16, 185, 129, 0.15)' 
              : 'rgba(124, 58, 237, 0.15)',
            borderColor: tokenRegistered 
              ? 'rgba(16, 185, 129, 0.3)' 
              : 'rgba(124, 58, 237, 0.3)',
            color: tokenRegistered ? '#10B981' : '#A78BFA',
          }}
          title={tokenRegistered ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือนพุช"}
          disabled={loading}
        >
          <span style={styles.widgetIcon}>{pushBlocked ? '🚫' : tokenRegistered ? '🔔' : '🔕'}</span>
          <span style={styles.widgetText}>
            {loading
              ? 'กำลังทำรายการ...'
              : pushBlocked
                ? 'เบราว์เซอร์บล็อกพุช'
                : tokenRegistered
                  ? 'เปิดแจ้งเตือนแล้ว'
                  : 'รับแจ้งเตือนพุช'}
          </span>
        </button>
      </div>
    </>
  );
}

const styles = {
  bannerContainer: {
    position: 'fixed' as const,
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)',
    maxWidth: '460px',
    zIndex: 9999,
  },
  banner: {
    background: 'rgba(15, 10, 30, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.25)',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '16px',
  },
  bannerContent: {
    display: 'flex' as const,
    gap: '14px',
    alignItems: 'flex-start' as const,
    textAlign: 'left' as const,
  },
  bannerIcon: {
    fontSize: '24px',
    marginTop: '2px',
  },
  bannerTitle: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  bannerDescription: {
    fontSize: '12.5px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 1.5,
    margin: 0,
  },
  bannerActions: {
    display: 'flex' as const,
    justifyContent: 'flex-end' as const,
    gap: '12px',
  },
  btnDismiss: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnEnable: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
    border: 'none',
    color: '#FFFFFF',
    padding: '8px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
    transition: 'all 0.2s',
  },
  widgetContainer: {
    position: 'fixed' as const,
    top: '16px',
    right: '80px',
    zIndex: 999,
  },
  widgetButton: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  widgetIcon: {
    fontSize: '14px',
  },
  widgetText: {
    display: 'inline-block',
  }
};
