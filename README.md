# AI画像フォレンジック

ブラウザだけで動く、ローカル画像分析のMVPです。画像をアップロードすると、Canvas ベースの前処理に加え、ブラウザ内の実AI物体検出モデルで重要要素を検出し、AI生成・編集・合成などの可能性を推定します。

## 概要

- 外部AI APIは使用しません
- 画像はブラウザ内で解析します
- WebGPU を優先し、WASM にフォールバックします
- URL入力にも対応しますが、CORS の影響を受けます
- 解析結果は確定的な証拠ではなく、視覚的特徴の推定です

## アーキテクチャ

- Next.js / React / TypeScript
- `@huggingface/transformers` によるブラウザ内推論
- Canvas で画像を前処理
- 物体検出結果を Evidence / Model Score / Derived Score に統合
- 重要要素の bounding box を UI に重ねて表示

## 採用モデルの比較

候補として主に以下を比較しました。

- `Xenova/yolos-tiny`
- `Xenova/yolos-small`
- `Xenova/detr-resnet-50`

比較観点:

- ブラウザで実際に動かしやすいか
- WebGPU / WASM の両対応か
- 初回ロードの重さ
- Vercel 配布との相性
- 物体検出としての実用性

採用モデル:

- `Xenova/yolos-tiny`

採用理由:

- ブラウザで動かしやすい軽量モデル
- 物体検出の基本をブラウザ内で実現しやすい
- WebGPU 優先、WASM フォールバックの構成にしやすい
- 将来、より大きい検出モデルへ交換しやすい

推論バックエンド:

- `@huggingface/transformers`
- WebGPU 優先
- WASM フォールバック

モデルサイズ:

- `yolos-tiny` は軽量クラスで、初回ロードを現実的にしやすいです
- 正確な配信サイズは CDN / キャッシュ / 量子化設定で変わるため、実運用ではネットワークタブで確認してください

## ローカル推論について

このMVPはブラウザ内で動く軽量な解析を優先しています。

- WebGPU は検出と利用判定を行います
- 初回モデル取得や画像URL取得ではネットワーク通信が発生する場合があります
- 画像ファイルそのものは外部AI APIへ送信しません

## 使用モデル

- 物体検出: `Xenova/yolos-tiny`
- AI生成判定専用モデルではありません
- 役割は「重要な要素を検出し、後続のフォレンジック分析に渡すこと」です

## ブラウザ要件

- Chrome / Edge 推奨
- WebGPU があれば優先利用します
- WebGPU がなくても WASM で実行します
- どちらも使えない場合は明示的にエラー表示します

## セットアップ

```bash
npm install
npm run dev
```

## 開発方法

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo Mode

`.env.local` で `DEMO_MODE=true` を設定すると、デモ表示を有効にできます。

## Vercelへのデプロイ

- Next.js としてそのままデプロイできます
- 外部AI APIキーは不要です
- サーバー側の推論処理は使いません

## プライバシー

- 画像はブラウザ内で解析します
- 画像データベース保存は行いません
- 解析結果はローカル UI にのみ表示します

## 今回できること

- 画像を入力できる
- ブラウザ内で画像前処理できる
- WebGPU / WASM バックエンドを選べる
- 物体検出ができる
- bounding box を表示できる
- 要素を切り出せる
- Evidence とスコアを統合できる

## 今回できないこと

- AI生成画像を確定すること
- Web検索や Internet verification
- 高度なセグメンテーション
- 完全なフォレンジック判定

## 制限事項

- 科学的に検証されたフォレンジック判定器ではありません
- AI生成を確定するものではありません
- URL入力は CORS の制約を受けます
- モデルの初回ロードは時間がかかる場合があります

## YOLOS-tiny Evaluation

- `person`, `tv`, `laptop`, `chair`, `couch`, `bed`, `dining table`, `cell phone`, `book`, `bottle`, `cup`, `clock` は COCO に対応します
- `air conditioner` は YOLOS-tiny で直接検出できません
- `mirror` は専用クラスではありません
- この評価は実画像での定量結果ではなく、MVP 向けの対応表と実用確認の土台です

## Manual Browser Test Checklist

See [`evaluation/BROWSER_TEST_CHECKLIST.md`](./evaluation/BROWSER_TEST_CHECKLIST.md).

## 今後の予定

- より精密な物体検出モデルへの交換
- 局所領域の分析強化
- Copy-Move / ELA などの追加
- 将来の AI生成判定専用モデル追加
