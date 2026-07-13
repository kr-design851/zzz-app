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

export default function ZzzApp() {
  const [page, setPage] = useState('timeline');
  const [timeline, setTimeline] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [utouto, setUtouto] = useState('');
  const [hasPosted, setHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zzzedPostIds, setZzzedPostIds] = useState([]);

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
    const today = new Date().toDateString();

    if (postedDate === today) {
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
    if (!utouto.trim() || utouto.length > 15 || hasPosted) return;

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
    localStorage.setItem('zzz-posted-date', new Date().toDateString());

    fetchPosts();
  };

  const handleZzz = async (postId) => {
    if (zzzedPostIds.includes(postId)) return;

    const { error } = await supabase.rpc('increment_zzz', {
      p_post_id: postId
    });

    if (error) {
      console.error(error);
      alert('zzzに失敗しました。少し時間をおいて試してください。');
      return;
    }

    const updatedZzzedPostIds = [...zzzedPostIds, postId];

    setZzzedPostIds(updatedZzzedPostIds);
    localStorage.setItem('zzz-zzzed-post-ids', JSON.stringify(updatedZzzedPostIds));

    setTimeline((posts) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, zzz_count: (post.zzz_count || 0) + 1 }
          : post
      )
    );

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

  return (
    <div
      className="min-h-screen text-[#E8F8FF] antialiased flex flex-col items-center justify-start px-5 py-10 selection:bg-[#FF4FD8] selection:text-[#07111F] overflow-hidden relative"
      style={{
        fontFamily: "'DotGothic16', monospace",
        background:
          'radial-gradient(circle at top, #263A5F 0%, #111827 35%, #080B14 100%)'
      }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] bg-[linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[length:100%_4px]" />

      <div className="pointer-events-none fixed top-10 left-6 w-28 h-28 rounded-full bg-[#00E5FF] blur-3xl opacity-20" />
      <div className="pointer-events-none fixed bottom-20 right-8 w-36 h-36 rounded-full bg-[#FF4FD8] blur-3xl opacity-20" />

      <header className="relative z-10 mb-12 text-center w-full max-w-md">
        <div className="border-2 border-[#00E5FF] bg-[#101827]/80 shadow-[0_0_24px_rgba(0,229,255,0.45)] px-6 py-7">
          <p className="text-[10px] tracking-[0.45em] text-[#FFED70] mb-3">
            MIDNIGHT CONVENIENCE
          </p>

          <h1 className="text-5xl tracking-[0.2em] text-[#E8F8FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.9)]">
            ZZZ
          </h1>

          <div className="mt-6 text-xs leading-7 text-[#BDEFFF] tracking-wider">
            <p>眠る前の小さなひとことを</p>
            <p>匿名の気配として置いていく場所。</p>
            <p>1日1回、15文字以内の「うとうと」。</p>
            <p>7時間以内に zzz が3つ届くと、まどろみに残ります。</p>
          </div>
        </div>

        <nav className="mt-6 grid grid-cols-3 gap-2 text-xs tracking-widest">
          <button
            type="button"
            onClick={() => setPage('timeline')}
            className={`border-2 px-2 py-3 transition-all ${
              page === 'timeline'
                ? 'border-[#FF4FD8] text-[#FFB8EF] bg-[#2B1230] shadow-[0_0_14px_rgba(255,79,216,0.5)]'
                : 'border-[#37516B] text-[#7CA7BE] bg-[#0D1422] hover:border-[#00E5FF]'
            }`}
          >
            まどろみ
          </button>

          <button
            type="button"
            onClick={() => setPage('mine')}
            className={`border-2 px-2 py-3 transition-all ${
              page === 'mine'
                ? 'border-[#FF4FD8] text-[#FFB8EF] bg-[#2B1230] shadow-[0_0_14px_rgba(255,79,216,0.5)]'
                : 'border-[#37516B] text-[#7CA7BE] bg-[#0D1422] hover:border-[#00E5FF]'
            }`}
          >
            わたし
          </button>

          <button
            type="button"
            onClick={() => setPage('about')}
            className={`border-2 px-2 py-3 transition-all ${
              page === 'about'
                ? 'border-[#FF4FD8] text-[#FFB8EF] bg-[#2B1230] shadow-[0_0_14px_rgba(255,79,216,0.5)]'
                : 'border-[#37516B] text-[#7CA7BE] bg-[#0D1422] hover:border-[#00E5FF]'
            }`}
          >
            zzzについて
          </button>
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-md space-y-12">
        {page === 'timeline' && (
          <>
            <section className="border-2 border-[#37516B] bg-[#0D1422]/90 p-5 shadow-[8px_8px_0px_rgba(0,0,0,0.35)]">
              {!hasPosted ? (
                <form onSubmit={handlePost} className="space-y-4">
                  <input
                    type="text"
                    value={utouto}
                    onChange={(e) => setUtouto(e.target.value.slice(0, 15))}
                    placeholder="うとうとを、15文字以内で"
                    className="w-full bg-[#07111F] border-2 border-[#00E5FF]/70 focus:border-[#FFED70] outline-none px-4 py-4 text-center text-sm placeholder-[#5F8CA3] tracking-wider text-[#E8F8FF] shadow-[0_0_12px_rgba(0,229,255,0.18)]"
                  />

                  <div className="flex justify-between items-center text-xs text-[#7CA7BE]">
                    <span>{utouto.length} / 15</span>
                    <button
                      type="submit"
                      disabled={!utouto.trim()}
                      className="border-2 border-[#FF4FD8] text-[#FFB8EF] px-4 py-2 bg-[#2B1230] hover:bg-[#401B47] disabled:opacity-30 disabled:hover:bg-[#2B1230] shadow-[0_0_12px_rgba(255,79,216,0.35)]"
                    >
                      おくる
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-xs text-[#FFED70] tracking-wider">
                    きょうの うとうと は、もうおわりました。
                  </p>
                  <p className="text-[11px] text-[#7CA7BE]">
                    あなたの気配：{currentUser}
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-center text-xs tracking-[0.45em] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                まどろみ
              </h2>

              {loading ? (
                <p className="text-xs text-[#7CA7BE] text-center tracking-wider">
                  よみこみ中...
                </p>
              ) : timeline.length === 0 ? (
                <p className="text-xs text-[#7CA7BE] text-center tracking-wider">
                  いま見える、まどろみはありません。
                </p>
              ) : (
                <div className="space-y-5">
                  {timeline.map((post) => {
                    const alreadyZzzed = zzzedPostIds.includes(post.id);

                    return (
                      <article
                        key={post.id}
                        className="border-2 border-[#37516B] bg-[#0D1422]/90 p-5 text-center shadow-[6px_6px_0px_rgba(0,0,0,0.35)]"
                      >
                        <p className="text-lg tracking-wider text-[#E8F8FF] drop-shadow-[0_0_8px_rgba(232,248,255,0.35)]">
                          {post.text}
                        </p>

                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#7CA7BE]">
                          <span>{post.name}</span>

                          <button
                            type="button"
                            onClick={() => handleZzz(post.id)}
                            disabled={alreadyZzzed}
                            className={`border px-3 py-1 transition-all ${
                              alreadyZzzed
                                ? 'border-[#37516B] text-[#5F8CA3] opacity-50'
                                : 'border-[#FF4FD8] text-[#FFB8EF] hover:bg-[#2B1230] hover:shadow-[0_0_10px_rgba(255,79,216,0.5)]'
                            }`}
                          >
                            zzz
                            {(post.zzz_count || 0) > 0 && (
                              <span className="ml-2 text-[#FFED70]">
                                {post.zzz_count}
                              </span>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {page === 'mine' && (
          <section className="space-y-6">
            <h2 className="text-center text-xs tracking-[0.45em] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
              わたしのうとうと
            </h2>

            {myPosts.length === 0 ? (
              <div className="border-2 border-[#37516B] bg-[#0D1422]/90 p-8 text-center shadow-[6px_6px_0px_rgba(0,0,0,0.35)]">
                <p className="text-xs text-[#7CA7BE] tracking-wider">
                  まだ、うとうとはありません。
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {myPosts.map((post) => (
                  <article
                    key={post.id}
                    className={`border-2 bg-[#0D1422]/90 p-5 text-center shadow-[6px_6px_0px_rgba(0,0,0,0.35)] ${
                      post.is_hidden
                        ? 'border-[#5F4B6B] opacity-75'
                        : 'border-[#37516B]'
                    }`}
                  >
                    <p className="text-lg tracking-wider text-[#E8F8FF]">
                      {post.text}
                    </p>

                    {post.is_hidden && (
                      <p className="mt-3 text-[10px] text-[#FFB8EF] tracking-wider">
                        まどろみから、消えました
                      </p>
                    )}

                    {!post.is_hidden && (post.zzz_count || 0) >= 3 && (
                      <p className="mt-3 text-[10px] text-[#FFED70] tracking-wider">
                        まどろみに、残りました
                      </p>
                    )}

                    <div className="mt-4 text-xs text-[#7CA7BE] flex justify-center gap-4">
                      <span>
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </span>

                      <span className="text-[#FFED70]">
                        zzz {post.zzz_count || 0}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="mt-5 border border-[#FF4FD8]/60 text-[#FFB8EF] px-3 py-1 text-xs hover:bg-[#2B1230] hover:shadow-[0_0_10px_rgba(255,79,216,0.4)]"
                    >
                      けす
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {page === 'about' && (
          <section className="space-y-5">
            <h2 className="text-center text-xs tracking-[0.45em] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
              zzzについて
            </h2>

            <div className="border-2 border-[#37516B] bg-[#0D1422]/90 p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.35)] space-y-6">
              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  ここは、眠る前の置き場です
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  ZZZは、眠る前に浮かんだ小さなひとことを、
                  匿名の「気配」として置いていく場所です。
                  はっきりした日記でも、強い投稿でもなく、
                  ただそこにある短いまどろみを集めています。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  投稿は1日1回、15文字まで
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  投稿できる「うとうと」は、1日1回だけです。
                  文字数は15文字以内。
                  長く説明しすぎないことで、
                  眠る前の一瞬の気配だけが残るようにしています。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  名前はランダムな気配名です
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  投稿者の名前は表示されません。
                  かわりに「深夜の人」「雨の日の人」のような
                  気配名が自動でつきます。
                  誰かを強く主張するのではなく、
                  なんとなく誰かがいる感じを大切にしています。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  zzzは、静かなリアクションです
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  誰かのうとうとに、言葉で返すことはできません。
                  そのかわりに、静かに zzz を送れます。
                  zzz は「わかる」「そこにいるよ」くらいの、
                  小さな合図です。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  7時間以内にzzzが3つ届くと残ります
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  投稿から7時間以内に zzz が3つ以上届くと、
                  その投稿は「まどろみ」に残ります。
                  3つ届かなかった投稿は、
                  みんなの画面から静かに消えていきます。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  消えても、自分だけは見返せます
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  まどろみから消えた投稿も、
                  投稿した本人の「わたし」ページには残ります。
                  みんなの場所からは消えても、
                  自分の眠る前の記録としては見返せます。
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[#FFED70] text-sm tracking-widest">
                  これはまだ小さな実験です
                </h3>
                <p className="text-xs leading-7 text-[#BDEFFF] tracking-wider">
                  ZZZは、深夜のコンビニの前にあるような、
                  少し光っていて、少しさみしい場所を目指しています。
                  正しいことを言う場所ではなく、
                  眠る前の気配を置いていくための小さな実験です。
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 mt-20 text-[10px] text-[#5F8CA3] tracking-[0.35em]">
        ただ、そこにいるだけ
      </footer>
    </div>
  );
}
