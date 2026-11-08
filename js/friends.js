/**
 * Social and Friends system for Combat Protocol.
 * Stores friends list, status (online/in-match/offline), and invites.
 */

export const FRIENDS_STORAGE_KEY = "combat-protocol-friends-v1";

export const DEFAULT_FRIENDS = [
  { id: "friend-ghost", name: "Ghost-01", level: 24, rank: "رقيب", status: "online", statusLabel: "متصل — جاهز للقتال", room: "arena" },
  { id: "friend-viper", name: "Viper-9", level: 38, rank: "ملازم", status: "in-match", statusLabel: "في مباراة — بلدة الميناء", room: "harbor" },
  { id: "friend-shadow", name: "Shadow-4", level: 12, rank: "عريف", status: "offline", statusLabel: "غير متصل — منذ ساعتين", room: null },
  { id: "friend-rookie", name: "Rookie-77", level: 5, rank: "جندي", status: "online", statusLabel: "متصل — في اللوبي", room: "arena" },
];

export function loadFriends(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(FRIENDS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_FRIENDS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_FRIENDS];
  } catch {
    return [...DEFAULT_FRIENDS];
  }
}

export function saveFriends(friends, storage = globalThis.localStorage) {
  try {
    storage?.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
  } catch {
    // Ignore storage errors
  }
  return friends;
}

export function addFriend(friends, name, storage = globalThis.localStorage) {
  const cleanName = String(name ?? "").trim().slice(0, 16);
  if (!cleanName) return { success: false, reason: "empty-name", friends };
  const exists = friends.some((f) => f.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) return { success: false, reason: "already-exists", friends };

  const newFriend = {
    id: `friend-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    level: Math.floor(Math.random() * 25) + 1,
    rank: "جندي",
    status: "online",
    statusLabel: "متصل — متاح للعب",
    room: "arena",
  };
  const updated = [newFriend, ...friends];
  saveFriends(updated, storage);
  return { success: true, reason: "added", friend: newFriend, friends: updated };
}

export function removeFriend(friends, id, storage = globalThis.localStorage) {
  const updated = friends.filter((f) => f.id !== id);
  saveFriends(updated, storage);
  return updated;
}
