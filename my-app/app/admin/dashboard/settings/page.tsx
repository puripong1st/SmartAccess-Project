"use client";
import React, { useState, ReactNode } from "react";
import {
  FileText,
  DoorOpen,
  BarChart3,
  Wrench,
  MessageCircle,
  Send,
  MessageSquare,
  Bell,
  CheckCircle2,
  Circle,
  Key,
  FlaskConical,
  Loader2,
  Save,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";

type ChannelType = "register" | "approve" | "logs" | "admin_audit";
type Provider = "discord" | "telegram" | "line" | "pwa";

const CHANNEL_ROWS: { label: string; type: ChannelType; icon: ReactNode }[] = [
  { label: "คำขอลงทะเบียนเข้าห้องใหม่", type: "register", icon: <FileText size={14} /> },
  { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", type: "approve", icon: <DoorOpen size={14} /> },
  { label: "Log จราจร / ความปลอดภัย", type: "logs", icon: <BarChart3 size={14} /> },
  { label: "Log การบำรุงรักษา / แอดมิน", type: "admin_audit", icon: <Wrench size={14} /> },
];

const PROVIDERS: Record<Provider, { name: string; icon: ReactNode; color: string; tint: string }> = {
  discord: { name: "Discord", icon: <MessageCircle size={16} />, color: "#7C3AED", tint: "rgba(124,58,237,0.07)" },
  telegram: { name: "Telegram", icon: <Send size={16} />, color: "#229ED9", tint: "rgba(34,158,217,0.07)" },
  line: { name: "LINE", icon: <MessageSquare size={16} />, color: "#06C755", tint: "rgba(6,199,85,0.07)" },
  pwa: { name: "PWA Push", icon: <Bell size={16} />, color: "#DB2777", tint: "rgba(219,39,119,0.07)" },
};

export default function SettingsPage() {
  const {
    isOwner,
    user,
    settings,
    setSettings,
    rawSettings,
    setRawSettings,
    handleSaveSettings,
    handleTestWebhook,
    settingsLoading,
    showToast,
  } = useDashboard();

  const [provider, setProvider] = useState<Provider>("discord");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);
  
  // ── PWA Local device state ──
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [pwaActive, setPwaActive] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceToken(localStorage.getItem("smartaccess_fcm_token"));
      setPwaActive(localStorage.getItem("smartaccess_fcm_registered") === "true");
    }
  }, [provider]);

  if (!user || !isOwner) return null;

  const raw = (k: string) => rawSettings[k] || "";
  const setRaw = (k: string, v: string) => setRawSettings((s: Record<string, string>) => ({ ...s, [k]: v }));

  // ── สถานะการตั้งค่าแต่ละช่อง ──
  const isConfigured = (p: Provider): boolean => {
    if (p === "discord") return ["register", "approve", "logs", "admin_audit"].some(t => (settings[`discord_webhook_${t}` as keyof typeof settings] as string)?.trim());
    if (p === "telegram") return !!raw("telegram_bot_token").trim();
    if (p === "line") return !!raw("line_channel_token").trim();
    return pwaActive; // PWA is active if the current device has push registered
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 };
  const active = PROVIDERS[provider];

  const tokenField =
    provider === "discord" || provider === "pwa" ? null
    : provider === "telegram" ? { key: "telegram_bot_token", label: "Telegram Bot Token", ph: "123456789:ABCdef..." }
    : { key: "line_channel_token", label: "LINE Channel Access Token", ph: "long-lived channel access token..." };

  const rowFor = (t: ChannelType) => {
    if (provider === "discord") {
      const key = `discord_webhook_${t}` as "discord_webhook_register" | "discord_webhook_approve" | "discord_webhook_logs" | "discord_webhook_admin_audit";
      return {
        value: settings[key] || "",
        onChange: (v: string) => setSettings((s: typeof settings) => ({ ...s, [key]: v })),
        ph: "https://discord.com/api/webhooks/...",
        test: () => handleTestWebhook(settings[key], t),
      };
    }
    const key = provider === "telegram" ? `telegram_chat_${t}` : `line_target_${t}`;
    return {
      value: raw(key),
      onChange: (v: string) => setRaw(key, v),
      ph: provider === "telegram" ? "Chat ID เช่น -1001234567890" : "User/Group ID เช่น Uxxxx หรือ Cxxxx",
      test: () => provider === "telegram"
        ? handleTestWebhook("", t, "default", { channel: "telegram", botToken: raw("telegram_bot_token"), chatId: raw(`telegram_chat_${t}`) })
        : handleTestWebhook("", t, "default", { channel: "line", channelToken: raw("line_channel_token"), targetId: raw(`line_target_${t}`) }),
    };
  };

  const handleSendTestPush = async () => {
    if (!deviceToken) {
      showToast("ไม่พบ FCM Token สำหรับทดสอบบนหน้าต่างนี้ กรุณากดเปิดสิทธิ์รับการแจ้งเตือนพุชก่อน", "error");
      return;
    }
    setTestPushLoading(true);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: deviceToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("ส่งการแจ้งเตือนพุชทดสอบสำเร็จแล้ว! กรุณาเช็คหน้าจออุปกรณ์ของคุณ 🚀", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการยิงแจ้งเตือนทดสอบ", "error");
      }
    } catch {
      showToast("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อยิงทดสอบได้", "error");
    } finally {
      setTestPushLoading(false);
    }
  };

  const configuredCount = (["discord", "telegram", "line", "pwa"] as Provider[]).filter(isConfigured).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSaveSettings(e);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // handled globally
    }
  };

  return (
    <div className="animate-fade-in w-full" style={{ display: "block", maxWidth: 780, width: "100%", overflowX: "hidden" }}>
      <div className="premium-card w-full" style={{ padding: 0, overflow: "hidden", maxWidth: "100%" }}>
        {/* Header แถบสีแบรนด์ */}
        <div className="p-4 sm:p-5 md:p-[22px_28px]" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(219,39,119,0.05))", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={18} /> ศูนย์ตั้งค่าการแจ้งเตือน
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.5, maxWidth: 540 }}>
                ส่งข้อความเดียวกันไปยังทุกช่องที่เปิดไว้พร้อมกัน — ตั้ง override รายห้องได้ที่แท็บ &quot;ห้องเรียน &amp; ESP32&quot;
              </p>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: configuredCount > 0 ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.15)", border: `1px solid ${configuredCount > 0 ? "rgba(16,185,129,0.35)" : "var(--border)"}`, color: configuredCount > 0 ? "#059669" : "var(--text-secondary)", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              {configuredCount > 0 ? <CheckCircle2 size={13} /> : <Circle size={13} />} เปิดใช้ {configuredCount}/4 ช่องทาง
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5 md:p-[22px_28px_28px]">
          {/* Provider segmented selector + สถานะ (รองรับการหดขยายตัวแบบสมมาตร ไม่เบียดตกขอบ ไม่ต้องการการเลื่อนบนหน้าจอมือถือมาตรฐาน) */}
          <div 
            className="flex gap-1 sm:gap-2 p-1.5 rounded-xl border border-[var(--border)] overflow-x-auto md:overflow-x-visible w-full"
            style={{ 
              background: "var(--bg-primary)", 
              marginBottom: 22,
              scrollbarWidth: "none"
            }}
          >
            {(Object.keys(PROVIDERS) as Provider[]).map(p => {
              const on = isConfigured(p);
              const sel = provider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className="flex-1 shrink-0 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs md:text-[13px] font-extrabold transition-all cursor-pointer select-none"
                  style={{
                    background: sel ? PROVIDERS[p].color : "transparent",
                    color: sel ? "#fff" : "var(--text-secondary)",
                    border: sel ? `1.5px solid ${PROVIDERS[p].color}` : "1.5px solid transparent",
                    boxShadow: sel ? `0 6px 16px ${PROVIDERS[p].tint}` : "none",
                  }}
                >
                  {PROVIDERS[p].icon}
                  <span>{PROVIDERS[p].name}</span>
                  <span title={on ? "ตั้งค่าแล้ว" : "ยังไม่ตั้งค่า"} style={{ width: 6, height: 6, borderRadius: 999, background: on ? "#22C55E" : (sel ? "rgba(255,255,255,0.5)" : "var(--border-medium)"), flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          {/* การ์ดของช่องที่เลือก */}
          <div style={{ borderRadius: 14, border: `1px solid ${active.color}33`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: active.tint, borderBottom: `1px solid ${active.color}22` }}>
              <span style={{ fontSize: 18 }}>{active.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: active.color }}>{active.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: isConfigured(provider) ? "#059669" : "var(--text-muted)" }}>
                {isConfigured(provider) ? "● พร้อมใช้งาน" : "○ ยังไม่เปิดใช้งาน"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4.5 md:p-[18px]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* PWA Settings view */}
              {provider === "pwa" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0, lineHeight: 1.55, background: active.tint, padding: "12px 14px", borderRadius: 10 }}>
                    ระบบแจ้งเตือน <b>PWA Push Notification</b> ทำงานผ่าน Firebase Cloud Messaging (FCM) ไปยังโทรศัพท์ iOS/Android แบบเนทีฟ
                    แม้ระบบจะเด้งแอดมินออกชั่วคราว การแจ้งเตือนจะยังทำงานตามปกติในเบื้องหลังของสมาร์ทโฟน
                  </p>

                  <div style={{ background: "rgba(124, 58, 237, 0.04)", border: "1px dashed var(--smartaccess-purple-light)", borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <strong style={{ fontSize: 13.5, color: "var(--text-primary)", display: "block" }}>เครื่องปลายทาง (Current Device)</strong>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", wordBreak: "break-all" }}>
                          {deviceToken ? `Token: ${deviceToken.substring(0, 20)}...` : "คลิกปุ่มกระดิ่งบริเวณมุมขวาของหน้าต่างเพื่อเปิดสิทธิ์รับแจ้งเตือนพุช"}
                        </span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: pwaActive ? "rgba(16, 185, 129, 0.1)" : "rgba(220, 38, 38, 0.1)", border: `1px solid ${pwaActive ? "#10B981" : "#EF4444"}`, color: pwaActive ? "#059669" : "#DC2626", fontSize: 11.5, fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: pwaActive ? "#10B981" : "#EF4444" }} />
                        {pwaActive ? "เปิดใช้งานพุชแล้ว" : "ยังไม่ได้เปิดสิทธิ์เครื่องนี้"}
                      </div>
                    </div>

                    {deviceToken && (
                      <div style={{ marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={handleSendTestPush}
                          disabled={testPushLoading}
                          className="btn-primary"
                          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", border: "none", color: "#FFFFFF", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" }}
                        >
                          {testPushLoading ? "กำลังส่งข้อความพุช..." : <><Bell size={13} /> ทดสอบส่งการแจ้งเตือนพุชเข้าอุปกรณ์นี้</>}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px 0" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "var(--smartaccess-purple)", letterSpacing: "1px", textTransform: "uppercase" }}>🔔 PWA Detailed Notification Routing</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>

                  {/* 1. Register alert setting */}
                  <div>
                    <label style={labelStyle}>1. แจ้งเตือนแอดมินเมื่อมีนักศึกษาลงทะเบียนใหม่</label>
                    <select
                      className="smartaccess-input"
                      value={raw("fcm_notify_register") === "0" ? "0" : "1"}
                      onChange={e => setRaw("fcm_notify_register", e.target.value)}
                      style={{ padding: "10px 14px", fontSize: 12.5 }}
                    >
                      <option value="1">🔔 เปิดใช้งานแจ้งเตือนพุช (Enabled)</option>
                      <option value="0">🔕 ปิดใช้งานแจ้งเตือนพุช (Disabled)</option>
                    </select>
                  </div>

                  {/* 2. Door Open setting */}
                  <div>
                    <label style={labelStyle}>2. แจ้งเตือนเมื่อมีการปลดล็อกประตูสำเร็จ (Door Open)</label>
                    <select
                      className="smartaccess-input"
                      value={raw("fcm_notify_door_open") === "0" ? "0" : "1"}
                      onChange={e => setRaw("fcm_notify_door_open", e.target.value)}
                      style={{ padding: "10px 14px", fontSize: 12.5 }}
                    >
                      <option value="1">🔔 เปิดใช้งานแจ้งเตือนพุช (Enabled)</option>
                      <option value="0">🔕 ปิดใช้งานแจ้งเตือนพุช (Disabled)</option>
                    </select>
                  </div>

                  {/* 3. Status Change setting */}
                  <div>
                    <label style={labelStyle}>3. แจ้งเตือนเมื่อสถานะคำขอลงทะเบียนของนักศึกษาถูกอนุมัติหรือปฏิเสธ</label>
                    <select
                      className="smartaccess-input"
                      value={raw("fcm_notify_status_change") === "0" ? "0" : "1"}
                      onChange={e => setRaw("fcm_notify_status_change", e.target.value)}
                      style={{ padding: "10px 14px", fontSize: 12.5 }}
                    >
                      <option value="1">🔔 เปิดใช้งานแจ้งเตือนพุช (Enabled)</option>
                      <option value="0">🔕 ปิดใช้งานแจ้งเตือนพุช (Disabled)</option>
                    </select>
                  </div>

                  {/* 4. Security Alert setting */}
                  <div>
                    <label style={labelStyle}>4. แจ้งเตือนภัยคุกคามและความปลอดภัยระดับวิกฤต (Security Alerts)</label>
                    <select
                      className="smartaccess-input"
                      value={raw("fcm_notify_security_alert") === "0" ? "0" : "1"}
                      onChange={e => setRaw("fcm_notify_security_alert", e.target.value)}
                      style={{ padding: "10px 14px", fontSize: 12.5 }}
                    >
                      <option value="1">🔔 เปิดใช้งานแจ้งเตือนพุช (Enabled)</option>
                      <option value="0">🔕 ปิดใช้งานแจ้งเตือนพุช (Disabled)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {/* คำอธิบายเฉพาะช่อง */}
                  {provider === "telegram" && (
                    <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0, lineHeight: 1.55, background: active.tint, padding: "10px 14px", borderRadius: 10 }}>
                      สร้างบอทกับ <b>@BotFather</b> รับ <b>Bot Token</b> แล้วหา <b>Chat ID</b> ของกลุ่ม (เช่นผ่าน @userinfobot) จากนั้นเชิญบอทเข้ากลุ่ม — ฟรี ไม่จำกัดจำนวนข้อความ
                    </p>
                  )}
                  {provider === "line" && (
                    <p style={{ color: "#B45309", fontSize: 11.5, margin: 0, lineHeight: 1.55, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "10px 14px", borderRadius: 10 }}>
                      LINE Notify ปิดบริการแล้ว (มี.ค. 2025) ระบบใช้ <b>LINE Messaging API</b> (push) ฟรี <b>~500 ข้อความ/เดือน</b> — สร้าง Channel ใน LINE Developers Console รับ Channel Access Token และใช้ User/Group ID เป็น Target
                    </p>
                  )}

                  {/* Token (Telegram/LINE) */}
                  {tokenField && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px 0" }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--smartaccess-purple)", letterSpacing: "1px", textTransform: "uppercase" }}>🔑 Credentials & Access Keys</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      </div>
                      <div style={{ background: active.tint, padding: "12px 14px", borderRadius: 10, border: `1px solid ${active.color}22` }}>
                        <label style={labelStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Key size={13} /> {tokenField.label} *</span></label>
                        <input className="smartaccess-input" type="text" placeholder={tokenField.ph} value={raw(tokenField.key)} onChange={e => setRaw(tokenField.key, e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: 12.5 }} />
                      </div>
                    </>
                  )}

                  {/* Event destinations header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px 0" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "var(--smartaccess-purple)", letterSpacing: "1px", textTransform: "uppercase" }}>🔔 Webhook & Message Routing</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>

                  {/* 4 ช่องแจ้งเตือน */}
                  {CHANNEL_ROWS.map((row) => {
                    const f = rowFor(row.type);
                    const filled = !!f.value?.trim();
                    return (
                      <div key={row.type}>
                        <label style={labelStyle}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 999, background: filled ? "#22C55E" : "var(--border-medium)" }} />
                            {row.icon} {row.label}
                          </span>
                        </label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input className="smartaccess-input" type="text" placeholder={f.ph} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }} />
                          <button type="button" onClick={f.test} className="btn-ghost" style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700, borderColor: `${active.color}66`, color: active.color, display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <FlaskConical size={13} /> ทดสอบ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <button
                type="submit"
                disabled={settingsLoading}
                className="btn-success"
                style={{
                  padding: "12px 22px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  alignSelf: "flex-start",
                  background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(124,58,237,0.25)",
                  marginTop: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {settingsLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</>
                ) : saveSuccess ? (
                  <span className="animate-scale-in" style={{ color: "#FFF", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} /> บันทึกการตั้งค่าสำเร็จ!
                  </span>
                ) : (
                  <><Save size={14} /> บันทึกการตั้งค่า {active.name}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
