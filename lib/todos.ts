export type Todo = {
  id: string;
  title: string;
  done: boolean;
  /** 期限（YYYY-MM-DD）。未設定なら空文字 */
  due: string;
  /** 作成時刻（ミリ秒）。並び順に使う */
  created: number;
};

export type Filter = "all" | "active" | "done";

export const STORAGE_KEY = "todo-items-v1";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Date をローカル時刻の YYYY-MM-DD にする */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 例：2026年10月6日（火） */
export function formatToday(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

export function newId(): string {
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function createTodo(title: string, due: string, now: number = Date.now()): Todo {
  return { id: newId(), title: title.trim(), done: false, due, created: now };
}

export function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}

export type DueTone = "normal" | "today" | "late";
export type DueLabel = { text: string; tone: DueTone };

/** 期限の表示文字と色合いを決める。期限なしなら null */
export function dueLabel(due: string, done: boolean, today: Date): DueLabel | null {
  if (!due) return null;
  const todayYmd = toYmd(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due === todayYmd) return { text: "今日まで", tone: done ? "normal" : "today" };
  if (due === toYmd(tomorrow)) return { text: "明日まで", tone: "normal" };

  const [, m, d] = due.split("-").map(Number);
  if (due < todayYmd && !done) return { text: `${m}/${d} 期限切れ`, tone: "late" };
  return { text: `${m}/${d}まで`, tone: "normal" };
}

/** localStorage から読み込む。壊れたデータや使えない環境では空配列 */
export function loadTodos(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo).sort((a, b) => a.created - b.created);
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch {
    return false;
  }
}

function isTodo(x: unknown): x is Todo {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    typeof t.done === "boolean" &&
    typeof t.due === "string" &&
    typeof t.created === "number"
  );
}
