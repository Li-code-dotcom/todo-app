# きょうのTo-do（Next.js版）

Next.js（App Router）と TypeScript で作ったシンプルなTo-doアプリです。

- やることの追加・完了チェック・編集（文字をクリック）・削除
- 期限の設定（「今日まで」「期限切れ」を色で表示）
- すべて／未完了／完了の切り替え、完了済みのまとめて削除
- データはブラウザの localStorage に保存
- ライト／ダークテーマ対応

## 動かし方

Node.js 20.9 以上が必要です。

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## ビルド

```bash
npm run build      # out/ に静的ファイルを書き出し
npm start          # out/ をローカルで配信して確認
```

GitHub Pages のようにサブパス（`/todo-app/`）で配信する場合は、ビルド時にパスを渡します。

```bash
PAGES_BASE_PATH=/todo-app npm run build
```

## デプロイ

`main` ブランチにプッシュすると、GitHub Actions（`.github/workflows/deploy.yml`）がビルドして
`gh-pages` ブランチに公開します。初回は `npm install` で作られる `package-lock.json` も一緒にコミットしてください
（ワークフローの `npm ci` が使います）。

## 構成

```
app/
  layout.tsx       ページ全体の枠・フォント・メタ情報
  page.tsx         トップページ
  globals.css      スタイル（色はCSS変数で管理）
components/
  TodoApp.tsx      To-doアプリ本体（クライアントコンポーネント）
lib/
  todos.ts         型定義・期限表示・保存などのロジック
```
