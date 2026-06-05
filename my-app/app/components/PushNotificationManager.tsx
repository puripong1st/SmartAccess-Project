'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFirebaseConfig, getVapidKey } from '@/lib/firebase';

interface PushNotificationManagerProps {
  studentDbId?: number; // Optional student database ID, if logged in as student
  inline?: boolean;     // If true, render inline styling suited for sidebar/menus instead of floating widget
}

export default function PushNotificationManager({ studentDbId, inline = false }: PushNotificationManagerProps) {
  const pathname = usePathname();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenRegistered, setTokenRegistered] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [pushBlocked, setPushBlocked] = useState<boolean>(false);
  // iOS ต้องเพิ่มลงหน้าโฮม (standalone) ก่อนถึงจะรับ Web Push ได้ (ข้อกำหนดของ Apple ตั้งแต่ iOS 16.4)
  const [iosNeedsInstall, setIosNeedsInstall] = useState<boolean>(false);

  useEffect(() => {
    if (!pathname || !pathname.startsWith('/admin')) return;
    if (typeof window === 'undefined') return;

    // ตรวจ iOS/iPadOS (iPadOS รายงานตัวเป็น Mac จึงเช็ค touch ร่วมและป้องกันการสับสนบน macOS เดสก์ท็อป)
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && 'ontouchend' in document);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check support
    const isSupported =
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window;

    let bannerTimer: NodeJS.Timeout;

    // Defer state updates to satisfy react-hooks/set-state-in-effect
    const animFrameId = requestAnimationFrame(() => {
      // บน iPhone/iPad ที่ยังเปิดผ่าน Safari (ยังไม่เพิ่มลงหน้าโฮม) → Web Push ใช้ไม่ได้
      // แสดงคำแนะนำให้ผู้ใช้ติดตั้งเป็นแอปก่อน แทนที่จะไม่แสดงอะไรเลย
      if (isIOS && !isStandalone) {
        setIosNeedsInstall(true);
        setSupported(isSupported);
        return;
      }

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
          bannerTimer = setTimeout(() => {
            setShowBanner(true);
          }, 3000);
        }
      }
    });

    return () => {
      cancelAnimationFrame(animFrameId);
      if (bannerTimer) clearTimeout(bannerTimer);
    };
  }, [studentDbId]);
  async function registerPushNotifications() {
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

      // ดึงการตั้งค่าแจ้งเตือนจาก localStorage เพื่อส่งไปบันทึกบนเซิร์ฟเวอร์
      const preferences = {
        fcm_notify_register: localStorage.getItem('smartaccess_local_fcm_notify_register') || '1',
        fcm_notify_door_open: localStorage.getItem('smartaccess_local_fcm_notify_door_open') || '1',
        fcm_notify_status_change: localStorage.getItem('smartaccess_local_fcm_notify_status_change') || '1',
        fcm_notify_security_alert: localStorage.getItem('smartaccess_local_fcm_notify_security_alert') || '1',
      };

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
          preferences,
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
  }

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

  // ปิดการทำงานระบบแจ้งเตือนพุชทั้งหมดในฝั่งผู้ใช้ทั่วไป (ทำงานเฉพาะฝั่ง /admin แอดมินเท่านั้น)
  if (!pathname || !pathname.startsWith('/admin')) {
    return null;
  }

  // iPhone/iPad บน Safari (ยังไม่เพิ่มลงหน้าโฮม) — แนะนำให้ติดตั้งเป็นแอปก่อน
  if (iosNeedsInstall) {
    if (inline) {
      return (
        <div style={{
          background: 'rgba(124, 58, 237, 0.06)',
          border: '1px solid rgba(124, 58, 237, 0.15)',
          borderRadius: 12,
          padding: '10px 14px',
          color: 'var(--text-secondary)',
          fontSize: 11.5,
          lineHeight: 1.5,
        }}>
          <strong style={{ display: 'block', fontSize: 12, marginBottom: 2, color: 'var(--text-primary)' }}>📱 เปิดแจ้งเตือน</strong>
          เพิ่มเว็บลงหน้าจอโฮมก่อน → เปิดแอปจากไอคอน
        </div>
      );
    }
    // Non-inline: don't render the fixed banner at all — the inline sidebar version handles it
    return null;
  }


  // If not supported, do not show anything
  if (!supported) return null;

  if (inline) {
    return (
      <button 
        onClick={tokenRegistered ? handleDisableNotifications : handleRequestPermission}
        className="btn-secondary"
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '12px',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          background: tokenRegistered 
            ? 'rgba(16, 185, 129, 0.12)' 
            : 'rgba(255, 255, 255, 0.04)',
          borderColor: tokenRegistered 
            ? 'rgba(16, 185, 129, 0.25)' 
            : 'var(--border)',
          color: tokenRegistered ? '#10B981' : 'var(--text-secondary)',
          fontWeight: 700,
          transition: 'all 0.2s',
        }}
        title={tokenRegistered ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือนพุช"}
        disabled={loading}
      >
        <span style={{ fontSize: '14px' }}>{pushBlocked ? '🚫' : tokenRegistered ? '🔔' : '🔕'}</span>
        <span>
          {loading
            ? 'กำลังทำรายการ...'
            : pushBlocked
              ? 'เบราว์เซอร์บล็อกพุช'
              : tokenRegistered
                ? 'เปิดแจ้งเตือนแล้ว'
                : 'รับแจ้งเตือนพุช'}
        </span>
      </button>
    );
  }

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
