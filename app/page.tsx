'use client';
// Drop this file's default export into `app/page.tsx` of a Next.js 13/14 project
// No external services. No images. Deployable on Vercel.
// Styling uses Tailwind classes (Next.js + Tailwind template recommended).

import { useEffect, useMemo, useState } from 'react';

// ---------- Small utils ----------
const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','to','in','on','for','with','at','by','from','as','that','this','it','is','are','was','were','be','has','have','had','will','can','do','does','did','you','your','we','our','they','their','i','me','my','rt'
]);

function splitThread(text: string, limit = 270) {
  // split into tweet-sized chunks without breaking words
  const words = text.trim().split(/\s+/);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length > limit) { if (cur) out.push(cur); cur = w; } else { cur = next; }
  }
  if (cur) out.push(cur);
  return out;
}

function ctHook(text: string) {
  const first = text.trim().slice(0, 120);
  return `⚡️ ${first} — read this ↓`;
}

function keywordTags(text: string, n = 5) {
  const counts: Record<string, number> = {};
  text.toLowerCase().replace(/[^a-z0-9_\s]/g,'').split(/\s+/).forEach(w => {
    if (!w || STOPWORDS.has(w) || w.length < 3) return;
    counts[w] = (counts[w] || 0) + 1;
  });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>`#${k}`);
}

function toCSV(rows: string[][]) {
  return rows.map(r => r.map(cell => '"' + cell.replace(/"/g,'""') + '"').join(',')).join('\n');
}

// ---------- Components ----------
function Section({title, children, actions}: {title: string; children: any; actions?: any}){
  return (
    <section className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur p-5 rounded-2xl shadow-sm border border-black/5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function ThreadComposer(){
  const [raw, setRaw] = useState('');
  const [useHook, setUseHook] = useState(true);
  const [addNumbers, setAddNumbers] = useState(true);
  const [addTags, setAddTags] = useState(true);

  const parts = useMemo(()=> splitThread(raw), [raw]);
  const tags = useMemo(()=> addTags ? keywordTags(raw, 5) : [], [raw, addTags]);
  const final = useMemo(()=>{
    const arr = [...parts];
    if (useHook && raw.trim()) arr.unshift(ctHook(raw));
    return arr.map((p,i)=> addNumbers ? `${i+1}/${arr.length} ${p}` : p);
  },[parts, useHook, addNumbers, raw]);

  const copyAll = async () => {
    const text = final.map(s=> s + (tags.length && final[final.length-1]===s ? `\n\n${tags.join(' ')}` : '')).join('\n\n');
    await navigator.clipboard.writeText(text);
    alert('Thread copied to clipboard');
  };

  return (
    <Section title="Thread Composer" actions={
      <button onClick={copyAll} className="px-3 py-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Copy Thread</button>
    }>
      <textarea
        value={raw}
        onChange={e=>setRaw(e.target.value)}
        placeholder="Tulis ide utama… (contoh: Canton = virtual global ledger; atomic cross-subnet; no wrapped tokens; KYC via idOS; dll)"
        className="w-full h-36 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-neutral-950"
      />

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={useHook} onChange={e=>setUseHook(e.target.checked)} /> Hook ala CT</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={addNumbers} onChange={e=>setAddNumbers(e.target.checked)} /> Nomor urut 1/N</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={addTags} onChange={e=>setAddTags(e.target.checked)} /> Auto hashtag</label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {final.map((p, i) => (
          <div key={i} className="p-3 rounded-xl border bg-white dark:bg-neutral-950">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>Tweet {i+1}</span>
              <span>{p.length}/280</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{p}</p>
            {i === final.length - 1 && !!(tags.length) && (
              <p className="mt-2 text-sm opacity-80">{tags.join(' ')}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// Planner types
interface Slot { id: string; date: string; time: string; text: string; }
const defaultTimes = ['07:00','12:00','17:00','21:00'];

function Planner(){
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>(defaultTimes[0]);
  const [text, setText] = useState('');
  const [items, setItems] = useState<Slot[]>([]);

  // load/save localStorage
  useEffect(()=>{
    const raw = localStorage.getItem('planner');
    if (raw) setItems(JSON.parse(raw));
  },[]);
  useEffect(()=>{
    localStorage.setItem('planner', JSON.stringify(items));
  },[items]);

  const add = () => {
    if (!date || !time || !text.trim()) return;
    setItems(prev => [...prev, { id: crypto.randomUUID(), date, time, text: text.trim() }]);
    setText('');
  };
  const del = (id: string) => setItems(prev => prev.filter(x=>x.id!==id));

  const exportCSV = () => {
    const header = ['date','time','text'];
    const rows = [header, ...items.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time)).map(i=>[i.date,i.time,i.text])];
    const csv = toCSV(rows);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'planner.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Section title="Content Planner (local)" actions={
      <div className="flex gap-2">
        <button onClick={exportCSV} className="px-3 py-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Export CSV</button>
        <button onClick={()=>{ if(confirm('Clear all?')) setItems([]); }} className="px-3 py-1.5 rounded-xl border hover:bg-red-500/10">Clear</button>
      </div>
    }>
      <div className="grid md:grid-cols-4 gap-2">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded-xl p-2"/>
        <select value={time} onChange={e=>setTime(e.target.value)} className="border rounded-xl p-2">
          {defaultTimes.map(t=> <option key={t} value={t}>{t} WIB</option>)}
        </select>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Tema/Hook" className="border rounded-xl p-2 col-span-2"/>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={add} className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">Add Slot</button>
      </div>

      <div className="mt-4 divide-y">
        {items.length === 0 && <p className="opacity-70 text-sm">Belum ada jadwal. Tambah di atas.</p>}
        {items.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time)).map(i=> (
          <div key={i.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{i.text}</div>
              <div className="text-sm opacity-70">{i.date} • {i.time} WIB</div>
            </div>
            <button onClick={()=>del(i.id)} className="text-red-600 hover:underline">Hapus</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function IdeasBoard(){
  const [idea, setIdea] = useState('');
  const [list, setList] = useState<{id:string; text:string; done:boolean}[]>([]);
  useEffect(()=>{ const raw = localStorage.getItem('ideas'); if (raw) setList(JSON.parse(raw)); },[]);
  useEffect(()=>{ localStorage.setItem('ideas', JSON.stringify(list)); },[list]);
  const add = () => { if (!idea.trim()) return; setList(prev=>[...prev, {id:crypto.randomUUID(), text:idea.trim(), done:false}]); setIdea(''); };
  return (
    <Section title="Ideas Board">
      <div className="flex gap-2">
        <input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Contoh: idOS: reusable KYC; Canton atomic subnet; FHE vs MPC" className="border rounded-xl p-2 flex-1"/>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">Add</button>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map(item=> (
          <li key={item.id} className="flex items-center gap-2">
            <input type="checkbox" checked={item.done} onChange={e=> setList(prev=> prev.map(x=> x.id===item.id ? {...x, done:e.target.checked} : x))} />
            <span className={item.done? 'line-through opacity-60':''}>{item.text}</span>
            <button onClick={()=> setList(prev=> prev.filter(x=> x.id!==item.id))} className="ml-auto text-red-600 hover:underline">Hapus</button>
          </li>
        ))}
        {list.length===0 && <p className="opacity-70 text-sm">Tulis ide topik untuk antrian konten.</p>}
      </ul>
    </Section>
  );
}

export default function Page(){
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Oroqor — Creator Studio (No Images)</h1>
            <p className="opacity-70">Thread composer, content planner, dan ideas board — tanpa layanan eksternal.</p>
          </div>
          <a href="https://x.com/oroqor" target="_blank" className="text-sm underline opacity-80">@oroqor</a>
        </header>

        <ThreadComposer/>
        <Planner/>
        <IdeasBoard/>

        <footer className="text-xs opacity-70 text-center pt-6">Built for Vercel • Works offline (localStorage)</footer>
      </div>
    </main>
  );
}
