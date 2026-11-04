/* ぼーっとする大会：台本の型（定型文）と入力項目
   定型文の中の {{キー}} が入力項目で置き換わります。
   {{#キー}}…{{/キー}} はその項目が入力済み／オンのときだけ、{{^キー}}…{{/キー}} は空／オフのときだけ表示されます。
   時刻の項目は {{キー_jp}} と書くと「14時35分」のような読み上げ用の表記になります。 */
(() => {
'use strict';

/* ---------- 入力項目 ---------- */
const SECTIONS = [
  {id:'basic', title:'基本情報', fields:[
    {k:'name', label:'大会名（正式名称）', type:'text'},
    {k:'date', label:'開催日', type:'date'},
    {k:'dateNote', label:'曜日のあとに付ける表記', type:'text', hint:'例：祝（「火・祝」になります）'},
    {k:'facility', label:'施設名', type:'text', hint:'アナウンスの呼びかけに使います'},
    {k:'venue', label:'会場名（ステージのある場所）', type:'text'},
    {k:'greeting', label:'開会式の第一声', type:'text', hint:'例：アークヒルズで過ごす休日'},
    {k:'specialName', label:'「○○特別版」の呼び方', type:'text', hint:'例：イオンモールの秋休み特別版（空欄にすると読み上げません）'},
    {k:'restroom', label:'お手洗いの場所', type:'text', hint:'例：ステージに向かって右手奥、エレベーター近く（空欄にすると読み上げません）'},
  ]},
  {id:'options', title:'実施する内容', fields:[
    {k:'experienceOn', label:'大会前の「ぼーっと体験会」', type:'toggle'},
    {k:'lotteryOn', label:'当日参加枠（抽選あり）', type:'toggle'},
    {k:'charOn', label:'キャラクターの出演', type:'toggle'},
    {k:'demoOn', label:'メインスポンサーの商品説明・実演', type:'toggle'},
    {k:'guestOn', label:'ゲスト実況者の出演', type:'toggle'},
    {k:'woopsOn', label:'ウップスヤンさんの来場', type:'toggle'},
    {k:'prizeIntroOn', label:'競技終了後の景品紹介', type:'toggle'},
  ]},
  {id:'time', title:'タイムテーブル', fields:[
    {k:'loadIn', label:'搬入開始', type:'time', half:true},
    {k:'staffIn', label:'当日スタッフ入り', type:'time', half:true},
    {k:'castIn', label:'演者入り', type:'time', half:true},
    {k:'rehearsal', label:'リハーサル開始', type:'time', half:true},
    {k:'taikenStart', label:'体験会 開始', type:'time', half:true, show:v=>v.experienceOn},
    {k:'taikenEnd', label:'体験会 終了', type:'time', half:true, show:v=>v.experienceOn},
    {k:'announceStart', label:'場内アナウンス開始', type:'time', half:true},
    {k:'receptionStart', label:'選手受付 開始', type:'time', half:true},
    {k:'sameDayStart', label:'当日エントリー受付 開始', type:'time', half:true, show:v=>v.lotteryOn, hint:'選手受付と同じ時刻なら同時に開始'},
    {k:'receptionEnd', label:'選手受付 締切', type:'time', half:true},
    {k:'lottery', label:'当日参加の抽選発表', type:'time', half:true, show:v=>v.lotteryOn},
    {k:'sameDayDeadline', label:'当日参加者の受付締切', type:'time', half:true, show:v=>v.lotteryOn},
    {k:'opening', label:'開会式', type:'time', half:true},
    {k:'compStart', label:'競技開始', type:'time', half:true},
    {k:'duration', label:'競技時間（分）', type:'number', half:true, hint:'競技終了の時刻は自動で計算します'},
    {k:'interval', label:'心拍数の計測間隔（分）', type:'number', half:true},
    {k:'award', label:'表彰式', type:'time', half:true},
  ]},
  {id:'theme', title:'テーマ・大会の紹介', fields:[
    {k:'theme', label:'今年のテーマ', type:'text', hint:'空欄にすると読み上げません'},
    {k:'townImage', label:'街のイメージ', type:'text', hint:'例：華やかで高価なイメージのある、ここ六本木'},
    {k:'themeShort', label:'テーマ紹介（場内アナウンス用・短め）', type:'textarea', rows:6, hint:'空欄にすると読み上げません'},
    {k:'themeLong', label:'開会式で話す大会の意義・今回の開催に込めた想い', type:'textarea', rows:8},
    {k:'themeMid', label:'テーマ紹介（競技中の実況用）', type:'textarea', rows:6, hint:'空欄にすると読み上げません'},
    {k:'pastThemes', label:'これまでのテーマ', type:'text', hint:'空欄にすると読み上げません'},
    {k:'achievements', label:'今年の開催実績', type:'textarea', rows:4},
    {k:'scaleNote', label:'今回の規模について', type:'text'},
  ]},
  {id:'cast', title:'出演者・スタッフ', fields:[
    {k:'mc', label:'MCの名前', type:'text'},
    {k:'mcTitle', label:'MCの肩書き', type:'text', hint:'例：イベントMC／フリーアナウンサー'},
    {k:'starter', label:'競技開始・終了のホイッスル', type:'text'},
    {k:'presenter', label:'賞状を授与する方', type:'text'},
    {k:'guestName', label:'ゲスト実況者', type:'text', show:v=>v.guestOn},
    {k:'guestIntro', label:'ゲストの紹介文', type:'textarea', rows:3, show:v=>v.guestOn},
    {k:'staffLead', label:'進行担当（カンペ・リハ）', type:'text'},
    {k:'staffSetup', label:'設営担当', type:'text'},
    {k:'staffBanner', label:'ロールバナー担当', type:'text'},
  ]},
  {id:'character', title:'キャラクター', show:v=>v.charOn, fields:[
    {k:'charName', label:'キャラクター名', type:'text'},
    {k:'charCompany', label:'提供企業', type:'text'},
    {k:'charReturn', label:'登場時のひとこと', type:'text', hint:'例：なんと5月の大会に引き続き'},
    {k:'charIntro', label:'キャラクター紹介文', type:'textarea', rows:5},
    {k:'charHistory', label:'過去の出場エピソード', type:'textarea', rows:3},
  ]},
  {id:'sponsor', title:'スポンサー', fields:[
    {k:'mainSponsor', label:'メインスポンサー（正式名称）', type:'text'},
    {k:'mainShort', label:'メインスポンサー（略称）', type:'text'},
    {k:'brand', label:'ブランド・商品名', type:'text'},
    {k:'booth', label:'投票板・ブースの場所', type:'text', hint:'例：競技場後方、MEGURIブースの隣'},
    {k:'sponsors', label:'協賛社紹介（競技終了後に読み上げ）', type:'list', addLabel:'協賛社を追加', itemLabel:i => `${i + 1}社目`,
      item:[{k:'name', label:'会社名', placeholder:'会社名（「様」は自動で付きます）'}, {k:'text', label:'紹介文', type:'textarea', rows:3}]},
  ]},
  {id:'rules', title:'受付・審査・おたすけカード', fields:[
    {k:'handouts', label:'受付での配布物', type:'text'},
    {k:'handoutRules', label:'ルールが載っている配布物', type:'text', hint:'例：パンフレット／チラシの裏'},
    {k:'bannerText', label:'ロールバナーの文言（1行に1枚）', type:'textarea', rows:3, hint:'空欄にすると「〜〜〜」のままになります'},
    {k:'topN', label:'芸術点で選ぶ上位の組数', type:'number', half:true},
    {k:'stickers', label:'観客1人あたりの投票シール', type:'number', half:true},
    {k:'cardRed', label:'赤いカード', type:'textarea', rows:2},
    {k:'cardBlue', label:'青いカード', type:'textarea', rows:2},
    {k:'cardYellow', label:'黄色いカード', type:'textarea', rows:2},
    {k:'cardBlack', label:'黒いカード', type:'textarea', rows:2},
  ]},
  {id:'prize', title:'賞品', fields:[
    {k:'prizeIntro', label:'景品紹介で話す内容', type:'textarea', rows:6, show:v=>v.prizeIntroOn},
    {k:'p3From', label:'3位 賞品の提供元', type:'text'},
    {k:'p3Item', label:'3位 賞品', type:'text'},
    {k:'p2From', label:'2位 賞品の提供元', type:'text'},
    {k:'p2Item', label:'2位 賞品', type:'text'},
    {k:'spFrom', label:'特別賞 賞品の提供元', type:'text'},
    {k:'spItem', label:'特別賞 賞品', type:'text'},
    {k:'winFrom', label:'優勝 賞品の提供元', type:'text'},
    {k:'winItem', label:'優勝 賞品', type:'text'},
  ]},
  {id:'closing', title:'締めの挨拶', fields:[
    {k:'nextEvent', label:'次回大会の告知', type:'textarea', rows:2, hint:'空欄にすると読み上げません'},
    {k:'closingMsg', label:'締めのメッセージ', type:'textarea', rows:7},
    {k:'season', label:'季節のひとこと', type:'text'},
  ]},
];

/* ---------- 初期値（第4回TOKYO大会の内容） ---------- */
const BASE = {
  name:'第4回 TOKYO ぼーっとする大会 Presented by MEGURI',
  date:'2026-11-03', dateNote:'祝',
  facility:'アークヒルズ', venue:'アーク・カラヤン広場', greeting:'アークヒルズで過ごす休日',
  specialName:'', restroom:'',
  experienceOn:true, lotteryOn:true, charOn:true, demoOn:true, guestOn:false, woopsOn:true, prizeIntroOn:false,
  loadIn:'08:30', staffIn:'09:00', castIn:'09:30', rehearsal:'10:30',
  taikenStart:'11:30', taikenEnd:'13:30', announceStart:'12:30',
  receptionStart:'13:30', sameDayStart:'13:30', receptionEnd:'13:55', lottery:'14:05', sameDayDeadline:'14:15',
  opening:'14:35', compStart:'15:00', duration:90, interval:15, award:'16:55',
  theme:'贅沢の再定義', townImage:'華やかで高価なイメージのある、ここ六本木',
  themeShort:
`東京大会の開催は今年で4回目。今回のテーマは「贅沢の再定義」です。
「贅沢」と聞くと、高価な物を買ったり、豪華な場所で過ごしたりすることを思い浮かべがちですが、
モノや情報にあふれ、常に何かに追われている現代社会においては、
「何もしない時間を持てること」こそが、本当の贅沢なのではないでしょうか。
華やかで高価なイメージのある六本木で、あえて何もしない時間を過ごす。
そんな今大会を通じて、皆さまにとっての「本当の贅沢」とは何かを考えるきっかけになってほしいなと思っております。`,
  themeLong:
`皆さんは「贅沢」と聞いて、何を思い浮かべますか？
高価なものを買うこと、豪華な場所で過ごすこと、特別な体験をすること。
私たちは普段、何かを得ることや、満たされることに贅沢を感じることが多いのではないでしょうか。

しかし、モノや情報にあふれ、常に何かに追われている現代社会において、
「何もしない時間を持てること」こそが、本当の贅沢なのではないでしょうか。

今回の大会では、華やかで高価なイメージのある、ここ六本木で、あえて90分間、何もしない時間を過ごしていただきます。
何かを足すことで得られる豊かさではなく、余計なものを手放した先にある豊かさ。
今日の90分間を通じて、皆さんにとっての「本当の贅沢」とは何かを考えるきっかけになれば嬉しく思います。
皆さま、何もしないという最高の贅沢を、存分にお楽しみください！`,
  themeMid:
`皆さんは「贅沢」と聞いて、何を思い浮かべますか？
高価なものを買ったり、豪華な場所で過ごしたり。
私たちは普段、何かを得ることや、満たされることを「贅沢」だと捉えがちです。
しかし、モノや情報にあふれ、常に何かに追われている現代社会においては、
「何もしない時間を持てること」こそが、本当の贅沢なのではないでしょうか。

今まさに、何もしない時間が流れています。
何かを足すことで得られる豊かさではなく、余計なものを手放した先にある豊かさ。
選手の皆さまも、ご観覧中の皆さまも、この時間を「本当の贅沢」とは何かを考えるきっかけにしていただけたら嬉しいです。`,
  pastThemes:'第1回は「働き方の再定義」、第2回は「遊び方の再定義」、第3回は「時間の使い方の再定義」',
  achievements:
`今年は、日本最古の遊園地である「浅草 花やしき」、テレビ朝日 毎年恒例のイベント「サマフェス」、
全国のイオンモールのシルバーウィークイベントなど、様々な場所で開催されてきました。
過去には、大阪・関西万博や新幹線の中でも大会が行われ、これまで色々なところで話題を呼んでいます。`,
  scaleNote:'今年で4回目となるTOKYOぼーっとする大会ということで、参加申し込み数も参加者数も最大規模での開催です。',
  mc:'十束おとは', mcTitle:'イベントMC', starter:'ウップスヤンさん', presenter:'ウップスヤンさん',
  guestName:'', guestIntro:'',
  staffLead:'藤田', staffSetup:'末廣', staffBanner:'木下＆武藤',
  charName:'リラックマ', charCompany:'サンエックス株式会社', charReturn:'なんと5月の大会に引き続き',
  charIntro:
`このリラックマは、いきなりOLのカオルさんの家におじゃましたまま、お世話になり続けている着ぐるみのクマなんです。
中に入っているのが誰かは未だ不明。居候なのに、特に役に立っているわけでもなく、毎日だらだらゴロゴロしている。
そんなリラックマの一番の関心ごとは、毎日のごはんとおやつのようです。
そして、アニメ「リラックマ」が毎週土曜あさ9時25分からTBSにて放映中です！ぜひ、チェックしてみてください。`,
  charHistory:'ちなみに、過去に『ぼーっとする大会』に来てくれたときは、リラックマも選手として参加をしました。\nでも、開始早々、失格になっちゃったんだよね〜。そのときの失格理由は「お腹が空いて動いちゃった」とのことです。',
  mainSponsor:'Nolook（ノールック）商事株式会社', mainShort:'Nolook商事', brand:'MEGURI', booth:'競技場後方、MEGURIブースの隣',
  sponsors:[
    {name:'Nolook（ノールック）商事株式会社', text:'本日MEGURIブースも出されています。\nMEGURIは、癒しをデザインする、日本発センサリーウェルネスブランドです。\n私たちは日々、仕事や家庭など、知らず知らずのうちに多くの「役割」をまとって過ごしています。\nMEGURIは、そんなあなたに、心から休まる癒しの時間を届けたいという想いから生まれました。\nぼーっとする時間を、より深く、心地よく。\nぜひ、実際にお手に取って、MEGURIならではの癒しと休息をご体感ください。'},
    {name:'サンエックス株式会社', text:'リラックマ、すみっコぐらし、たれぱんだなど、1,000を超える100％オリジナルキャラクターを生み出し続け、\n不思議な魅力をオリジナルプロダクトやライセンス事業、様々なイベントやプロモーション、映像などを通じて世界中に届けています。\nかわいいだけじゃないサンエックスキャラクターは、多くの人々を引きつけています。'},
    {name:'ネドじゅん', text:'ネドじゅん様が設立したオンラインコミュニティ「三脳バランス研究所」は、2023年度、DMMオンラインサロン「最優秀成長賞」を受賞。\nここでは、参加者全員が「研究員」となって自身の変容を目指します。\n気になる方はどうぞご活用ください！'},
    {name:'City Camp（シティキャンプ）', text:'コンセプトは、「なんもしないをしませんか」。\nクラフトノンアル飲料「OFF COLA」は、一日の終わりにご褒美を与えてくれる、OFFタイムの象徴となるドリンクです。\nAmazonや成城石井、一部限定のセブンイレブンや全国の銭湯で販売しております。'},
    {name:'合同会社マクフライ・ジャパン・トレイディング', text:'スリープヘキサゴンの温泉ヒーリングブランケットは、ぼーっとする時間を愛する皆さまにぴったりの商品です。\nこの商品のキャッチコピーは「がんばる女性に、“何もしないご褒美“を」。もちろん男性もお使い頂けます。'},
  ],
  handouts:'参加証明書・ゼッケン・おたすけカード・パンフレット・チラシ一式', handoutRules:'パンフレット', bannerText:'',
  topN:10, stickers:3,
  cardRed:'凝り固まった筋肉を緩めるマッサージサービスです。\n首周りが疲れてきたと感じた方は、赤いカードを挙げていただければMEGURI製品のネックピローをお渡しします。',
  cardBlue:'喉の渇きを潤すドリンクサービスです。青いカードを挙げた方には、お水を提供します。',
  cardYellow:'寒さを緩和するホットサービスです。黄色いカードを挙げた方には、カイロをお渡しします。',
  cardBlack:'その他の不便を解消するサービスです。お手洗いに行きたいときや体調不良のときなどに、合図としてご使用ください。',
  prizeIntro:'',
  p3From:'', p3Item:'', p2From:'', p2Item:'',
  spFrom:'サンエックス株式会社', spItem:'', winFrom:'Nolook商事株式会社', winItem:'',
  nextEvent:'',
  closingMsg:
`さて、今日の「ぼーっとする」という経験は、皆さまにとってどのように感じられたでしょうか。
日々、仕事や勉強、家事や育児に追われ、常に身体や頭を動かさなければいけない現代人たち。
その中で、SNSや人間関係を通じて、様々な情報・しがらみ・不安などに囲まれながら、
自分と他人を比較してしまったり、自分を見失ってしまったりと、心も疲弊していきやすい世の中です。

ですが、今日のように、あえて『何もしない、ただの私』としてぼーっとする時間をつくってみる。
それだけで、頭や身体に本当の意味での休息を与え、心もふわっと軽くなる。
この大会が、あなた自身をポジティブに見つめ直す、優しいきっかけになったら幸いです。`,
  season:'季節の変わり目で体調管理も大変な時期になりました。',
};

/* ライセンスアウト（他社主催）で新しく作るときに上書きする初期値
   テレビ朝日・六本木ヒルズ SUMMER FES（2026/7/26）とイオンレイクタウン（2026/9/22）の台本がもと */
const LICENSE = {
  name:'ぼーっとする大会 in ○○', specialName:'○○特別版', date:'', dateNote:'',
  facility:'○○', venue:'○○広場', greeting:'○○での休日', restroom:'',
  experienceOn:false, lotteryOn:true, charOn:false, demoOn:false, guestOn:false, woopsOn:false, prizeIntroOn:false,
  loadIn:'08:00', staffIn:'09:00', castIn:'09:00', rehearsal:'09:15',
  taikenStart:'10:00', taikenEnd:'12:30', announceStart:'13:00',
  receptionStart:'13:20', sameDayStart:'13:35', receptionEnd:'14:05', lottery:'14:15', sameDayDeadline:'14:25',
  opening:'14:45', compStart:'15:00', duration:60, award:'16:15',
  theme:'', townImage:'', themeShort:'', themeMid:'', pastThemes:'', scaleNote:'',
  themeLong:
`今回は「○○特別版」ということで、普段の生活から離れて休日をお楽しみの方もたくさんいらっしゃると思います。
普段の生活は、自分のタスクに追われて、隙間時間もあまり取れず、寝て起きての繰り返し。
身体や心が疲れていることはなんとなくわかっていても、休める暇もなく、さらには、大量の情報をイヤでも浴び続けなければいけない。
そんな日々を皆さま過ごされていると思います。

ここらで一旦、何もせずぼーっとして、身体も心も本当の意味で休ませてあげましょう。
これをきっかけに、何か気づきが得られるかもしれません。`,
  achievements:
`昨年の大阪・関西万博では、万博カラオケを中心にSNSで大人気だった「よしもとwaraii myraii館」にて、このぼーっとする大会が開催されました。
また、過去には新幹線の中で行われたこともあったりと、これまで色々なところで話題を呼んできました。`,
  mc:'', mcTitle:'イベントMC', starter:'SP', presenter:'SP',
  guestName:'', guestIntro:'', staffLead:'藤田', staffSetup:'木下・武藤', staffBanner:'木下',
  mainSponsor:'', mainShort:'', brand:'', booth:'会場の横、「ぼーっとする大会」ののぼりのところ',
  sponsors:[],
  handouts:'ゼッケン・チラシ・おたすけカード・参加証明書の4点', handoutRules:'チラシの裏',
  bannerText:'忙しい日常で動き続けている自分を、今日は止めてみましょう。\nこの大会だけは、ただ存在するだけで拍手をもらうことができます。\n指定の向きで座ってください。ホイッスルの合図で競技開始です。',
  cardRed:'凝り固まった筋肉を緩めるマッサージサービスです。\n同じ姿勢で身体がキツくなった方は、赤いカードを挙げていただければスタッフが1分間の肩揉みマッサージをします。',
  cardYellow:'暑さを緩和するクールサービスです。黄色いカードを挙げた方には、スタッフが1分間うちわで風を送ります。',
  prizeIntro:'',
  p3From:'', p3Item:'', p2From:'', p2Item:'', spFrom:'', spItem:'', winFrom:'', winItem:'',
  nextEvent:'',
};

/* ---------- 時刻 ---------- */
const toMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const fromMin = n => n == null ? '' : `${Math.floor(n / 60) % 24}:${String(((n % 60) + 60) % 60).padStart(2,'0')}`;
const add = (t, m) => { const n = toMin(t); return n == null ? '' : fromMin(n + m); };
const jp = t => { const n = toMin(t); if (n == null) return ''; const h = Math.floor(n / 60), m = n % 60; return m ? `${h}時${m}分` : `${h}時`; };

function computed(v){
  const c = {...v};
  c.compEnd = add(v.compStart, Number(v.duration) || 0);
  c.closeTime = add(v.award, 20);
  c.countdown = add(c.compEnd, -3);
  for (const k of ['taikenStart','taikenEnd','announceStart','receptionStart','sameDayStart','receptionEnd','lottery','sameDayDeadline','opening','compStart','compEnd','award','countdown'])
    c[k + '_jp'] = jp(c[k]);
  c.lotteryGather = jp(add(v.lottery, -2));
  c.license = v.mode === 'license';
  c.own = !c.license;
  c.sameDayLater = v.lotteryOn && toMin(v.sameDayStart) > toMin(v.receptionStart);
  c.shortened = (Number(v.duration) || 0) < 90;
  c.patrol = v.woopsOn ? 'ウップスヤンさんとSPの御三方' : 'SPのお二人';
  c.bannerLines = String(v.bannerText || '').split('\n').map(t => t.trim()).filter(Boolean);
  c.bannerLines.forEach((t, i) => { c['bannerLine' + i] = t; });
  c.tallyMin = Math.max(5, (toMin(v.award) ?? 0) - (toMin(c.compEnd) ?? 0));
  c.dateLabel = (() => {
    const d = v.date && new Date(v.date + 'T00:00:00');
    if (!d || isNaN(d)) return '日付未定';
    const w = '日月火水木金土'[d.getDay()];
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${w}${v.dateNote ? '・' + v.dateNote : ''}）`;
  })();
  return c;
}

/* ---------- 台本の型 ---------- */
/* at: 時刻、stage: 立ち位置、scene: シーン、script: 台詞、music: 音響、staff: スタッフ、when: 表示条件 */
const ANNOUNCE_A =
`{{facility}}にご来場の皆さまにご案内申し上げます！
本日は、ここ「{{venue}}」にて、『{{name}}』が行われます！

忙しい現代に生きる全ての人々へ、心に余白を作ってもらいたい。
そんなコンセプトを掲げた『ぼーっとする大会』は、2014年にアーティストのウップスヤンさんが始めた韓国発祥の大会で、
名前の通り、どれだけぼーっとしていられるかを競います。
{{#specialName}}今回は「{{specialName}}」として開催します！
{{/specialName}}{{#themeShort}}
{{themeShort}}
{{/themeShort}}
今大会の競技時間は{{duration}}分間。順位の決め方には、{{interval}}分おきに計測する心拍数とご観覧の皆さまからの投票が関わってきます。
本日「{{facility}}」にご来場中の皆さま、{{compStart_jp}}から{{compEnd_jp}}の間に少しでもお時間ございましたら、
ぜひ「{{venue}}」にふらっとお立ち寄りいただき、投票にご協力いただければと思います！
{{#lotteryOn}}
また、当日参加枠が少しございますので、お時間に余裕があり、
「何もしないことの価値を感じてみたい！」という方は、ぜひチャレンジしてみてはいかがでしょうか！
速く走ったり、重いものを持ったり出来なくても大丈夫。ただひたすらにぼーっとすることを競う韓国発祥の人気イベント！
{{#sameDayLater}}ご参加ご希望の方は、{{sameDayStart_jp}}から当日参加者の受付を行いますので、時間になりましたら「{{venue}}」、「ぼーっとする大会」ののぼりがある受付までお越しください！{{/sameDayLater}}{{^sameDayLater}}ご参加ご希望の方は、{{receptionEnd_jp}}までに受付近くにいるスタッフにお声がけください！{{/sameDayLater}}{{/lotteryOn}}`;

const RECEPTION_BODY =
`受付では、【{{handouts}}】をお配りしています。{{handoutRules}}には、
大会のルールやおたすけカードの使い方が記載されているので、競技が始まるまでに確認しておいてください。

受付が済んだら、投票ブースに移動して、ご自身のゼッケン番号の投票用紙に参加理由や意気込みをご記入ください。
その後、ご自身のゼッケン番号のヨガマットに座り、開会式までぼーっとしてお待ちくださいね。
なお、ヨガマットに上がる際は靴を脱いでいただきます。脱いだ靴はマットの後ろ側に置くようにお願いいたします。
{{#lotteryOn}}{{#sameDayLater}}
また、このあと{{sameDayStart_jp}}より当日参加エントリーの受付が始まります。
"我こそは、ぼーっとすることが得意だー！！"とか、"最近忙しすぎたからちょっと一息つきたいな"という方は、ぜひチャレンジしてみてはいかがでしょうか！
{{/sameDayLater}}{{^sameDayLater}}
また、{{receptionEnd_jp}}まで、当日参加エントリーも受付中です。
「今日たまたま遊びに来たけど、ぼーっとしてみたい！」「何もしないことの価値を感じてみたい！」という方は、
ぜひチャレンジしてみてはいかがでしょうか！
ご参加ご希望の方は、{{receptionEnd_jp}}までに受付近くにいるスタッフにお声がけください！
なお、当日参加者の選定は抽選で行う予定です。抽選結果は{{lottery_jp}}に発表いたしますので、受付にお越しください。
{{/sameDayLater}}{{/lotteryOn}}
本日は、こちら「{{venue}}」にて『ぼーっとする大会』を開催いたします。`;

const AWARD_STEP = (rank, label, from, item, extra = '') =>
`『{{name}}』${label}は、、、

＝＝＝＝《★ドラムロール：C.I.》＝＝＝＝

ゼッケンナンバー◯◯、△△△△さん！
おめでとうございます！《★BGM③：C.I.》
どうぞ、ステージにお進みください。

【MC：賞状読み上げ／{{presenter}}：賞状授与】
おめでとうございます！！
${extra}{{#${item}}}そして、△△△△さんには、{{#${from}}}{{${from}}}様より、{{/${from}}}{{${item}}}が贈呈されます！
【賞品授与】
{{/${item}}}
では、皆さまで写真を撮りましょう。
【MC、{{presenter}}、SP、受賞者：全員で写真撮影】

ということで、受賞した感想をお聞かせください！
【MC：マイクを傾ける】
【受賞者：1分程度感想】

${label}は△△△△さんでした！ おめでとうございま〜す！
【SP：受賞者を下手奥に誘導】`;

const AWARD_MUSIC = label => `★BGM③：F.O.\n★ドラムロール：C.I.\nきっかけ「${label}は、、、」\n★BGM③：C.I.\nきっかけ「おめでとうございます！」\n※煽りから入って、盛り上がりが落ち着いてから薄めでキープ`;

function blocks(c){
  const B = [];
  const push = (when, b) => { if (when) B.push(b); };

  push(c.experienceOn, {at:c.taikenStart, stage:'【MC】ステージ中央でアナウンス', scene:'ぼーっと体験会の案内', script:
`{{facility}}にご来場の皆さまにご案内申し上げます！
本日は、ここ「{{venue}}」にて、『{{name}}』が行われます！

そんな『ぼーっとする大会』に先立ちまして、ただいまより「ぼーっと体験会」を行います。
こちらの競技場を一般開放いたしまして、大会に参加しない方にも「ぼーっとすること」を楽しんでいただく時間です。
競技場内にあるヨガマットを利用してOKですので、リラックスできる体勢になっていただき、ご自由にぼーっとしてください。
今から{{taikenEnd_jp}}まで開放いたします。

普段そんなに何もしない時間を取れるという方はなかなかいらっしゃらないかなと思いますので、
是非この時間を活用して、普段はできない体験、そしてそこから得られる気づきをお持ち帰りいただければと思います。
もちろん、5分だけぼーっとしてみようかなという方も大歓迎です。
ぼーっと体験をご希望される方は、競技場周辺にいるスタッフにお声がけください。
{{#charOn}}
なお、{{announceStart_jp}}ごろから、こちらのステージに大人気キャラクター・{{charName}}が来てくれます！
希望者の方との写真撮影タイムも予定しているので、是非それまでぼーっとお待ちいただけると嬉しいです。
{{/charOn}}
それでは、何もしない時間をお楽しみください。`, music:'★BGM①：薄めでキープ'});

  push(c.license && c.lotteryOn, {at:add(c.announceStart, -45), stage:'【MC】', scene:'場内アナウンス（短め）\n※10分おきに繰り返す', script:
`★場内アナウンス★
{{facility}}にご来場の皆さまにご案内申し上げます！
本日は、ここ「{{venue}}」で「ぼーっとする大会」が行われます！

当日参加枠もまだ少しあるみたいなので、「ぼーっとするの得意だー！」「最近疲れているからぼーっとしてみたいな」という方は、
ぜひ{{sameDayStart_jp}}からの当日エントリー受付をしにきてくださいねー！`});

  push(true, {at:c.announceStart, stage:'【MC】ステージ中央でアナウンス\n→合間の時間は袖で待機', scene:'大会の説明\n投票の呼びかけ\n当日参加の呼びかけ', script: ANNOUNCE_A + (c.charOn ? '\n\n【MC：{{charName}}登場まで軽くつなげる】' : ''), music:'★BGM①：薄めでキープ\n※拍手が起きるような場面では、それに応じて煽る'});

  push(c.charOn, {at:add(c.announceStart, 5), stage:'【MC】上手\n【{{charName}}】中央', scene:'{{charName}}登場\n撮影会', script:
`【{{charName}}：登場】
皆さま！ステージをご覧ください！
{{charReturn}}、{{charName}}が遊びに来てくれました！
今日はここでぼーっとしていくの〜？
【{{charName}}：うなずく】

このあと、ここで{{opening_jp}}からぼーっとする大会があるから、ぼーっとするお手本をみんなに見せてあげてほしいな〜
【{{charName}}：ぼーっとし始める】 ※3〜4分ぼーっとする

{{charName}}、ちゃんとぼーっとしてますね〜
では、この時間を使って、改めて{{charName}}の紹介をしますね。
{{charIntro}}
{{#charHistory}}
{{charHistory}}
{{/charHistory}}
今日の大会も参加してくれるそうなので、リベンジできるかな〜？ 皆さまも応援お願いします！

せっかくなので、ここからは、ぼーっとしている{{charName}}との撮影タイムにしたいと思います！
{{charName}}の隣でぼーっとしたいよ〜という方は、前方へお越しください！
スタッフがご案内しますので、慌てずゆっくりと、譲り合いながらお並びいただくようお願いします。`, staff:'列誘導スタッフ：2名（SP）\nその他案内：{{charCompany}}'});

  push(c.charOn, {at:add(c.announceStart, 25), stage:'【MC】上手\n【{{charName}}】退場', scene:'{{charName}}退場', script:
`{{charName}}、みんなにお手本見せてくれてありがとう〜
また来てくれるかな......? 【{{charName}}：うなずく】
やった〜！ じゃあ、またあとでね〜、ばいば〜い！
【{{charName}}：退場】`, staff:'時間になったら、並んでいる人がいても撮影会終了'});

  push(toMin(c.receptionStart) - toMin(c.announceStart) > 30, {at:add(c.receptionStart, -15), stage:'【MC】中央', scene:'大会の説明\n投票の呼びかけ\n当日参加の呼びかけ', script: ANNOUNCE_A + '\n\n※状況に応じて繰り返し'});

  push(true, {at:c.receptionStart, stage:'【MC】中央', scene:'受付の流れ\n当日参加の呼びかけ', script:
`本日{{opening_jp}}より、こちら「{{venue}}」にて『ぼーっとする大会』が開催されます！

事前の選手登録がお済みの皆さまにお知らせです。
ただいまより、参加受付を行います。
「ぼーっとする大会」ののぼりがある受付にて、お申し込み時のお名前をお伝えください。
{{receptionEnd_jp}}を過ぎると競技への参加ができなくなってしまいますので、ご注意ください。

${RECEPTION_BODY}`});

  push(c.sameDayLater, {at:c.sameDayStart, stage:'【MC】中央', scene:'当日エントリー受付開始', script:
`本日{{opening_jp}}より、こちら「{{venue}}」にて『{{name}}』が開催されます！
{{sameDayStart_jp}}になりましたので、これより当日エントリーの受付を開始いたします。

当日参加枠が若干名ございますので、"今日たまたま遊びに来たけど、ぼーっとしてみたい！"という気持ちがあり、
{{duration}}分間ぼーっとするお時間のある方はぜひ受付にお越しください。
また、3人までのチームでも参加ができますので、"みんなでぼーっとしてみたら楽しそう！"という方々にもオススメです。

ただひたすらに何にもしないことを競う韓国発祥の人気イベント！ご参加ご希望の方は、{{receptionEnd_jp}}までに受付にお申し出ください。
なお、当日枠の数を超えるエントリーがあった場合は、参加者を抽選で決めさせていただきます。
ぜひ、皆さまのご参加をお待ちしております！

また、競技参加者の皆さまは{{opening_jp}}からの開会式に間に合うよう、ご準備をお願いいたします。
{{#restroom}}なお、お手洗いは、{{restroom}}にございます。{{/restroom}}`});

  push(true, {at:add(c.receptionStart, c.sameDayLater ? 30 : 10), stage:'【MC】中央', scene:'受付の催促', script:
`本日{{opening_jp}}より、こちら「{{venue}}」にて『ぼーっとする大会』が開催されます！

事前の選手登録がお済みの皆さまにお知らせです。
まだ受付を済まされていない方は、{{receptionEnd_jp}}までに必ず、受付にてお申し込み時のお名前をお伝えください。
{{receptionEnd_jp}}を過ぎると競技への参加ができなくなってしまいますので、ご注意ください。

${RECEPTION_BODY}`});

  push(true, {at:c.receptionEnd, stage:'【MC】中央', scene:'受付終了' + (c.lotteryOn ? 'と抽選結果発表のアナウンス' : ''), script: c.lotteryOn ?
`ただいまの時刻{{receptionEnd_jp}}を持ちまして、受付を終了いたします。
このあと{{lottery_jp}}から、当日参加をご希望された皆さまの抽選結果が発表されますので、
該当の皆さまは{{lotteryGather}}くらいには受付の近くにお集まりください。

※※当日参加枠数を当日エントリー数が下回った場合、抽選は無し（以下の文面に変更）※※
ただいまの時刻{{receptionEnd_jp}}を持ちまして、受付を終了いたします。
当日参加を希望された方には参加のご案内を致しますので、{{sameDayDeadline_jp}}までに受付にてお名前をお伝えください。` :
`ただいまの時刻{{receptionEnd_jp}}を持ちまして、受付を終了いたします。
選手の皆さまは、ご自身のゼッケン番号のヨガマットに座り、開会式までぼーっとしてお待ちください。`});

  push(c.lotteryOn, {at:add(c.lottery, -5), stage:'【MC】中央', scene:'抽選結果発表のアナウンス', script:
`現在時刻は{{lottery_jp}}の少し前になりました。
まもなく、当日参加をご希望された皆さまの抽選結果を発表いたします。
当日参加にエントリーした皆さまは受付にお集まりください！`});

  push(c.lotteryOn, {at:add(c.lottery, 5), stage:'【MC】中央', scene:'抽選結果発表のアナウンス', script:
`当日参加をご希望された皆さまにご連絡です。
抽選結果の発表がすでに行われています。
まだご自身の結果を聞いていない方は、急いで受付へとお越しください！
{{sameDayDeadline_jp}}を過ぎてしまいますと、もし当選していたとしても他の方に参加枠を譲らせていただく場合があるため、
まだ抽選結果を聞いていない方は、受付へとお急ぎください。

なお、開会式はこのあと{{opening_jp}}から始めます。
当日参加が確定した皆さまはそれまでに競技場内にいられるように、急いで準備をお願いします！`});

  push(c.lotteryOn, {at:c.sameDayDeadline, stage:'【MC】中央', scene:'当日参加者への受付催促\n※当日の状況によりお願いする場合あり', script:
`当日参加者の皆さまにご連絡です。
まだ受付を済まされていない方は、急ぎ受付へとお越しください！
まもなく開会式が始まりますので、受付へとお急ぎください。

また、すでに受付を済ませた選手の皆さまの中で、投票ブースにて参加理由や意気込みを書いていない方は、
今のうちにご記入をお願いいたします。`});

  push(true, {at:add(c.opening, -15), stage:'【MC】中央', scene:'大会の説明\n投票の呼びかけ', script:
`ご来場の皆さまにご案内します！
本日こちら「{{venue}}」にて、『{{name}}』を開催いたします！

この『ぼーっとする大会』は、2014年にアーティストのウップスヤンさんが始めた韓国発祥のイベントで、
名前の通り、どれだけぼーっとしていられるかを競う大会になっています。

{{achievements}}
{{#themeShort}}
{{themeShort}}
{{/themeShort}}
そんな、『ぼーっとする大会』の順位の決め方には、ご観覧の皆さまからの投票も重要となってきますので、
ご通行中の皆さま、お時間がございましたら、ぜひ、投票へのご協力をいただきますようお願いいたします。

本日は、こちら「{{venue}}」にて『ぼーっとする大会』を開催いたします。
{{opening_jp}}からの開会式まで、今しばらくお待ちください！`});

  push(true, {at:add(c.opening, -10), stage:'【MC】中央', scene:'ルールの説明\n上位の決め方の説明\n投票の呼びかけ', script:
`さて、何にもしない時間と言っておりますが、
この『ぼーっとする大会』は、スポーツ競技のような面もありまして、
「大会」と言うぐらいですから、最終的に優勝者を決めることになります。

では、どうやって優勝者を決めるのかというと、フィギアスケートのように「芸術点」と「技術点」を競います。
「芸術点」とは、選手の皆さまがどんな理由で参加したか、どれだけ楽しんでぼーっとしていたのか。
ご観覧の皆さまの投票によって、点数をつけることになります。

続いて「技術点」とは、選手の皆さまの心拍数が基準になります。
この大会では、{{interval}}分ごとに選手一人ひとりの心拍数を測ります。{{duration}}分間の中で、どれだけ心拍が安定していたか。
周りの環境や時の流れに影響を受けず、変化の少なかった選手ほど「技術点」が高くなります。

そして、最終的な上位者の決め方は、まず「芸術点」が高かった順です。
ご観覧の皆さまの投票が多かった上位{{topN}}組を選出し、その中で「技術点」の高い順に、優勝、2位、3位と順位を決めます。
また、最も「ぼーっとする」というコンセプトを表現できていた選手には「特別賞」が授与されます。

なお、ご観覧の皆さまには、「芸術点」を決めるための投票シールを{{stickers}}枚ずつお配りしています。
{{booth}}に投票板を設置していますので、大会が始まったら「この人ぼーっとしてる！」
「この人なにもしない時間を楽しんでいていいな！」と目に止まった選手にシールを貼ってください。
まだシールを貰っていない方にはスタッフがお渡ししますので、お気軽にお声がけください。

まもなく、大会が始まります！`});

  push(true, {at:c.opening, stage:'【MC】ステージ中央' + (c.woopsOn ? '\n【ウップスヤン＆SP】袖に待機' : '') + (c.demoOn ? '\n【{{mainShort}}様】袖に待機' : ''), scene:'開会式スタート\n大会趣旨の説明', script:
`《★音響：BGM切り替え》
【MC：音響きっかけで登場】

皆さま、こんにちは〜！！！
{{greeting}}、お楽しみいただけていますか〜！！

ただいまより、『{{name}}』を開催いたします！！！！！

申し遅れましたが、私、司会進行を務めさせていただきます、
{{mcTitle}}の{{mc}}と申します！どうぞよろしくお願いいたします！！
ということで、まずは「この大会ってなんなの？」というところを、
選手の皆さまにもご観覧の皆さまにもお伝えできればと思います。

この『ぼーっとする大会』は、2014年にアーティストのウップスヤンさんが始めた韓国発祥のイベントで、
名前の通り、どれだけぼーっとしていられるかを競う大会になっています。
何もしないで、ただひたすらにぼーっとすることをどれだけ楽しめるか！
何かと忙しくしている現代の私たちにとって、ちょっと考えさせられる不思議で面白いイベントです。

{{achievements}}
{{#scaleNote}}
{{scaleNote}}
{{/scaleNote}}{{#pastThemes}}
TOKYOぼーっとする大会では、毎年異なるテーマを掲げ、現代社会の“当たり前”を問い直してきました。
{{pastThemes}}
そして、今年のテーマは、「{{theme}}」です。
{{/pastThemes}}{{#themeLong}}
{{themeLong}}
{{/themeLong}}`, music:'★BGM①▷BGM②に切替\n→MC登場で煽り\n→「開催いたします」で煽り\n→その後は薄めでキープ'});

  push(true, {at:add(c.opening, 2), stage:'', scene:'ルールの説明\n上位の決め方の説明' + (c.demoOn ? '\n{{mainShort}}様へのバトンタッチ' : ''), script:
`さて、競技開始前に、ご観覧の皆さまにも簡単にルールの説明をさせていただきます。
ルールはいたってシンプル。{{duration}}分間のあいだ、どれだけぼーっとしていられたかを競う、ただそれだけです。
{{#shortened}}普段は競技時間を90分間で設定しておりますが、今回は多くの方に参加していただきやすいように{{duration}}分間とします。
{{/shortened}}
採点の仕方は、フィギアスケートのように「芸術点」と「技術点」の2種類ございます。
まず、「芸術点」は、ご観覧の皆さまの投票によって決定します。
選手の皆さまの服装や小道具、表情やポーズなど、どれだけ「ぼーっと」を表現しながら、{{duration}}分間楽しんでいたか。
この観点で、「いいなぁ」「この人好き！」「ビビッときた！」という方に投票をお願いします。

投票板があるのは{{booth}}です。
お一人につき{{stickers}}枚のシールをお渡ししていますので、そちらを貼って投票してください。
なお、投票板には、選手の皆さまの職業や参加理由が書かれています。
そちらも読んでいただくと、その方の背景や普段とのギャップが見えてきて、より観覧に深みが出て楽しめるかと思います。

もう一つの審査基準は、「技術点」です。
競技中、運営スタッフが{{interval}}分ごとに選手一人ひとりの心拍数を測ります。
なお、チームで参加されている場合は、ゼッケンをつけている代表者1名のみを計測対象とします。

そして、競技終了後「芸術点」が高かった上位{{topN}}組を選出。その中で、「技術点」が高い順に優勝、2位、3位を決定します。
また、最もぼーっとするというコンセプトを表現できていた方には特別賞が与えられます。
そして、特別賞、3位、2位、優勝の4組には、表彰式にて賞状と豪華賞品が授与されます！
{{^demoOn}}{{#winItem}}さらに、優勝した組には優勝トロフィーと、副賞として{{#winFrom}}{{winFrom}}様より、{{/winFrom}}{{winItem}}が贈呈されます！
{{/winItem}}皆さま入賞目指して頑張ってください〜！
{{/demoOn}}{{#demoOn}}
さらに、優勝した組にはトロフィーと、
今大会のメインスポンサーである{{mainSponsor}} 様より豪華賞品がプレゼントされます！

{{booth}}にも展示をしているとのことですが、
どんな商品なのか、実際に{{mainShort}}の方にご説明いただきましょう！
よろしくお願いいたします！

【{{mainShort}}ご担当者様：登場】
{{/demoOn}}`});

  push(c.demoOn, {at:add(c.opening, 4), stage:'【{{mainShort}}様】ステージ中央で説明\n→一度ハケる', scene:'{{mainShort}}様\n{{brand}}説明・実演①', script:
`【{{mainShort}}ご担当者様：商品の特徴説明など】※3分間目安

【{{mainShort}}ご担当者様：一度ハケる】`});

  push(c.charOn, {at:add(c.opening, 7), stage:'【{{charName}}】ステージ下手側から競技場へ', scene:'{{charName}}登場②', script:
`実演を踏まえたご説明、ありがとうございます！
では、今回も参加してくれるというあのキャラクターを呼びましょうか！

{{charName}}〜おいで〜！
【{{charName}}：競技場へ登場】

知ってる方も多いと思いますが、改めて{{charName}}の紹介をしますね。
{{charIntro}}

ということで、今回こそ優勝を狙って参戦してくれた{{charName}}も、無事、スタンバイができました！`, staff:'{{charName}}導線：当日朝確認'});

  push(c.demoOn, {at:add(c.opening, 12), stage:'【{{mainShort}}様】ステージ中央で説明\n→説明後にハケる', scene:'{{mainShort}}様\n{{brand}}説明・実演②', script:
`そろそろ{{brand}}のほうに変化はありそうですか〜？
【{{mainShort}}ご担当者様：再登場】
【{{mainShort}}ご担当者様：時間経過による効果説明など】※7分間目安

わかりやすいご説明ありがとうございました！
{{brand}}は、{{booth}}にも展示しているとのことなので、興味を持ってくださった皆さま、ぜひお立ち寄りください！
{{mainSponsor}} 様でした！ ありがとうございました〜！
【{{mainShort}}ご担当者様：退場】`});

  push(true, {at:add(c.compStart, -6), stage: c.woopsOn ? '【ウップスヤン＆SP】ステージ中央へ登場\n→準備体操\n→ロールバナー\n→下手側から競技場へ降りて巡回' : '【SP】ステージ中央へ登場\n→準備体操', scene:(c.woopsOn ? 'ウップスヤン＆SP登場\n' : 'SP登場\n') + '準備運動\n競技開始', script:
`ということで、競技開始の時間が迫ってまいりました。
{{#woopsOn}}ここで、こちらの方々に登場してもらいましょう。
大会考案者のウップスヤンさん、そして、SPのお二人です！お願いします！
【ウップスヤン＆SP：登場】

本日は、韓国からウップスヤンさんにお越しいただきました！皆さま拍手をお願いします！
{{/woopsOn}}{{^woopsOn}}ここで、SPのお二人に登場してもらいましょう！
【SP：登場】
{{/woopsOn}}
SPと呼ばれるこちらのお二人は、
競技中に選手の皆さまがきちんとぼーっとできているか見回りをする、いわば監査役。
どんな行動が「ぼーっとしていない」とみなされるのかについては、競技が始まったら詳しく説明いたします。
見回りの方が歩きやすいように、選手の皆さまは靴を背中側に置くようにお願いいたします。

では、ここからは競技開始に先立ちまして、
心をリラックスさせるための準備体操、そして『ぼーっとする大会』{{#woopsOn}}恒例の開会宣言{{/woopsOn}}{{^woopsOn}}お決まりのロールバナーパフォーマンス{{/woopsOn}}へ移ります。
この大会は「参加型パフォーマンス作品」という側面がありまして、今から行う準備体操もその一要素です。
ということで、皆さまご起立ください。
【{{staffBanner}}：ロールバナー設置】
なお、このあと競技開始の合図が出たら、皆さま今の向きのまま、ステージに向かって座ってくださいね。
それでは、{{#woopsOn}}ウップスヤンさん、{{/woopsOn}}SPのお二人、お願いいたします。《★音響：F.O.》

※※※これ以降、競技開始の合図まで無音※※※

【選手全員：SP主導で準備体操】
（準備体操が終わったら）
【{{#woopsOn}}ウップスヤン{{/woopsOn}}{{^woopsOn}}SP{{/woopsOn}}：小さい鐘を鳴らす】※アイキャッチ
${c.bannerLines.length ? c.bannerLines.map((_, i) => `【ロールバナー：{{bannerLine${i}}}】（想定20秒ほど）`).join('\n') : '【ロールバナー】※最後の文は「〜〜〜」'}
（競技開始の合図が出たら）
【{{starter}}：競技開始ホイッスル】

はい！ただいまのホイッスルで、『{{name}}』{{duration}}分間の競技開始です！
選手の皆さんは大きく深呼吸をして、ゆっくり、ぼーっとすることに集中してください。`, music:'★BGM②：F.O.\nきっかけ「お願いいたします。」\n※これ以降、競技終了までBGMなし'});

  push(true, {at:c.compStart, stage:'【MC】ステージ中央', scene:'大会の説明\nルールの補足説明\n（通行人へ伝える意味もある）', script:
`【{{staffLead}}：おたすけカードをMCに渡す】

『ぼーっとする大会』は、韓国のアーティスト・ウップスヤンさんによって2014年に考案された大会です。
この大会は『効率や合理性を追求し、ぼーっとしている時間なんて価値が無い』という現代人に対する、いわばアンチテーゼ。
現代人が持つその偏見を打破するために、あえて「スポーツ競技」のような形の大会を作ることにしたということなんですが、
改めて、競技のルールを説明させていただきますね。

ぼーっとする{{duration}}分間。何もしないで、ぼーっとする大会ですから、歌ったり踊ったりするのはもちろん、
ちょっとスマホを確認したり、隣の人に話しかけてみたりはNGです。笑ったり、独り言を言うのもダメ。
目を少しだけ瞑るのは大丈夫ですが、そのまま寝てしまったらアウトです。時間を確認しようと腕時計を見るのもいけません。
競技中は、{{patrol}}が見回りをしています。これらの行為が確認された場合は、警告を受けたり失格となってしまう場合があります。

でも流石に同じ姿勢を{{duration}}分間保つのは大変ですので、横になったり伏せたりと、時々体勢を変えるのはOKです。
ただ、あまりに頻繁に姿勢を変えると、やはり失格の対象になってしまうのでご注意ください。

そして、この「ぼーっとする」のを助けてくれるのが、受付時に皆さまにお渡しした4種類の「おたすけカード」です。
【おたすけカードを見せながら説明】
まず1つ目は、赤いカード。{{cardRed}}
続いて、青いカード。{{cardBlue}}
続いて、黄色いカード。{{cardYellow}}
最後に、黒いカード。{{cardBlack}}
このカードをどのように活用するかも、勝敗を左右しそうですね。

【{{staffLead}}：おたすけカードをMCから回収】`});

  push(c.charOn, {at:add(c.compStart, 10), stage:'【MC】{{charName}}の近くで', scene:'{{charName}}失格退場', script:
`さて、競技開始から10分ほど経ちまして、皆さまいい感じにぼーっとする世界に入り込んできたところですかね〜

【{{charName}}：退場方向へ動き始める】

あれ、、、？！{{charName}}どうしたの〜？！ どこ行くの〜？！
どうやら、ぼーっとしすぎて、すでに競技が終了してしまったと勘違いしたようです、、、！！！
マイペースな{{charName}}は、残念ながら今回も失格となります。。。
他の出場者の皆さんは、まだまだ競技時間があるので引き続き、ぼーっとしてくださいね！`});

  push(c.guestOn, {at:add(c.compStart, 15), stage:'【ゲスト】ステージへ', scene:'ゲスト実況者：{{guestName}}登場', script:
`さて、今回はこの方と一緒に実況をしていきます！
{{guestIntro}}
{{guestName}}さんです！ どうぞ！

【{{guestName}}：ステージ in】

・ステージから競技場を見た感想
・参加経験上のアドバイス　etc.`});

  push(true, {at:add(c.compStart, c.guestOn ? 20 : 15), stage:'', scene:'随時実況', script:
`※※※以降、MCは状況を見ながら随時実況（{{staffLead}}からカンペを出す場合があります）※※※

◆ステージから競技場や選手を見た感想
◆時間の経過
{{#themeMid}}
◆大会の意義
さて、改めて今大会のテーマについてご説明します。
今年のテーマは、「{{theme}}」です。
{{themeMid}}
{{/themeMid}}
◆参加理由（投票板に移動）
さて、本日は◯組◯名の方が参加してくださっています。
投票板には、選手の皆さまに参加理由を書いていただいているとのことなので、少しそちらを読み上げていこうと思います。

◆観客による投票の途中の経過 ＆ 観客に投票の呼びかけ
・観客の皆さん！ぜひ投票をお願いします。
・ぜひ競技場の周りを動いていただき、色々な角度から選手の皆さまに注目してあげてください！
・投票パネルには、選手の皆さまの職業や参加理由が書かれています。投票の参考にしてください。
・選手の皆さまのコスチュームにも注目！衣装や小道具、ポーズなど、一人ひとり「ぼーっと」の仕方が違います。
・ご観覧の皆さまには、お一人につき{{stickers}}枚の投票シールが配られます。

◆審査基準／順位の決め方
・観客の投票数で決める「芸術点」と、{{interval}}分ごとに測る心拍数の安定度合いで決める「技術点」で競います。
・まず「芸術点」で上位{{topN}}組を選出し、その中から「技術点」の高い順に優勝、2位、3位を決めます。
・最も「ぼーっとする」というコンセプトにあっている人には「特別賞」が贈られます。

◆警告・失格が出たら
・あっと、◯番さんにイエローカードです！少し身体が動きすぎていたということで、警告が出てしまいました。
・ここで◯番さんにレッドカードです！居眠りをしてしまっていたということで、残念ですが、◯番さん、失格です！
・チームでご参加の場合、チーム内のどなたが失格となっても全員退場となってしまいますので、お気をつけください。

◆脱落者へのインタビュー
・普段のお仕事は？ ・参加理由は？ ・意外と難しかったですか？ ・参加してみて思ったことは？ etc.

◆無音タイム
では、ここで少し私も喋るのをやめ、この何もしない時間を楽しんでみたいと思います。`});

  push(true, {at:c.countdown, stage:'', scene:'あと3分', script:
`【{{staffLead}}：3分前カンペ】
さあ、時刻はまもなく{{countdown_jp}}。
{{duration}}分間の競技終了まで、あと3分です。
【MC：引き続き、会場の様子を実況】`});

  push(true, {at:c.compEnd, stage:'【MC＆{{starter}}＆SP】ステージへ戻る', scene:'カウントダウン\n競技終了', script:
`【{{staffLead}}：1分前カンペ】
さあ、競技終了まで1分を切りました。
10秒前になったら、会場の皆さまも一緒にカウントダウンをしましょう！
あ、選手の皆さまは、カウントダウンの「ゼロ」まで、ぼーっとしていてくださいね！！

【{{staffLead}}：10秒前カンペ】
それでは競技終了まで〜
10、9、8、7、6、5、4、3、2、1、ゼローーーー！！

【{{starter}}：競技終了ホイッスル】《★BGM②：F.I.》

終了で〜す！！
どうぞ身体をほぐしたり、しゃべったり、その場で自由に体動かしてください。
このあと、集計・採点のため{{tallyMin}}分ほどお時間を頂き、結果が出しだい、結果発表と表彰式を行います。
その間に、おたすけカードを回収いたします。スタッフが回収しにいきますので、お渡しください。
{{#restroom}}なお、お手洗いは自由に行っていただいて大丈夫です。{{restroom}}にございます。
{{/restroom}}表彰式は{{award_jp}}から始める予定ですので、それまでには戻ってきてくださいね。`, music:'★BGM②：F.I.\nきっかけは競技終了ホイッスル\n※煽り気味に入って、徐々に薄めに', staff:'心拍スタッフ：おたすけカードを集めて、番号順に重ねて片付ける'});

  push(c.prizeIntroOn, {at:add(c.compEnd, 2), stage:'※MC：景品を1つずつ見せながら紹介', scene:'景品紹介', script:
`では、この時間を使って、上位入賞者の皆さまに贈呈される豪華景品を紹介していきたいと思います！
【MC：景品を1つずつ見せながら話す】

{{prizeIntro}}`, staff:'※景品と机をステージに配置'});

  const afterEnd = 2 + (c.prizeIntroOn ? 4 : 0);
  c.L.sponsors.forEach((s, i) => {
    B.push({at:add(c.compEnd, afterEnd + i * 2), stage:'', scene:`協賛社紹介（${s.name}様）`, sponsor:i, script:
      (i === 0 ? 'では、この時間を使って、今大会の協賛社さまのご紹介をさせていただきます。\n\n' : '') + `${i + 1}社目は、__L_sponsors_${i}_name__様です。\n__L_sponsors_${i}_text__`});
  });

  const nSp = c.L.sponsors.length;
  push(true, {at:add(c.compEnd, afterEnd + nSp * 2), stage:'※MC：会場に降りて、選手にインタビュー', scene:'選手インタビュー', script:
`では、この時間を使って、選手の皆さまに感想をお聞きしてみましょうか！

⚫︎質問例
・職業は？年齢は？
・参加してみた感想（参加する前と、競技を終えて今の気分の違いなど）
・{{duration}}分の間、実際には何を考えていましたか？
・コスチュームのコンセプト
・今後もぼーっとしたい？ etc.`, staff:'※集計スタッフ：素早く間違いのないよう集計〜結果出し'});

  push(true, {at:c.award, stage:'【MC＆{{presenter}}＆SP】登場', scene:'表彰式\n芸術点上位{{topN}}組の発表', script:
`《★BGM③へ切替》
【MC＆SP{{#woopsOn}}＆ウップスヤン{{/woopsOn}}：登場】

皆さま、お待たせしましたー！！
集計・採点が終わり、結果が出たようです。
『{{name}}』これより、結果発表ならびに、表彰式に移ります！！
{{#woopsOn}}
まずは、大会発起人である、韓国のアーティスト・ウップスヤンさんよりご挨拶がございます。
【ウップスヤン：挨拶】
ウップスヤンさん、ありがとうございました！
{{/woopsOn}}
では、改めて簡単に審査方法、順位決定方法をおさらいします。
芸術点とは、表情や衣装など、「いかにぼーっとすることを楽しんでいたか」という基準でして、
ご観覧の皆さまに審査・投票していただきました。
そして、芸術点の上位{{topN}}組のうち、「技術点」つまり、{{duration}}分間での心拍数の数値が最も安定していた組が優勝となります。

さあ、それでは発表に参りましょう！！
まずは、ご観覧の皆さまからの投票数が多かった「芸術点」上位{{topN}}組の発表です！
ゼッケン番号が呼ばれた方はその場でご起立ください。
【MC：{{topN}}組を読み上げる】

以上が、芸術点の上位{{topN}}組です！ 皆さま拍手をお願いいたします！！
それでは、この中から、心拍数の安定度である「技術点」を加えて3位、2位、そして優勝が決定します。
では、発表にまいりましょう。《★BGM③：F.O.》`, music:'★BGM②▷BGM③へ切替\n演者登場時は煽り\n→その後は薄めでキープ'});

  push(true, {at:add(c.award, 5), stage:'【受賞者】登壇', scene:'3位の発表', script:'まずは、第3位の発表です。\n' + AWARD_STEP(3, '第3位', 'p3From', 'p3Item'), music:AWARD_MUSIC('第3位')});
  push(true, {at:add(c.award, 7), stage:'【受賞者】登壇', scene:'2位の発表', script:'続いて、第2位の発表です。《★BGM③：F.O.》\n' + AWARD_STEP(2, '第2位', 'p2From', 'p2Item'), music:AWARD_MUSIC('第2位')});
  push(true, {at:add(c.award, 9), stage:'【受賞者】登壇', scene:'特別賞の発表', script:
`いよいよ、第1位の発表！！！と行きたいところなのですが、、、
ここで、特別賞を発表します。
{{#charOn}}
ということで、またあのキャラクターに登場してもらいましょう！
{{charName}}〜！ おいで〜！！
【{{charName}}：登場】
さっきは ぼーっとするの頑張ってたね〜。何もしない時間を過ごすのも楽しかったかな？
【{{charName}}：うなずく】
{{/charOn}}
この特別賞は、競技中のぼーっとした表情やコスチュームなど、
最もぼーっとするというコンセプトを表現できていた1組に贈られます。

それでは発表します。《★BGM③：F.O.》
` + AWARD_STEP(0, '特別賞', 'spFrom', 'spItem'), music:AWARD_MUSIC('特別賞')});
  push(true, {at:add(c.award, 11), stage:'【受賞者】登壇', scene:'優勝者の発表\nインタビュー', script:
`ということで、いよいよ映えある第1位、優勝者を発表します。
それでは、優勝者の発表です。《★BGM③：F.O.》
` + AWARD_STEP(1, '優勝', 'winFrom', 'winItem', 'そして、優勝トロフィーも授与されます！\n【{{presenter}}：トロフィー授与】\n\n') + `

改めまして、上位入賞者の皆さま、
そして{{duration}}分間ぼーっとし続けた選手の皆さまに大きな拍手をお願いいたします！`, music:'★BGM③：F.O.\n★長めのドラムロール：C.I.\nきっかけ「優勝は、、、」\n★BGM③：C.I.\n★BGM③：煽り▷F.O.\nきっかけ「大きな拍手をお願いいたします！」'});

  push(true, {at:add(c.award, 13), stage:'', scene:'集合写真', script:
`《★BGM②：F.I.》
さあ最後に、選手の皆さま全員で集合写真を撮りたいと思います！
皆さまご起立ください！
それでは全員ステージへお越しいただいて、お並びください！
上位3組と特別賞の皆さまは、一番前の列にお願いします！
人数が多いので、ゆっくり慌てずで大丈夫です。
細かい調整はカメラマンの方が指示してくださるので、まずは皆さまステージにお上がりくださいね。`, music:'★BGM②：F.I.\n※この前のBGM③F.O.からシームレスに移行', staff:'公式カメラマン：集合写真を撮れるように並び方や横幅を調整'});

  push(true, {at:add(c.award, 16), stage:'', scene:'ヨガマットへ戻る案内', script:
`（集合写真を撮り終えたら）
このあと、閉会のアナウンスをさせていただきますので、
選手の皆さまは一度ご自分のヨガマットへお戻りください。
移動は慌てずで大丈夫ですので、ご自分のヨガマットへお座りください。`, staff:'当日スタッフ：選手全員がバラバラに競技場外に出ないように、受付へと誘導'});

  push(true, {at:add(c.award, 17), stage:'', scene:'締めの挨拶', script:
`（選手全員がヨガマットに座ったら）
ということで、『{{name}}』以上をもちまして終了となります！

このあとは、混雑緩和のため規制退場という形を取らせていただきます。
スタッフが番号の若い順に誘導いたしますので、皆さまのご協力をお願いいたします。
なお、退場の際に、受付にてゼッケンの回収とお荷物の返却を行いますので、必ず受付にお並びください。

今大会の様子は、『ぼーっとする大会』公式SNSにて随時投稿予定です。
自分はどんな姿でぼーっとしていたのか、他の選手の皆さまはどんな表情だったのか、ぜひチェックしてみてください！
{{#nextEvent}}
{{nextEvent}}
{{/nextEvent}}
{{closingMsg}}

{{season}}
どうか、お忙しい毎日の中でも、自分に目を向け、自分を大切にすることを忘れないでくださいね。
たまにはその手を止めて、一息ついてぼーっとする。
そんな時間を大事に、心も身体も健康に過ごされることをお祈りしつつ、大会の終了とさせていただきます。
本日はご参加、ご観覧、誠にありがとうございました！《★BGM②：煽り▷F.O.》`, music:'★BGM②：煽り▷F.O.\nきっかけ「誠にありがとうございました！」', staff:'※ゼッケンを回収→荷物を返却というフローを正確に行う'});

  push(true, {at:c.closeTime, stage:'', scene:'退場案内', script:
`【スタッフ：若い番号順に退場を案内・受付へと誘導】
【スタッフ：受賞者はステージへ誘導 ※メディア撮影がある想定】`});

  B.sort((a, b) => (toMin(a.at) ?? 0) - (toMin(b.at) ?? 0));
  B.forEach((b, i) => {
    const next = B[i + 1];
    b.lap = next && toMin(next.at) != null && toMin(b.at) != null ? Math.max(0, toMin(next.at) - toMin(b.at)) : '';
  });
  return B;
}

function rough(c){
  const R = [];
  const push = (when, time, scene, detail = '', note = '') => { if (when) R.push({time, scene, detail, note}); };
  push(true, `${c.loadIn}〜`, (c.license ? '運営メンバー入り' : 'VISメンバー入り') + '\n→搬入', '搬入、荷下ろし、設営備品の展開');
  push(true, c.staffIn, '当日スタッフ入り\n→' + (c.license ? '全体挨拶・役割説明' : '設営開始'), c.license ? '全員で集まり、全体挨拶と割り振りの確認\n各役割のやることを説明\n└このあとの段取りの確認\n└脈計測のやり方のレクチャー\n└各自着替え' : '◎担当：{{staffSetup}}\n段取りの説明\n会場設営（ステージ優先）');
  push(c.license, c.staffIn, '設営', '◎担当：{{staffSetup}}\n当日スタッフと連携し、全体の設営を進める');
  push(true, c.castIn, 'MC・SP' + (c.woopsOn ? '・ウップスヤンさん' : '') + '入り', '演者同士での挨拶\n口頭での流れのすり合わせ・確認');
  push(true, `${c.rehearsal}〜`, 'リハーサル', '◎担当：{{staffLead}}\n演者さん＆音響さんと連携し、各シーンのリハを行う\n└音量の確認、音量調整の確認\n└開会前のアナウンスについて\n└開会式の流れ確認、通してやる\n└競技中のアナウンスについて\n└表彰式の流れ確認、通してやる');
  push(c.experienceOn, `${c.taikenStart}〜${c.taikenEnd}`, 'ぼーっと体験会', '◎担当：当日スタッフで割り振り\nぼーっと体験会の運営\n└呼び込み\n└受付・誘導\n└心拍計測\n└時間管理', '※運営スタッフは随時休憩');
  push(true, c.announceStart, 'アナウンス開始', 'イベントの案内や呼び込みのアナウンスを適宜入れていく' + (c.charOn ? '\n※{{charName}}登場' : ''));
  push(true, `${c.receptionStart}〜${c.receptionEnd}`, '事前登録者の受付' + (c.lotteryOn && !c.sameDayLater ? '\n当日エントリーの受付' : ''), '◎受付開始\nリスト確認〜ゼッケン等配布〜心拍チェック〜待機誘導');
  push(c.sameDayLater, `${c.sameDayStart}〜${c.receptionEnd}`, '当日エントリーの受付', '', '＊競技場の状況見てアナウンス');
  push(c.lotteryOn, c.lottery, '当日エントリーの抽選発表');
  push(c.lotteryOn, c.sameDayDeadline, '当日参加者の受付終了');
  push(true, c.opening, '開会式', '◎開会式 準備体操', '＊審査員動きサポート\n＊心拍数計測\n＊面白い参加者⇔パネル（参加動機）チェック\n＊投票呼びかけ\n＊脱落者インタビュー');
  push(true, c.compStart, '競技開始', '◎競技開始 ホイッスル\n・競技中：MC 随時実況、脱落者インタビュー、参加理由読み上げ、投票呼びかけetc.');
  push(true, c.compEnd, '競技終了〜審査', '投票集計、審査');
  push(true, c.award, '表彰式、集合写真撮影');
  push(true, c.closeTime, '閉会宣言、大会終了');
  push(true, `${c.closeTime}〜`, '退場促し、片付け、搬出作業、撤収', '様子見て、バラシ開始 〜 撤収・積み込み\n完全撤退', '＊通行人接触注意');
  return R;
}

window.EVENT = {
  key:'taikai', title:'ぼーっとする大会', unit:'大会',
  intro:'毎回入れている定型の台詞はそのままに、日時・会場・テーマ・スポンサーなど変わる部分だけを入力して台本を作ります。',
  modes:{
    own:{label:'自社主催', desc:'TOKYO大会のようにVISが主催する大会。第4回TOKYO大会の内容が入った状態で始まります。', defaults:BASE, created:'第4回TOKYO大会の内容で台本を作りました'},
    license:{label:'ライセンスアウト', desc:'企業・施設が主催する特別版の大会。テレビ朝日・イオンの台本をもとに、○○の部分を埋めていきます。', defaults:{...BASE, ...LICENSE}, created:'ライセンスアウトの台本を作りました。○○の部分を埋めてください'},
  },
  SECTIONS, computed, blocks, rough,
  openSections:['basic','options','time'],
  head:'{{dateLabel}}　＠{{facility}}　{{venue}}',
  alias:{compEnd:'duration', countdown:'duration', closeTime:'award', lotteryGather:'lottery', dateLabel:'date', tallyMin:'award', patrol:'woopsOn', bannerLine:'bannerText'},
  cols:[
    {k:'at', label:'TIME', w:'56px', raw:true},
    {k:'lap', label:'LAP', w:'40px', raw:true},
    {k:'stage', label:'STAGE', w:'15%', pw:'11%', role:'speaker'},
    {k:'scene', label:'SCENE', w:'13%', pw:'10%', cls:'scene', role:'title'},
    {k:'script', label:'SCRIPT', cls:'script', main:true, role:'line'},
    {k:'music', label:'MUSIC', w:'15%', pw:'12%', role:'sound'},
    {k:'staff', label:'STAFF', w:'12%', pw:'9%', role:'note'},
  ],
  roughCols:[
    {k:'time', label:'TIME', w:'110px', raw:true},
    {k:'scene', label:'SCENE', w:'22%'},
    {k:'detail', label:'詳細'},
    {k:'note', label:'備考', w:'22%'},
  ],
  editorVenue:'{{facility}} {{venue}}',
  editorType:b => /協賛|スポンサー|実演/.test(b.scene) ? 'talk' : /発表|表彰|写真|登場|退場/.test(b.scene) ? 'show' : /【MC】/.test(b.stage) ? 'mc' : 'progress',
};
})();
