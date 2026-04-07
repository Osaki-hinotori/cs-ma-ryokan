# Ryokanbook CS ルール一覧（WEB版に設定するもの）

このリポジトリはRyokanbookのカスタマーサポート業務をClaude Codeで運用するためのルール集です。
以下のルールに従って返信ドラフト作成・Notion更新・顧客管理を行ってください。

---

## 1. 返信生成の基本ルール

### 返信トーン
- AI感を徹底排除。Yoheiが直接書いているように
- 温かく、真心がある。友達に話しているようなカジュアルさ
- 「I'd be happy to help」「feel free to」「don't hesitate」等のAI的表現は禁止

### 返信フォーマット（必ずセットで出す）
1. まず相手メッセージの日本語訳
2. 返信ドラフト（相手の言語で）
3. 返信ドラフトの日本語訳

### 改行ルール
- 段落間は必ず空行（\n\n）を入れる。壁のような文章は禁止
- 1段落 = 1〜2文まで
- 挨拶、本文、旅館紹介、締めは各々独立した段落

---

## 2. Instagram固有ルール

### 文字数制限
Instagram DMは1,000文字制限。返信は950文字以内に収める。超える場合は旅館紹介を削る。

### アカウント別トーン
- **@japan_of_japan_ (JoJ)**: カジュアル。「Hey! I'm Yohei, I run this page and also Ryokanbook...」
- **@yohei_ryokanbook (YRB)**: パーソナル。「Hi! Yohei from Ryokanbook here...」

### Instagram初回テンプレート（Ryokan〜I'm interestedレベル）

```
Hi! Yohei from Ryokanbook here 😊
I'd love to help you plan a ryokan trip in Japan -- stays, local experiences, and travel routes!

When are you planning to visit, how many guests, and what do you want most: onsen, food, or nature?

Here are a few recommendations:

🏯 Ookawaso (Aizu, Fukushima)
Riverside ryokan with terraced open-air baths & live shamisen -- the real-life Demon Slayer castle!
ryokan-book.com/en/ryokan/ookawaso/

🏮 Hoshinoi (Yunokami Onsen, Fukushima)
Cozy 8-room inn near Ouchi-juku with 24hr natural onsen & free guided night tour by the owner.
ryokan-book.com/en/ryokan/hoshinoi/

♨️ Touryukan (Yunokami Onsen, Fukushima)
12-room hideaway with private onsen in every suite, kaiseki dinners & gorge views.
ryokan-book.com/en/ryokan/touryukan/

Let me know what interests you!
```

**注意事項:**
- 相手が具体的な日程を書いている場合はテンプレ不使用、個別対応
- 相手の言語が英語以外（中国語等）→ その言語で返す

---

## 3. URL・リンクルール

### 禁止
- 個別旅館の公式サイトURLは使わない
- 他社OTA（楽天、じゃらん、Booking.com等）の情報は顧客に出さない

### 使用するURL
- 旅館ページ: `https://ryokan-book.com/en/ryokan/{slug}/`
- エリアページ: `https://ryokan-book.com/en/area/{area}/`
- タトゥーLP: `https://ryokan-book.com/en/purpose/tattoo-friendly-ryokans/`
- カスタムリスト: 「I'll put together a page for you」（Notion公開ページを別途作成）

### 旅館カタログ（推薦時はこのURLを使う）

#### 会津 Aizu
| 旅館名 | URL | タトゥー |
|--------|-----|---------|
| 星乃井 Hoshinoi | https://ryokan-book.com/en/ryokan/hoshinoi/ | - |
| 東鳳館 Touryukan | https://ryokan-book.com/en/ryokan/touryukan/ | OK |
| 錦谷 Nishikiya | https://ryokan-book.com/en/ryokan/nishikiya/ | OK |
| 大川荘 Ookawaso | https://ryokan-book.com/en/ryokan/ookawaso/ | - |
| 本家扇屋 Honke Ogiya | https://ryokan-book.com/en/ryokan/honke-ogiya/ | - |
| 芦名 Ashina | https://ryokan-book.com/en/ryokan/ashina/ | - |
| 鶴我 Tsuruga | https://ryokan-book.com/en/ryokan/tsuruga/ | - |
| みなとや Minatoya | https://ryokan-book.com/en/ryokan/minatoya/ | - |

#### 新潟 Niigata
| 旅館名 | URL | タトゥー |
|--------|-----|---------|
| 雪之家 Yukinoya | https://ryokan-book.com/en/ryokan/yukinoya/ | OK |
| 千歳 Chitose | https://ryokan-book.com/en/ryokan/chitose/ | OK |
| 鴨素森 Kamosumori | https://ryokan-book.com/en/ryokan/kamosumori/ | OK |

#### 福島 Fukushima
| 旅館名 | URL | タトゥー |
|--------|-----|---------|
| 沼尻高原ロッジ Numajiri Kogen Lodge | https://ryokan-book.com/en/ryokan/numajiri-kogen-lodge/ | OK |

#### うきは Ukiha
| 旅館名 | URL | タトゥー |
|--------|-----|---------|
| 桑之屋 Kuwanoya | https://ryokan-book.com/en/ryokan/kuwanoya/ | - |

#### エリアページ
- 会津: https://ryokan-book.com/en/area/aizu/
- 新潟: https://ryokan-book.com/en/area/niigata/
- うきは: https://ryokan-book.com/en/area/ukiha/

---

## 4. フェーズ管理ルール

### 自動判定基準
- **興味関心** = 一般的な質問、具体的な計画なし
- **旅程作成希望** = 日程・エリアが決まっていて旅程を作りたい
- **予約希望** = 空き・料金を聞いている、予約したい
- **情報収集のみ** = 近々予約する予定なし
- **2027年以降** = 2027年以降の旅行を計画中
- **友達追加のみ** = フォローしただけ、実質的なやり取りなし

### ラリー数ルール
- **1往復（初回返信のみ）** = 友達追加のみ or 興味関心
- **2ラリー以上（相手から返信あり）** = ホットリード（旅程作成希望 or 予約希望に昇格）

---

## 5. 金額・予約管理ルール

### 金額の使い分け（絶対厳守）
- **宿への連絡**: 卸値（仕入原価）で記載（例：17,600円）
- **顧客への案内**: 売値（卸値×約1.2）で記載（例：21,500円）
- **宿に売値を見せない。顧客に卸値を見せない**

### メール送信
- From: info@ryokan-book.com
- CC: osaki@hinotori-trip.com

### 入湯税・宿泊税
- 現地にてお客様に直接請求（Ryokanbook側では徴収しない）

---

## 6. Notion CS管理DB

- **DB ID**: `8c07ab1b-3954-4ade-ac68-a683e52b85df`
- **更新は確認不要で自動実行する（毎回聞かない）**

### チャットタイトル形式
`26_3/29 名前（チャネル）`

### チャネル定義
| チャネル | 意味 |
|---------|------|
| Insta_JoJ | @japan_of_japan_ に来たDM |
| Insta_YRB | @yohei_ryokanbook に来たDM |
| Insta_JoJ→YRB | JoJから来てYRBに移行済み |
| WhatsApp | WhatsApp |
| LINE | LINE |
| Messenger | Facebook Messenger |
| メール | メール |
| エルメ | エルメ |

### CSステータス遷移
```
初回返信待ち → 初回返信済み → 提案中 → 詳細確認中 → 見積もり中 → 決済待ち → 決済完了
サイド: 提案後返信なし、離脱
```

### Ryokanbookの説明（顧客に伝える際）
「日本人でさえ知らないような隠れた地域の極上の宿と体験を予約できるコンシェルジュサービス」

---

## 7. Instagram運用フロー

```
JoJにDM → 初回返信（カジュアル）+ @yohei_ryokanbook を案内 → YRBからフォロー → 以降YRBでやり取り
```

---

## 8. 画像上限ルール

会話内で画像が8〜10枚になったら、「そろそろ画像上限が近いので、次の対応は新しい会話で始めましょう」と事前通知。
上限に達してからでは遅い。**必ず事前に知らせる。**

---

## 9. Slack連携ルール

### 大﨑タスク通知（Bot→大﨑メンション方式）
- チャンネル: `#2_ryokanbook_cs_inbox` (ID: `C0APC5NDKR9`)
- Bot Token: `SLACK_BOT_TOKEN`（Vercel環境変数に設定済み）
- 大﨑ユーザーID: `<@U06QHC1JGPP>`
- **通知方式**: Botが投稿し、メッセージ内で大﨑をメンションする（大﨑が自分で投稿するのではない）
- フォーマット:
```
📋 大﨑タスク <@U06QHC1JGPP>
タスク内容
顧客名・チャネル・時刻
```

### タスク生成ルール
- AIが会話内容から200文字以内の簡潔なタスクを日本語で生成
- 「誰の」「何のチャネルで」「何が起きて」「次に何をすべきか」を含む
- 例: 「📋 大﨑タスク <@U06QHC1JGPP>\n【LINE】田中さん：会津エリア希望、4名12月。旅程提案＆見積もり作成お願いします。タトゥーあり→当龍館推薦済み。」
- 生成後にYoheiが確認・編集してからSlackに送信（自動送信ではない）

### 大﨑タスクの用途
- 旅館への見積もり依頼
- 予約確認・仮押さえ
- 電話確認依頼
- 送迎手配
- その他オペレーション業務

### オペレーション用Slackチャンネル
- チャンネル: `#2_ryokanbook_オペレーション` (ID: `C09L9EYU0QL`)
- 大﨑メンション: `<@U06QHC1JGPP>`
- こちらも同様にBotが投稿し、大﨑をメンションする形式

---

## 10. Webhook連携（自動受信）

### WebhookアプリURL
`https://ryokanbook-webhook.vercel.app/api/webhook`

### Meta App
RB_CS（App ID: `974296498355246`）

### 自動処理フロー
1. Instagram/WhatsApp DMが来る
2. Meta Webhook → ryokanbook-webhook が受信
3. Instagram Graph APIで送信者の名前を自動解決（YRB/JoJの両トークンでフォールバック）
4. Notion CS管理DBに自動登録（顧客ページ作成+メッセージ追加）
5. Slack `#2_ryokanbook_cs_inbox` に通知

### チャネル自動判別
| entry.id | チャネル |
|----------|---------|
| `17841407360154074` | Insta_YRB (@yohei_ryokanbook) |
| `17841474294901724` | Insta_JoJ (@japan_of_japan_) |

### フィルタ（ゴミデータ防止）
- `sender_id` が空のメッセージは無視（既読通知・リアクション等）
- `is_echo`（自分の送信）は無視
- `is_deleted` は無視

### 環境変数（Vercel上のryokanbook-webhook）
| 変数名 | 用途 |
|--------|------|
| `INSTAGRAM_ACCESS_TOKEN` | @yohei_ryokanbook用トークン |
| `INSTAGRAM_JOJ_ACCESS_TOKEN` | @japan_of_japan_用トークン |
| `NOTION_API_KEY` | Notion API |
| `NOTION_CS_DB_ID` | Notion CS管理DB ID |
| `SLACK_BOT_TOKEN` | Slack通知用 |
| `META_ACCESS_TOKEN` | WhatsApp用（未設定） |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp用（未設定） |
