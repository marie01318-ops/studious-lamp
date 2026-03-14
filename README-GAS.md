# GAS 実装手順

## 構成ファイル

- `Code.gs`
- `Constants.gs`
- `Validation.gs`
- `CalendarService.gs`
- `RecordService.gs`
- `Index.html`
- `App.html`
- `Styles.html`
- `appsscript.json`

## できること

- Google カレンダー `primary` への予定登録
- 当日から 2 ヶ月前から 1 ヶ月後までの未完了予定一覧表示
- 状態選択、記録メモ、見出しボタン入力
- Gemini 用整形テキストの生成とコピー
- 完了時のタイトル更新、説明欄保存、色番号 `8` 設定

## 無料運用の前提

- Google Apps Script の標準機能のみを利用
- Google カレンダー連携は `CalendarApp` を利用
- Gemini は API 接続しない
- Gemini 連携は「整形してコピー」まで

## セットアップ

1. Google Apps Script の新規プロジェクトを作成する
2. このディレクトリの `.gs` と `.html` ファイルを同名で貼り付ける
3. `appsscript.json` をマニフェストに反映する
4. 初回実行時に Google カレンダー権限を許可する
5. `doGet` をデプロイして Web アプリとして公開する

## 推奨デプロイ設定

- 実行するユーザー: 自分
- アクセスできるユーザー: 自分のみ、または組織内ユーザー

## 注意点

- 登録先はメインカレンダー `primary`
- 予定タイトルに `【完了】` が付いたものは未完了一覧から除外される
- Gemini へ自動送信はしていない
- 直接送信を入れる場合は別途 API キー管理が必要
