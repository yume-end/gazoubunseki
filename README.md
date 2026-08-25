# 画像フォレンジックAI

Gemini API の無料枠だけで動かす zero-cost prototype です。画像をアップロード、または画像URLを指定して、Gemini による視覚分析結果を日本語で表示します。

## 現在の機能

- 画像アップロード
- 画像URL入力
- Gemini による画像解析
- 重要要素の抽出
- 視覚的不自然さの分析
- AI生成 / AI編集 / 合成 / 手描き / 普通の写真 / 不確実性の推定
- 簡潔 / 標準 / 詳細の説明切り替え
- Demo Mode

## 現在の制限

- reverse image search は未実装です
- Internet/source verification はありません
- 学術的に検証されたフォレンジック判定器ではありません
- Gemini free-tier のレート制限があります
- ここでの数値は証拠ベースの推定であり、確定的な証明ではありません
- paid API は使いません
- OpenAI API は使いません
- SerpApi / Google Lens API は使いません

## 環境変数

`.env.local` に以下を設定します。

```bash
GEMINI_API_KEY=
GEMINI_MODEL=
DEMO_MODE=true
```

- `GEMINI_MODEL` を未設定にした場合は `gemini-3-flash` を既定値として使います
- `DEMO_MODE=true` にすると決定的なモック結果を返します

## セットアップ

```bash
npm install
npm run dev
```

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

## Vercel

- Framework は Next.js です
- API key は Vercel の Environment Variables に設定します
- `GEMINI_API_KEY` はクライアントに露出しません

## セキュリティ

- 画像URLはサーバー側で取得します
- ローカルネットワーク宛 URL は拒否します
- アップロード画像は 10MB 上限です
- 永続保存はしません
