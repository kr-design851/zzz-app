import React, { useState } from 'react';

const KEHAI_NAMES = ['深夜の人', '雨の日の人', '牛乳の人', 'ベランダの人', 'ぬるいお茶の人', '3階の人'];

const INITIAL_TIMELINE = [
  { id: 1, name: '深夜の人', text: 'ココアが温かい', zzzCount: 5 },
  { id: 2, name: '雨の日の人', text: '遠くで電車の音がする', zzzCount: 12 },
  { id: 3, name: '牛乳の人', text: '冷蔵庫の音が大きいな', zzzCount: 3 },
];

export default function ZzzApp() {
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [utouto, setUtouto] = useState('');
  const [hasPosted, setHasPosted] = useState(false);
  const [currentUser] = useState(() => KEHAI_NAMES[Math.floor(Math.random() * KEHAI_NAMES.length)]);

  const handlePost = (e) => {
    e.preventDefault();
    if (!utouto.trim() || utouto.length > 15 || hasPosted) return;

    const newPost = {
      id: Date.now(),
      name: currentUser,
      text: utouto,
      zzzCount: 0,
    };

    setTimeline([newPost, ...timeline].slice(0, 20));
    setUtouto('');
    setHasPosted(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#333333] font-sans antialiased flex flex-col items-center justify-start py-24 px-6 selection:bg-[#E0E0E0]">
      <header className="mb-20 text-center tracking-widest">
        <h1 className="text-xl font-light text-[#666666] select-none">ZZZ</h1>
      </header>

      <main className="w-full max-w-md space-y-24">
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
          <h2 className="text-xs tracking-widest text-[#999999] text-center mb-8 select-none">まどろみ</h2>
          <div className="space-y-10">
            {timeline.map((post) => (
              <article key={post.id} className="flex flex-col items-center space-y-3 group">
                <p className="text-base tracking-wide font-light text-[#222222]">
                  {post.text}
                </p>

                <div className="flex items-center space-x-4 text-xs text-[#999999] opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="select-none font-light">{post.name}</span>
                  <button
                    onClick={() => {
                      console.log(`zzz to ${post.id}`);
                    }}
                    className="hover:text-[#333333] transition-colors select-none font-medium tracking-tighter"
                  >
                    zzz
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-32 text-[10px] text-[#BBBBBB] select-none tracking-widest">
        ただ、そこにいるだけ
      </footer>
    </div>
  );
}
