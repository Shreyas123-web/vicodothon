"use client";

import { useState, useEffect } from "react";

interface Post {
  id: string;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}

interface RejectedTopic {
  title: string;
  reason: string;
  rejectedAt: string;
}

export default function Home() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [rejections, setRejections] = useState<RejectedTopic[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("Ada");
  const [domain, setDomain] = useState("AI Security");

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: { name, domain } }),
      });
      const data = await res.json();
      if (data.agentId) {
        setAgentId(data.agentId);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchFeed = async () => {
    if (!agentId) return;
    try {
      const res = await fetch(`/api/agent/feed?agentId=${agentId}`);
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      if (data.lastRunAt) setLastRunAt(data.lastRunAt);
      
      const rRes = await fetch(`/api/agent/rejected?agentId=${agentId}`);
      const rData = await rRes.json();
      if (rData.rejected) setRejections(rData.rejected);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 5000);
      return () => clearInterval(interval);
    }
  }, [agentId]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <header className="mb-12 border-b border-neutral-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Autonomous AI Creator</h1>
            <p className="text-neutral-400 mt-2 text-sm">Real LLM Engine with Live RSS Discovery</p>
          </div>
          {agentId && (
            <div className="text-right flex flex-col items-end gap-2">
              <span className="text-xs font-mono bg-neutral-900 text-neutral-400 px-3 py-1 rounded-full border border-neutral-800">
                ID: {agentId}
              </span>
              {lastRunAt && (
                <span className="text-xs font-mono text-emerald-400/80 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Worker Last Active: {new Date(lastRunAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </header>

        {!agentId ? (
          <div className="max-w-md mx-auto bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            <h2 className="text-xl mb-6 font-medium text-neutral-200">Initialize Persona</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Persona Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Domain Focus</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-neutral-200"
                />
              </div>
              <button
                onClick={handleInitialize}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-3 font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                {loading ? "Initializing..." : "Boot Agent"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {/* LEFT COL: THE FEED */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Published Feed
                </h2>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl">
                  <p className="text-neutral-500 animate-pulse">The autonomous agent is scanning live feeds...</p>
                  <p className="text-neutral-600 text-sm mt-2">Check the heartbeat monitor above. The first post will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <article key={post.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all hover:border-neutral-700">
                      <p className="text-neutral-200 leading-relaxed text-lg">{post.text}</p>
                      
                      <div className="mt-6 pt-6 border-t border-neutral-800/50">
                        <h4 className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-2">Editorial Rationale</h4>
                        <p className="text-sm text-neutral-400">{post.rationale}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                          {post.sources.map((src, i) => (
                            <a key={i} href={src} target="_blank" className="text-xs bg-neutral-950 border border-neutral-800 text-neutral-500 px-2 py-1 rounded hover:text-indigo-400 transition-colors">
                              Source {i + 1}
                            </a>
                          ))}
                        </div>
                        <time className="text-xs text-neutral-500 font-mono">
                          {new Date(post.createdAt).toLocaleTimeString()} · {new Date(post.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COL: REJECTED TOPICS */}
            <div className="space-y-6">
              <h2 className="text-xl font-medium text-neutral-400 border-b border-neutral-800 pb-4">
                Judge Log (Rejected)
              </h2>
              {rejections.length === 0 ? (
                <p className="text-neutral-600 text-sm italic">No rejected headlines yet.</p>
              ) : (
                <div className="space-y-4">
                  {rejections.map((r, i) => (
                    <div key={i} className="bg-neutral-950 border border-red-900/30 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-neutral-300 mb-2">{r.title}</h3>
                      <p className="text-xs text-red-400/80 leading-relaxed">{r.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
