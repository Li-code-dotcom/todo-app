"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  createTodo,
  dueLabel,
  filterTodos,
  formatToday,
  loadTodos,
  saveTodos,
  type Filter,
  type Todo,
} from "@/lib/todos";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "done", label: "完了" },
];

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  // 静的書き出しではビルド時に HTML が作られるため、日付と保存データは
  // ブラウザで読み込んでから表示する（ビルド日が表示されるのを防ぐ）
  const [today, setToday] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    setTodos(loadTodos());
    setToday(new Date());
  }, []);

  // 読み込み後の変更だけを保存する
  const loaded = today !== null;
  useEffect(() => {
    if (loaded) setStorageOk(saveTodos(todos));
  }, [todos, loaded]);

  function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setTodos((prev) => [...prev, createTodo(title, due)]);
    setTitle("");
    setDue("");
  }

  const update = (id: string, patch: Partial<Todo>) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id));
  const clearDone = () => setTodos((prev) => prev.filter((t) => !t.done));

  const remaining = todos.filter((t) => !t.done).length;
  const shown = filterTodos(todos, filter);

  return (
    <main className="wrap">
      <header className="header">
        <div className="date">{today ? formatToday(today) : " "}</div>
        <h1>きょうのTo-do</h1>
        <p className="summary">
          {!loaded ? (
            "読み込み中…"
          ) : todos.length ? (
            <>
              残り <b>{remaining}</b> 件 ／ 全 <b>{todos.length}</b> 件
            </>
          ) : (
            "まだ何もありません"
          )}
        </p>
      </header>

      <form className="add" onSubmit={handleAdd} autoComplete="off">
        <input
          id="new-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="やることを入力（例：請求書を送る）"
          aria-label="やること"
          maxLength={200}
        />
        <input
          id="new-due"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="期限（任意）"
        />
        <button type="submit">追加</button>
      </form>

      <div className="filters" role="group" aria-label="表示の切り替え">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <span className="spacer" />
        {todos.some((t) => t.done) && (
          <button type="button" className="clear" onClick={clearDone}>
            完了済みを削除
          </button>
        )}
      </div>

      <ul className="list">
        {loaded && shown.length === 0 && (
          <li className="empty">
            <EmptyMessage total={todos.length} filter={filter} />
          </li>
        )}
        {today &&
          shown.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              today={today}
              editing={editingId === t.id}
              onToggle={() => update(t.id, { done: !t.done })}
              onStartEdit={() => setEditingId(t.id)}
              onFinishEdit={(value) => {
                setEditingId(null);
                const v = value?.trim();
                if (v && v !== t.title) update(t.id, { title: v });
              }}
              onDelete={() => remove(t.id)}
            />
          ))}
      </ul>

      <footer className="footer">
        <p>
          項目の文字をクリックすると編集できます。<kbd>Enter</kbd> で確定、<kbd>Esc</kbd> で取り消し。
        </p>
        <p className={storageOk ? "" : "err"}>
          {storageOk
            ? "このブラウザに保存されています。"
            : "このブラウザでは保存できません。ページを閉じると内容が消えます。"}
        </p>
      </footer>
    </main>
  );
}

function EmptyMessage({ total, filter }: { total: number; filter: Filter }) {
  if (total === 0)
    return (
      <>
        <strong>最初のやることを追加しましょう</strong>
        上の入力欄に書いて「追加」を押すと、ここに並びます。期限は空欄のままでもかまいません。
      </>
    );
  if (filter === "active")
    return (
      <>
        <strong>未完了はありません</strong>
        すべて片づきました。
      </>
    );
  return (
    <>
      <strong>完了した項目はまだありません</strong>
      チェックを入れるとここに表示されます。
    </>
  );
}

type ItemProps = {
  todo: Todo;
  today: Date;
  editing: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  /** null は取り消し */
  onFinishEdit: (value: string | null) => void;
  onDelete: () => void;
};

function TodoItem({ todo, today, editing, onToggle, onStartEdit, onFinishEdit, onDelete }: ItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  const label = dueLabel(todo.due, todo.done, today);

  useEffect(() => {
    if (editing) {
      finished.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const finish = (value: string | null) => {
    if (finished.current) return; // Enter の直後の blur で二重に呼ばれないように
    finished.current = true;
    onFinishEdit(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") finish(e.currentTarget.value);
    if (e.key === "Escape") finish(null);
  };

  return (
    <li className={"item" + (todo.done ? " done" : "")}>
      <button
        type="button"
        className="check"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={(todo.done ? "未完了に戻す：" : "完了にする：") + todo.title}
        onClick={onToggle}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </button>

      {editing ? (
        <input
          ref={inputRef}
          id={`edit-${todo.id}`}
          className="edit"
          defaultValue={todo.title}
          maxLength={200}
          aria-label="やることを編集"
          onKeyDown={onKeyDown}
          onBlur={(e) => finish(e.currentTarget.value)}
        />
      ) : (
        <span className="text" title="クリックで編集" onClick={onStartEdit}>
          {todo.title}
        </span>
      )}

      {label ? <span className={`chip ${label.tone}`}>{label.text}</span> : <span />}

      <button type="button" className="del" aria-label={"削除：" + todo.title} onClick={onDelete}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
        </svg>
      </button>
    </li>
  );
}
