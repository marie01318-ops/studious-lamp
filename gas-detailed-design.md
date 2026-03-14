# GAS 詳細設計書

## 1. 概要

本設計書は、Google Apps Script を用いた Web アプリケーション実装のサーバー側詳細を定義する。  
対象は、HTML Service で配信する画面、Google カレンダー連携、Gemini 連携補助データ生成、完了更新処理である。

## 2. 構成案

| ファイル名 | 役割 |
| --- | --- |
| `Code.gs` | Web アプリ入口、共通制御 |
| `CalendarService.gs` | カレンダー登録・取得・更新 |
| `RecordService.gs` | 状態選択データ整形、支援経過生成補助 |
| `Validation.gs` | 入力値検証 |
| `Constants.gs` | カテゴリー、状態項目、色番号など定数 |
| `Index.html` | 画面テンプレート |
| `App.js.html` | クライアント JavaScript |
| `Styles.html` | クライアント CSS |

## 3. 定数設計

### 3.1 カレンダー関連

```javascript
const CALENDAR_ID = 'primary';
const COMPLETED_PREFIX = '【完了】';
const COMPLETED_COLOR_ID = '8';
```

### 3.2 期間関連

```javascript
const LOOKBACK_MONTHS = 2;
const LOOKAHEAD_MONTHS = 1;
```

### 3.3 カテゴリー

```javascript
const CATEGORIES = ['モニタリング', '担当者会議', 'その他'];
```

### 3.4 状態項目

```javascript
const STATUS_ITEMS = [
  '食事', '睡眠', '排泄', '水分', '服薬', '疼痛', '体調',
  '精神状態', '活動量', '移動', '清潔', '対人関係', '住環境'
];
```

### 3.5 状態選択肢

```javascript
const STATUS_OPTIONS = ['改善', '維持', '悪化', '変化なし', '気になる点あり'];
```

## 4. データモデル

### 4.1 予定登録リクエスト

```javascript
{
  category: string,
  userName: string,
  eventDateTime: string,
  memo: string
}
```

### 4.2 予定情報レスポンス

```javascript
{
  id: string,
  title: string,
  category: string,
  userName: string,
  start: string,
  end: string,
  memo: string,
  description: string,
  colorId: string,
  completed: boolean
}
```

### 4.3 記録保存リクエスト

```javascript
{
  eventId: string,
  statuses: {
    [key: string]: string
  },
  notes: string,
  findings: string,
  nextActions: string,
  aiDraft: string,
  finalRecord: string
}
```

## 5. サーバー関数設計

### 5.1 `doGet()`

役割:

- Web アプリの初期画面を返す

処理:

1. `Index` テンプレートを読み込む
2. タイトルを設定する
3. HTML を返却する

### 5.2 `getInitialData()`

役割:

- 初期表示に必要な定数と未完了予定一覧を返す

戻り値:

```javascript
{
  categories: string[],
  statusItems: string[],
  statusOptions: string[],
  events: EventSummary[]
}
```

### 5.3 `createCalendarEvent(payload)`

役割:

- 予定を Google カレンダー `primary` に登録する

処理:

1. 入力値検証
2. タイトル生成
3. 開始日時、終了日時の決定
4. イベント作成
5. 作成結果返却

タイトル生成ルール:

```javascript
`${payload.category} ${payload.userName}`
```

### 5.4 `getPendingEvents()`

役割:

- 未完了予定一覧を取得する

処理:

1. 基準日を取得
2. 2 ヶ月前から 1 ヶ月後の範囲を算出
3. カレンダーイベント取得
4. `【完了】` を含むタイトルを除外
5. 日付昇順で返却

### 5.5 `getEventDetail(eventId)`

役割:

- 選択した予定の詳細を返す

処理:

1. `eventId` を元にイベント取得
2. 予定詳細を整形
3. 画面用データとして返却

### 5.6 `buildAiPrompt(payload)`

役割:

- Gemini 貼り付け用の整形文を生成する

処理:

1. 状態選択結果を箇条書きへ整形
2. 自由記述を結合
3. 見出しテンプレートを付与
4. AI 入力用テキストを返却

戻り値例:

```text
以下の内容をもとに、介護・福祉現場向けの支援経過記録を簡潔かつ自然な日本語で作成してください。

【対象者】山田太郎
【予定】モニタリング
【状態】
- 食事: 維持
- 睡眠: 改善
...

【メモ】
（本人）
...
```

### 5.7 `completeEvent(payload)`

役割:

- 予定を完了状態へ更新する

処理:

1. 入力検証
2. 対象イベント取得
3. タイトルへ `【完了】` を付与
4. 説明欄へ支援経過保存
5. 色番号 `8` を設定
6. 更新結果返却

## 6. サービス関数詳細

### 6.1 `CalendarService.createEvent(payload)`

- `CalendarApp.getCalendarById(CALENDAR_ID)` を利用
- 終日ではなく日時指定イベントとして登録
- 終了時刻は開始時刻から 60 分後を初期値とする

### 6.2 `CalendarService.listPendingEvents()`

- `getEvents(startDate, endDate)` を利用
- 件数が多い場合に備え、タイトル、日時、説明のみ整形する

### 6.3 `CalendarService.markAsCompleted(payload)`

- `event.setTitle(...)`
- `event.setDescription(...)`
- `event.setColor(COMPLETED_COLOR_ID)`

## 7. バリデーション設計

### 7.1 予定登録

- `category`: 必須
- `userName`: 必須
- `eventDateTime`: 必須

### 7.2 完了処理

- `eventId`: 必須
- `finalRecord`: 必須

### 7.3 共通

- 文字列前後の空白除去
- `null` / `undefined` の吸収

## 8. クライアント連携設計

クライアントから GAS 呼び出しは `google.script.run` を使用する。

例:

```javascript
google.script.run
  .withSuccessHandler(handleSuccess)
  .withFailureHandler(handleFailure)
  .createCalendarEvent(payload);
```

## 9. エラー処理方針

- バリデーションエラーは利用者向けメッセージで返す
- カレンダー取得失敗はログ出力し、画面には簡潔な文言を表示する
- 例外は `try-catch` で補足し、共通エラー整形関数を通す

## 10. ログ設計

- 主要処理の開始・終了を `console.log` または `Logger.log` へ記録
- エラー時は処理名、イベント ID、メッセージを出力
- 個人情報を過度にログへ残さない

## 11. セキュリティ方針

- 実行ユーザー権限で動作させる
- 公開範囲は関係者に限定する
- AI 連携用文面は直接外部送信せず、初期段階ではコピー支援に留める

## 12. 実装優先順

1. `doGet()` と初期画面
2. `getPendingEvents()`
3. `createCalendarEvent(payload)`
4. 状態選択 UI と `buildAiPrompt(payload)`
5. `completeEvent(payload)`
6. エラーハンドリング、ログ整備
