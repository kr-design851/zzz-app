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

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTimeline(data || []);
    setMyPosts((data || []).filter((post) => post.user_id === userId));
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!utouto.trim() || utouto.length > 15 || hasPosted) return;

    const { error } = await supabase.from('posts').insert({
      name: currentUser,
      text: utouto,
      user_id: userId
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


  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#333333] font-sans antialiased flex flex-col items-center justify-start py-20 px-6 selection:bg-[#E0E0E0]">
      <header className="mb-16 text-center tracking-widest space-y-6">
        <h1 className="text-xl font-light text-[#666666] select-none">ZZZ</h1>

        <div className="text-xs leading-7 text-[#888888] tracking-wide font-light max-w-xs mx-auto">
          <p>ZZZは、眠る前の小さなひとことを</p>
          <p>匿名の気配として置いていく場所です。</p>
          <p>1日1回、15文字以内の「うとうと」を投稿できます。</p>
          <p>誰かの投稿には、ただ静かに zzz を送れます。</p>
        </div>

        <nav className="flex justify-center gap-8 text-xs text-[#999999] pt-4">
          <button
            onClick={() => setPage('timeline')}
            className={page === 'timeline' ? 'text-[#333333]' : 'hover:text-[#666666]'}
          >
            まどろみ
          </button>
          <button
            onClick={() => setPage('mine')}
            className={page === 'mine' ? 'text-[#333333]' : 'hover:text-[#666666]'}
          >
            わたし
          </button>
        </nav>
      </header>

      <main className="w-full max-w-md space-y-20">
        {page === 'timeline' && (
          <>
            <section className="space-y-4">
              {!hasPosted ? (
                <form onSubmit={handlePost} className="flex flex-col space-y-4">
                  <input
                    type="text"
                    value={utouto}
                    onChange={(e) => setUtouto(e.target.value.slice(0, 15))}
                    placeholder="うとうとを、15文字以内で"
                    className="w-full bg-transparent border-b border-[#CCCCCC] focus:border-[#666666] outline-none py-2 text-center text-sm placeholder-[#999999] tracking-wide transition-colors"
                  />
                  <div className="flex justify-between items-center text-xs text-[#999999] px-1">
                    <span>{utouto.length} / 15</span>
                    <button
                      type="submit"
                      disabled={!utouto.trim()}
                      className="hover:text-[#333333] disabled:opacity-30 disabled:hover:text-[#999999] transition-colors"
                    >
                      おくる
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-[#999999] text-center italic tracking-wider select-none">
                  きょうの うとうと は、もうおわりました。あなたの気配：{currentUser}
                </p>
              )}
            </section>

            <section className="space-y-12">
              <h2 className="text-xs tracking-widest text-[#999999] text-center mb-8 select-none">
                まどろみ
              </h2>

              {loading ? (
                <p className="text-xs text-[#999999] text-center tracking-wider">
                  よみこみ中...
                </p>
              ) : timeline.length === 0 ? (
                <p className="text-xs text-[#999999] text-center tracking-wider">
                  まだ、まどろみはありません。
                </p>
              ) : (
                <div className="space-y-10">
                  {timeline.map((post) => {
                    const alreadyZzzed = zzzedPostIds.includes(post.id);

                    return (
                      <article key={post.id} className="flex flex-col items-center space-y-3 group">
                        <p className="text-base tracking-wide font-light text-[#222222]">
                          {post.text}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-[#999999] opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="select-none font-light">{post.name}</span>

                          <button
                            onClick={() => handleZzz(post.id)}
                            disabled={alreadyZzzed}
                            className={`transition-colors select-none font-medium tracking-tighter ${
                              alreadyZzzed
                                ? 'text-[#333333] opacity-40 cursor-default'
                                : 'hover:text-[#333333]'
                            }`}
                          >
                            zzz
                            {(post.zzz_count || 0) > 0 && (
                              <span className="ml-1 text-[10px] opacity-60">
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
          <section className="space-y-12">
            <h2 className="text-xs tracking-widest text-[#999999] text-center mb-8 select-none">
              わたしのうとうと
            </h2>

            {myPosts.length === 0 ? (
              <p className="text-xs text-[#999999] text-center tracking-wider">
                まだ、うとうとはありません。
              </p>
            ) : (
              <div className="space-y-10">
                {myPosts.map((post) => (
                  <article key={post.id} className="flex flex-col items-center space-y-3">
                    <p className="text-base tracking-wide font-light text-[#222222]">
                      {post.text}
                    </p>
                    <div className="text-xs text-[#999999] opacity-60 flex items-center gap-3">
                      <span>
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      {(post.zzz_count || 0) > 0 && (
                        <span>zzz {post.zzz_count}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="mt-32 text-[10px] text-[#BBBBBB] select-none tracking-widest">
        ただ、そこにいるだけ
      </footer>
    </div>
  );
}
