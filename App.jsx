import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KEHAI_NAMES = [
  '深夜の人',
  '雨の日の人',
  '牛乳の人',
  'ベランダの人',
  'ぬるいお茶の人',
  '3階の人'
];

const UTOUTO_PLACEHOLDERS = [
  'いま思い浮かんだこと',
  '眠くても残したいこと',
  '忘れてもいいこと'
];

const FUZZZY_TONES = [
  [
    '深夜',
    'まどろみ',
    '少し不思議',
    'やさしいけど少しさみしい',
    'ミントグリーンの光'
  ],
  [
    '閉店後のマーケット',
    '売れ残った夢',
    '眠たいポップソング',
    '少しチープ',
    'でも妙に泣ける'
  ],
  [
    'コンビニの明かり',
    '匿名の気配',
    '忘れてもいい記憶',
    '小さな孤独',
    'ゆっくり光る夜'
  ],
  [
    'バイト終わり',
    'バックヤード',
    '変な商品棚',
    '眠気の中のユーモア',
    'ちょっとへんでかわいい'
  ],
  [
    '夢の在庫処分',
    'レシートの裏',
    '午前2時',
    'ふたりだけの店内放送',
    'ぼんやりした希望'
  ],
  [
    '夜だけ開く売り場',
    '誰にも買われない月',
    '眠気のバーコード',
    'まどろみのBGM',
    '朝まで残った光'
  ]
];

const getPostDayKey = () => {
  const date = new Date();

  if (date.getHours() < 23) {
    date.setDate(date.getDate() - 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const pickRandomItems = (items, count) => {
  const copied = [...items];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied.slice(0, count);
};

const buildSongPrompt = (phrases, tones) => {
  const fallbackPhrases = [
    '忘れてもいいこと',
    '眠くても残したいこと',
    'まだ少し起きてる',
    '夜の棚にあるもの',
    '誰かの小さな気配'
  ];

  const sourcePhrases = phrases.length > 0 ? phrases : fallbackPhrases;

  return `以下の短いフレーズを素材にして、
FUZZZY MARKETという架空の夜のマーケットに合う歌詞、または曲のアイデアを作ってください。

今回のトーン：
${tones.map((tone) => `・${tone}`).join('\n')}

使ううとうと：
${sourcePhrases.map((phrase) => `・${phrase}`).join('\n')}

条件：
・日本語で作ってください
・タイトルをつけてください
・歌詞として読める形にしてください
・短めの曲として成立する構成にしてください
・素材のフレーズはそのまま使っても、少し変えてもOKです
・深夜、まどろみ、眠る前の気配を感じる雰囲気にしてください
・説明ではなく、作品として出力してください`;
};

export default function ZzzApp() {
  const [page, setPage] = useState('timeline');
  const [timeline, setTimeline] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [utouto, setUtouto] = useState('');
  const [hasPosted, setHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zzzedPostIds, setZzzedPostIds] = useState([]);
  const [showNegotoModal, setShowNegotoModal] = useState(false);
  const [closeMessage, setCloseMessage] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [songPrompt, setSongPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSources, setPromptSources] = useState([]);
  const [promptTones, setPromptTones] = useState([]);

  const [utoutoPlaceholder] = useState(() => {
    return UTOUTO_PLACEHOLDERS[
      Math.floor(Math.random() * UTOUTO_PLACEHOLDERS.length)
    ];
  });

  const [currentUser] = useState(() => {
    const savedName = localStorage.getItem('zzz-current-user');
    if (savedName) return savedName;

    const newName = KEHAI_NAMES[Math.floor(Math.random() * KEHAI_NAMES.length)];
    localStorage.setItem('zzz-current-user', newName);
    return newName;
  });

  const [userId] = useState(() => {
    const savedUserId = localStorage.getItem('zzz-user-id');
    if (savedUserId) return savedUserId;

    const newUserId = crypto.randomUUID();
    localStorage.setItem('zzz-user-id', newUserId);
    return newUserId;
  });

  useEffect(() => {
    fetchPosts();

    const postedDate = localStorage.getItem('zzz-posted-date');
    const currentPostDay = getPostDayKey();

    if (postedDate === currentPostDay) {
      setHasPosted(true);
    }

    const savedZzzedPostIds = localStorage.getItem('zzz-zzzed-post-ids');

    if (savedZzzedPostIds) {
      setZzzedPostIds(JSON.parse(savedZzzedPostIds));
    }
  }, []);

  const fetchPosts = async () => {
    setLoading(true);

    await supabase.rpc('hide_expired_posts');

    const { data: timelineData, error: timelineError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (timelineError) {
      console.error(timelineError);
      setLoading(false);
      return;
    }

    const { data: myPostsData, error: myPostsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (myPostsError) {
      console.error(myPostsError);
      setLoading(false);
      return;
    }

    setTimeline(timelineData || []);
    setMyPosts(myPostsData || []);
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!utouto.trim() || utouto.length > 17 || hasPosted) return;

    const { error } = await supabase.from('posts').insert({
      name: currentUser,
      text: utouto,
      user_id: userId,
      is_hidden: false
    });

    if (error) {
      console.error(error);
      alert('投稿に失敗しました。少し時間をおいて試してください。');
      return;
    }

    setUtouto('');
    setHasPosted(true);
    localStorage.setItem('zzz-posted-date', getPostDayKey());

    fetchPosts();
  };

  const handleZzz = async (postId) => {
    if (zzzedPostIds.includes(postId)) return;

    const { error } = await supabase.rpc('increment_zzz', {
      p_post_id: postId
    });

    if (error) {
      console.error(error);
      alert('zに失敗しました。少し時間をおいて試してください。');
      return;
    }

    const updatedZzzedPostIds = [...zzzedPostIds, postId];

    setZzzedPostIds(updatedZzzedPostIds);
    localStorage.setItem('zzz-zzzed-post-ids', JSON.stringify(updatedZzzedPostIds));

    fetchPosts();
  };

  const handleDeletePost = async (postId) => {
    const ok = window.confirm('このうとうとを消しますか？');

    if (!ok) return;

    const { error } = await supabase.rpc('delete_my_post', {
      p_post_id: postId,
      p_user_id: userId
    });

    if (error) {
      console.error(error);
      alert('削除に失敗しました。少し時間をおいて試してください。');
      return;
    }

    setTimeline((posts) => posts.filter((post) => post.id !== postId));
    setMyPosts((posts) => posts.filter((post) => post.id !== postId));

    fetchPosts();
  };

  const handleShare = async () => {
    const shareUrl = 'https://zzz-app-gray.vercel.app';

    const shareData = {
      title: 'ZZZ｜眠る前の小さなひとこと',
      text: '眠る前の小さなひとことを置いていく場所。',
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error(error);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('ZZZのURLをコピーしました。');
    } catch (error) {
      console.error(error);
      window.prompt('このURLをコピーしてください', shareUrl);
    }
  };

  const handleGeneratePrompt = async () => {
    setShowPromptModal(true);
    setPromptLoading(true);
    setSongPrompt('');
    setPromptSources([]);
    setPromptTones([]);

    const { data, error } = await supabase
      .from('posts')
      .select('text, is_hidden, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      setSongPrompt('うまく曲の種を拾えませんでした。\n少し時間をおいて、もう一度ためしてください。');
      setPromptLoading(false);
      return;
    }

    const posts = (data || []).filter((post) => post.text && post.text.trim());
    const pickedPosts = pickRandomItems(posts, Math.min(posts.length, 7));
    const pickedPhrases = pickedPosts.map((post) => post.text.trim());
    const pickedTones = FUZZZY_TONES[
      Math.floor(Math.random() * FUZZZY_TONES.length)
    ];

    setPromptSources(pickedPhrases);
    setPromptTones(pickedTones);
    setSongPrompt(buildSongPrompt(pickedPhrases, pickedTones));
    setPromptLoading(false);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(songPrompt);
      alert('曲の種をコピーしました。');
    } catch (error) {
      console.error(error);
      window.prompt('この曲の種をコピーしてください', songPrompt);
    }
  };

  const handleSleepClose = () => {
    setCloseMessage('');

    window.open('', '_self');
    window.close();

    setTimeout(() => {
      setCloseMessage('このままブラウザを閉じて、おやすみなさい。');
    }, 300);
  };

  const PageButton = ({ value, children }) => (
    <button
      type="button"
      onClick={() => setPage(value)}
      className={`rounded-full border px-3 py-2 text-[11px] tracking-widest transition-all ${
        page === value
          ? 'border-[#D9C7FF] bg-[#EBDFFF]/15 text-[#F7F0FF] shadow-[0_0_18px_rgba(217,199,255,0.35)]'
          : 'border-[#4C5678] bg-[#10162A]/70 text-[#96A2C8] hover:border-[#A9D6FF] hover:text-[#DDEEFF]'
      }`}
    >
      {children}
    </button>
  );

  const PostCard = ({ post, mine = false }) => {
    const alreadyZzzed = zzzedPostIds.includes(post.id);
    const zzzCount = post.zzz_count || 0;
    const zDisplay = 'z'.repeat(Math.min(zzzCount, 3));

    return (
      <article
        className={`relative overflow-hidden rounded-3xl border px-6 py-6 text-center backdrop-blur-md transition-all ${
          post.is_hidden
            ? 'border-[#5D5475] bg-[#141426]/70 opacity-75'
            : 'border-[#61709C]/70 bg-[#11182E]/75 shadow-[0_0_30px_rgba(127,157,255,0.12)]'
        }`}
      >
        <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full bg-[#BFD7FF]/10 blur-2xl" />

        <p className="relative text-xl leading-9 tracking-[0.18em] text-[#F1F6FF] drop-shadow-[0_0_10px_rgba(191,215,255,0.35)]">
          {post.text}
        </p>

        {zDisplay && (
          <p className="mt-4 text-lg tracking-[0.35em] text-[#D9C7FF] drop-shadow-[0_0_12px_rgba(217,199,255,0.5)]">
            {zDisplay}
          </p>
        )}

        {mine && post.is_hidden && (
          <p className="mt-4 text-[10px] tracking-widest text-[#D9C7FF]">
            まどろみから、しずかに消えました
          </p>
        )}

        {mine && !post.is_hidden && zzzCount >= 3 && (
          <p className="mt-4 text-[10px] tracking-widest text-[#FFF0A8]">
            まどろみに、残りました
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[11px] tracking-widest text-[#8FA0C8]">
          {!mine && <span>{post.name}</span>}

          {mine && (
            <span>
              {new Date(post.created_at).toLocaleDateString('ja-JP')}
            </span>
          )}
        </div>

        {!mine && (
          <button
            type="button"
            onClick={() => handleZzz(post.id)}
            disabled={alreadyZzzed}
            className={`mt-5 rounded-full border px-5 py-2 text-xs tracking-widest transition-all ${
              alreadyZzzed
                ? 'border-[#4C5678] text-[#637091] opacity-60'
                : 'border-[#D9C7FF] bg-[#D9C7FF]/10 text-[#F4EEFF] hover:bg-[#D9C7FF]/20 hover:shadow-[0_0_18px_rgba(217,199,255,0.4)]'
            }`}
          >
            z
          </button>
        )}

        {mine && (
          <button
            type="button"
            onClick={() => handleDeletePost(post.id)}
            className="mt-5 rounded-full border border-[#6B5A80] px-4 py-2 text-[11px] tracking-widest text-[#CDBFE8] hover:border-[#D9C7FF] hover:text-[#F7F0FF]"
          >
            けす
          </button>
        )}
      </article>
    );
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden px-5 py-10 text-[#EEF4FF] antialiased"
      style={{
        fontFamily: "'DotGothic16', monospace",
        background:
          'radial-gradient(circle at top, #273154 0%, #12182D 38%, #070A13 100%)'
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(190,220,255,0.16),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(225,200,255,0.12),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(255,240,168,0.08),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] bg-[linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[length:100%_5px]" />

      <div className="pointer-events-none fixed left-8 top-24 text-[#D9C7FF]/20 text-5xl blur-[1px]">
        z
      </div>
      <div className="pointer-events-none fixed right-10 top-52 text-[#A9D6FF]/20 text-4xl blur-[1px]">
        z
      </div>
      <div className="pointer-events-none fixed bottom-28 left-12 text-[#FFF0A8]/20 text-3xl blur-[1px]">
        z
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
        <header className="mb-10 w-full text-center">
          <div className="rounded-[2rem] border border-[#7180AE]/70 bg-[#10162A]/70 px-6 py-8 shadow-[0_0_45px_rgba(120,150,255,0.18)] backdrop-blur-md">
            <p className="mb-4 text-[10px] tracking-[0.5em] text-[#FFF0A8]">
              MIDNIGHT ZONE
            </p>

            <h1 className="text-6xl tracking-[0.25em] text-[#F7F0FF] drop-shadow-[0_0_18px_rgba(217,199,255,0.75)]">
              ZZZ
            </h1>

            <div className="mt-7 space-y-2 text-xs leading-7 tracking-wider text-[#BED0F8]">
              <p>眠る前に小さなひとことを</p>
              <p>1日1回、17文字以内の「うとうと」</p>
              <p>誰かのうとうとには z を送れます</p>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-3 gap-2">
            <PageButton value="timeline">まどろみ</PageButton>
            <PageButton value="mine">わたし</PageButton>
            <PageButton value="about">zzzについて</PageButton>
          </nav>
        </header>

        <main className="w-full space-y-10">
          {page === 'timeline' && (
            <>
              <section className="rounded-[2rem] border border-[#4C5678] bg-[#10162A]/70 p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-md">
                {!hasPosted ? (
                  <form onSubmit={handlePost} className="space-y-4">
                    <input
                      type="text"
                      value={utouto}
                      onChange={(e) => setUtouto(e.target.value.slice(0, 17))}
                      placeholder={utoutoPlaceholder}
                      className="w-full rounded-full border border-[#7180AE] bg-[#080D1A]/80 px-5 py-4 text-center text-sm tracking-wider text-[#F4F7FF] outline-none placeholder:text-[#66759D] focus:border-[#D9C7FF] focus:shadow-[0_0_18px_rgba(217,199,255,0.25)]"
                    />

                    <div className="flex items-center justify-between px-2 text-xs tracking-widest text-[#8FA0C8]">
                      <span>{utouto.length} / 17</span>
                      <button
                        type="submit"
                        disabled={!utouto.trim()}
                        className="rounded-full border border-[#D9C7FF] bg-[#D9C7FF]/10 px-5 py-2 text-[#F4EEFF] transition-all hover:bg-[#D9C7FF]/20 disabled:opacity-30"
                      >
                        おくる
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-xs tracking-widest text-[#FFF0A8]">
                      きょうの うとうと は、もうおわりました。
                    </p>
                    <p className="text-[11px] tracking-widest text-[#8FA0C8]">
                      あなたの気配：{currentUser}
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-5">
                <h2 className="text-center text-xs tracking-[0.45em] text-[#D9C7FF] drop-shadow-[0_0_10px_rgba(217,199,255,0.5)]">
                  まどろみ
                </h2>

                {loading ? (
                  <p className="text-center text-xs tracking-widest text-[#8FA0C8]">
                    よみこみ中...
                  </p>
                ) : timeline.length === 0 ? (
                  <p className="text-center text-xs leading-7 tracking-widest text-[#8FA0C8]">
                    いま見える、まどろみはありません。
                  </p>
                ) : (
                  <div className="space-y-5">
                    {timeline.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {page === 'mine' && (
            <section className="space-y-5">
              <h2 className="text-center text-xs tracking-[0.45em] text-[#D9C7FF] drop-shadow-[0_0_10px_rgba(217,199,255,0.5)]">
                わたしのうとうと
              </h2>

              {myPosts.length === 0 ? (
                <div className="rounded-[2rem] border border-[#4C5678] bg-[#10162A]/70 p-8 text-center backdrop-blur-md">
                  <p className="text-xs tracking-widest text-[#8FA0C8]">
                    まだ、うとうとはありません。
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {myPosts.map((post) => (
                    <PostCard key={post.id} post={post} mine />
                  ))}
                </div>
              )}
            </section>
          )}

          {page === 'about' && (
            <section className="space-y-5">
              <h2 className="text-center text-xs tracking-[0.45em] text-[#D9C7FF] drop-shadow-[0_0_10px_rgba(217,199,255,0.5)]">
                zzzについて
              </h2>

              <div className="space-y-6 rounded-[2rem] border border-[#4C5678] bg-[#10162A]/70 p-6 text-xs leading-7 tracking-wider text-[#BED0F8] shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-md">
                <div>
                  <h3 className="mb-2 text-sm tracking-widest text-[#FFF0A8]">
                    ZZZは、眠る前に集まる空間です
                  </h3>
                  <p>
                    眠る前に浮かんだ小さなひとことを、
                    匿名の気配として置いていくことができます。
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm tracking-widest text-[#FFF0A8]">
                    うとうとは、1日1回だけ
                  </h3>
                  <p>
                    投稿できるのは1日1回、17文字まで。23時にリセットされます。
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm tracking-widest text-[#FFF0A8]">
                    zは、小さな合図です
                  </h3>
                  <p>
                    誰かの投稿に言葉で返すことはできません。
                    そのかわりに z を送れます。
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm tracking-widest text-[#FFF0A8]">
                    7時間以内にzzzで残ります
                  </h3>
                  <p>
                    投稿から7時間以内に z が3つ届くと、
                    その投稿は「まどろみ」に残ります。
                    届かなかった投稿は、みんなの画面から静かに消えます。
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm tracking-widest text-[#FFF0A8]">
                    消えても、自分だけは見返せます
                  </h3>
                  <p>
                    まどろみから消えた投稿も、
                    投稿した本人の「わたし」ページには残ります。
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="mt-20 w-full text-center space-y-4">
          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-full border border-[#4C5678] bg-[#10162A]/70 px-4 py-3 text-[11px] tracking-widest text-[#96A2C8] transition-all hover:border-[#D9C7FF] hover:text-[#F7F0FF] hover:shadow-[0_0_18px_rgba(217,199,255,0.25)]"
          >
            zzzを共有する
          </button>

          <button
            type="button"
            onClick={handleGeneratePrompt}
            className="w-full rounded-full border border-[#D9C7FF]/70 bg-[#EBDFFF]/10 px-4 py-3 text-[11px] tracking-widest text-[#F7F0FF] transition-all hover:border-[#FFF0A8] hover:text-[#FFF0A8] hover:shadow-[0_0_18px_rgba(217,199,255,0.3)]"
          >
            ZZZからあなたへ
          </button>

          <button
            type="button"
            onClick={() => {
              setCloseMessage('');
              setShowNegotoModal(true);
            }}
            className="w-full rounded-full border border-[#6B5A80] bg-[#141426]/70 px-4 py-3 text-[11px] tracking-widest text-[#CDBFE8] transition-all hover:border-[#FFF0A8] hover:text-[#FFF0A8] hover:shadow-[0_0_18px_rgba(255,240,168,0.18)]"
          >
            ねごとをいう
          </button>

          <div className="pt-1 space-y-2">
            <p className="text-[10px] tracking-[0.35em] text-[#66759D]">
              ただ、そこにいるだけ
            </p>

            <p className="text-[10px] tracking-[0.25em] text-[#4F5B7D]">
              Supported by FUZZZY MARKET
            </p>
          </div>
        </footer>
      </div>

      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#DCEFEA]/90 px-5 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-[2rem] border-4 border-[#2B8BAA] bg-[#DCEFEA] px-6 py-7 text-center shadow-[10px_10px_0_rgba(43,139,170,0.35)]">
            <p className="mb-3 text-xs tracking-[0.32em] text-[#6B5487]">
              ZZZからあなたへ
            </p>

            <p className="mb-5 text-xs leading-6 tracking-wider text-[#5F4B7A]">
              ZZZが、みんなのうとうとを少しだけ拾って、
              <br />
              あなたに曲の種を渡します。
              <br />
              好きなAIに貼って、歌や歌詞にしてください。
            </p>

            {promptLoading ? (
              <p className="py-8 text-xs tracking-widest text-[#2B8BAA]">
                曲の種を集めています...
              </p>
            ) : (
              <>
                {promptTones.length > 0 && (
                  <div className="mb-5 rounded-3xl border-4 border-[#9CCC72] bg-[#F3FFFC]/70 px-4 py-4 text-left shadow-[5px_5px_0_rgba(156,204,114,0.35)]">
                    <p className="mb-3 text-[10px] tracking-widest text-[#2B8BAA]">
                      今回のトーン
                    </p>

                    <div className="space-y-2">
                      {promptTones.map((tone, index) => (
                        <p
                          key={`${tone}-${index}`}
                          className="text-[11px] leading-5 tracking-wider text-[#6B5487]"
                        >
                          ・{tone}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border-4 border-[#2B8BAA] bg-[#F3FFFC]/80 px-5 py-5 shadow-[6px_6px_0_rgba(43,139,170,0.25)]">
                  <pre className="whitespace-pre-wrap text-left text-sm leading-8 tracking-wider text-[#5F4B7A]">
                    {songPrompt}
                  </pre>
                </div>

                {promptSources.length > 0 && (
                  <div className="mt-6 rounded-3xl border-4 border-[#9CCC72] bg-[#F3FFFC]/70 px-4 py-4 text-left shadow-[5px_5px_0_rgba(156,204,114,0.35)]">
                    <p className="mb-3 text-[10px] tracking-widest text-[#2B8BAA]">
                      使われたうとうと
                    </p>

                    <div className="space-y-2">
                      {promptSources.map((source, index) => (
                        <p
                          key={`${source}-${index}`}
                          className="text-[11px] leading-5 tracking-wider text-[#6B5487]"
                        >
                          ・{source}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCopyPrompt}
                disabled={!songPrompt}
                className="w-full rounded-full border-4 border-[#2B8BAA] bg-[#9CCC72] px-4 py-3 text-[11px] tracking-widest text-[#2B4D5C] shadow-[4px_4px_0_rgba(43,139,170,0.35)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(43,139,170,0.35)] disabled:opacity-40"
              >
                コピーする
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  className="rounded-full border-4 border-[#2B8BAA] bg-[#F3FFFC]/80 px-4 py-3 text-[11px] tracking-widest text-[#2B4D5C] shadow-[4px_4px_0_rgba(43,139,170,0.25)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(43,139,170,0.25)]"
                >
                  もう一度
                </button>

                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  className="rounded-full border-4 border-[#6B5487] bg-[#E8D3E8] px-4 py-3 text-[11px] tracking-widest text-[#6B5487] shadow-[4px_4px_0_rgba(107,84,135,0.25)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(107,84,135,0.25)]"
                >
                  とじる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNegotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050711]/80 px-5 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[2rem] border border-[#D9C7FF]/70 bg-[#10162A]/95 px-7 py-8 text-center shadow-[0_0_50px_rgba(217,199,255,0.25)]">
            <p className="mb-6 text-xs tracking-[0.4em] text-[#FFF0A8]">
              NEGOTO
            </p>

            <p className="text-lg leading-9 tracking-widest text-[#F7F0FF] drop-shadow-[0_0_14px_rgba(217,199,255,0.5)]">
              では、<br />
              おやすみなさい。
            </p>

            <button
              type="button"
              onClick={handleSleepClose}
              className="mt-8 rounded-full border border-[#D9C7FF] bg-[#D9C7FF]/10 px-8 py-3 text-sm tracking-[0.35em] text-[#F4EEFF] transition-all hover:bg-[#D9C7FF]/20 hover:shadow-[0_0_18px_rgba(217,199,255,0.35)]"
            >
              zzz
            </button>

            {closeMessage && (
              <p className="mt-5 text-[11px] leading-6 tracking-wider text-[#8FA0C8]">
                {closeMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowNegotoModal(false)}
              className="mt-5 text-[10px] tracking-widest text-[#66759D] hover:text-[#BED0F8]"
            >
              まだ起きてる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
