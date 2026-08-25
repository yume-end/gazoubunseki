# 画像フォレンジックAI

画像を入力すると、主要要素の抽出、Web照合、比較、総合評価を行うMVPです。

## 技術スタック

- Next.js
- TypeScript
- React
- Tailwind CSS

## セットアップ

1. 依存関係をインストールします。
2. `.env.example` を `.env.local` にコピーして必要な値を設定します。
3. `npm run dev` で起動します。

## 必要なAPIキー

- AI API
- Web検索API
- 必要に応じて画像検索API

このMVPはモックモードでUI確認できます。API未設定時は開発用の簡易結果を返します。

## 環境変数

`.env.local` の例:

```bash
OPENAI_API_KEY=
BRAVE_SEARCH_API_KEY=
NEXT_PUBLIC_USE_MOCK=true
```

## ローカル起動

```bash
npm install
npm run dev
```

## Vercel デプロイ

1. GitHub リポジトリを Vercel に接続します。
2. 環境変数を Vercel の Project Settings で設定します。
3. ビルドコマンドは `npm run build`、出力先は Next.js の標準設定です。

## 現在のMVPの制限事項

- ライブのAI解析は未接続です
- Web検索の本実装は今後拡張します
- 完全なフォレンジック判定は対象外です

## 今後実装可能な機能

- EXIF解析
- Copy-Move検出
- ELA
- 画像逆検索
- 画像比較の強化
- 分析履歴
- PDFレポート
