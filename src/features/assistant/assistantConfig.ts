export const CHAT_MAX_LENGTH = 2000;

export type AssistantRole = "CHAPTER" | "OPERATION";

export const SAMPLE_QUESTIONS: Record<AssistantRole, readonly string[]> = {
  CHAPTER: [
    "Ringkas kondisi karyawan dan kontrak di cakupan chapter saya",
    "Siapa saja yang kontraknya berakhir dalam 90 hari?",
    "Karyawan mana yang perlu ditindaklanjuti kontraknya?",
    "Siapa saja yang data dirinya belum lengkap?",
  ],
  OPERATION: [
    "Ringkas kondisi seluruh karyawan dan kontrak",
    "Berapa jumlah karyawan aktif di seluruh unit?",
    "Siapa saja yang kontraknya berakhir dalam 90 hari?",
    "Siapa saja yang data dirinya belum lengkap?",
  ],
};

/**
 * Peran yang sel `assistant`-nya dibukakan konfigurasi di luar Chapter/Operation:
 * contoh pertanyaan tanpa klaim cakupan peran mana pun (T059).
 */
export const SAMPLE_QUESTIONS_OTHER: readonly string[] = [
  "Ringkas kondisi karyawan dan kontrak",
  "Siapa saja yang kontraknya berakhir dalam 90 hari?",
  "Karyawan mana yang perlu ditindaklanjuti kontraknya?",
  "Siapa saja yang data dirinya belum lengkap?",
];

export function sampleQuestionsFor(role: string | null): readonly string[] {
  if (role === "CHAPTER" || role === "OPERATION") return SAMPLE_QUESTIONS[role];
  return SAMPLE_QUESTIONS_OTHER;
}
