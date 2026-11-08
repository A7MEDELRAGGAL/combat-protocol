/**
 * World Chat, Squad Chat & Recruitment System (PUBG Style).
 */

export const CHAT_STORAGE_KEY = "combat-protocol-chat-v1";

export const DEFAULT_WORLD_MESSAGES = [
  { id: "msg-1", sender: "General_Eagle", rank: "إيس", text: "من ينزل معي بلدة الميناء؟ مطلوب لاعبين تصنيف تاج وفوق!", channel: "world", time: "الآن" },
  { id: "msg-2", sender: "Shadow_Sniper", rank: "ماسي II", text: "تم فتح تمويه الجليدي للـ AR-4! تأثير القتل رائع جداً 🔥", channel: "world", time: "منذ 1 د" },
  { id: "msg-3", sender: "Desert_Fox", rank: "تاج IV", text: "سكواد مفتوح لطور الباتل رويال — كود الغرفة [harbor]", channel: "recruit", room: "harbor", time: "منذ 2 د" },
  { id: "msg-4", sender: "Vanguard_Leader", rank: "الغازي", text: "نصيحة: استخدموا الطابق الثاني للمباني في بلدة الميناء للقنص من الشرفات.", channel: "world", time: "منذ 3 د" },
  { id: "msg-5", sender: "Nova_Pro", rank: "بلاتينيوم I", text: "مطلوب رابع للفرقة الآن، انضمام فوري!", channel: "recruit", room: "arena", time: "منذ 5 د" },
];

export const QUICK_MESSAGES = [
  "هيا بنا إلى المعركة! 🚀",
  "مطلوب سكواد لرفع الرانك (Crown / Ace) 🏆",
  "جاهز للانطلاق والتحدي! ⚡",
  "أحتاج شريكاً تكتيكياً لخريطة بلدة الميناء 🗺️",
  "من يريد دخول غرفة مخصصة الآن؟ 🎯",
];

export function sanitizeChatMessage(text = "") {
  return String(text ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 120);
}

export function createChatState(initial = []) {
  return {
    channel: "world", // "world" | "squad" | "recruit"
    messages: initial.length > 0 ? initial : [...DEFAULT_WORLD_MESSAGES],
  };
}

export function addMessage(state, { sender = "أنت", rank = "برونزي V", text = "", channel = "world", room = null }) {
  const clean = sanitizeChatMessage(text);
  if (!clean) return state;

  const newMessage = {
    id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: sanitizeChatMessage(sender).slice(0, 18) || "لاعب",
    rank,
    text: clean,
    channel,
    room,
    time: "الآن",
  };

  const updatedMessages = [newMessage, ...state.messages.slice(0, 49)];
  return {
    ...state,
    messages: updatedMessages,
  };
}

export function filterMessagesByChannel(messages = [], channel = "world") {
  if (channel === "world") return messages;
  return messages.filter((m) => m.channel === channel);
}
