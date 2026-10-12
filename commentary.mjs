import {bank} from './joke-bank.mjs';
const names={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
export const jokeCount=bank.length;
export function createJokeDeck(storage){
 const key='roastmate-joke-history-v1';let state={ids:[],references:[]};
 try{const loaded=JSON.parse(storage?.getItem(key)||'null');if(loaded&&Array.isArray(loaded.ids)&&Array.isArray(loaded.references))state=loaded;}catch{}
 const used=new Set(state.ids),recent=state.references.slice(-12);
 function take(kind,level='savage'){
  const unused=bank.filter(x=>!used.has(x.id)&&(level==='savage'||!(level==='mild'?/\b(fuck|fucking|shit|damn)\b/i:/\b(fuck|fucking)\b/i).test(x.text)));let eligible=unused.filter(x=>x.category===kind);
  if(!eligible.length&&kind!=='normal')eligible=unused.filter(x=>x.category==='normal');
  if(!eligible.length)return null;
  const spaced=eligible.filter(x=>!recent.includes(x.reference));
  const pool=spaced.length?spaced:eligible;const chosen=pool[Math.floor(Math.random()*pool.length)];
  used.add(chosen.id);recent.push(chosen.reference);if(recent.length>12)recent.shift();
  try{storage?.setItem(key,JSON.stringify({ids:[...used],references:recent}));}catch{}
  return chosen;
 }
 return {take,used,recent};
}
let browserStorage;try{browserStorage=globalThis.localStorage;}catch{}
const deck=createJokeDeck(browserStorage);export const used=deck.used;
export const takeJoke=(kind,level)=>deck.take(kind,level);
export function commentary(g,m,level='savage'){
const early=g.history().length<17;const hist=g.history({verbose:true});const repeated=hist.slice(0,-1).filter(x=>x.color===m.color&&x.to===m.from&&x.piece===m.piece).length>0;
let kind='normal',tip=`Your ${names[m.piece]} is now on ${m.to}. Look at the squares it controls.`;
if(m.flags.includes('k')||m.flags.includes('q')){kind='castle';tip='Your king is safer and your rook can join the fight.';}
else if(m.san.includes('+')||m.san.includes('#')){kind='check';tip='Check forces a response. Plan what happens after the king escapes.';}
else if(g.isAttacked(m.to,m.color==='w'?'b':'w')&&m.piece!=='k'){kind='hanging';tip=`Black attacks ${m.to}. Check whether your ${names[m.piece]} is defended and whether an exchange helps you.`;}
else if(m.captured){kind='capture';tip=`You captured a ${names[m.captured]}. Check whether your opponent can recapture.`;}
else if(early&&m.piece==='q'){kind='queen';tip='Early queen moves invite attacks. Develop knights and bishops too.';}
else if(early&&repeated){kind='repeat';tip='Moving the same piece again costs time. Give your other pieces a turn.';}
else if(early&&m.piece==='p'&&['a','b','g','h'].includes(m.to[0])){kind='edge';tip=`${m.to} gains space on the side. Your center and undeveloped pieces still need attention.`;}
else if(early&&['d4','e4','d5','e5'].includes(m.to)){kind='center';tip=`${m.to} helps contest the center. Develop a knight or bishop next.`;}
else if(early&&['n','b'].includes(m.piece)){kind='develop';tip=`Your ${names[m.piece]} is active on ${m.to}. Bring another piece out next.`;}
const entry=takeJoke(kind,level);
const text=entry?entry.text.replaceAll('{to}',m.to).replaceAll('{piece}',names[m.piece]).replaceAll('{victim}',names[m.captured]||'piece'):'No unused roasts for this move type. Your next move is still coached below.';
return {text,tip,kind,reference:entry?.reference,id:entry?.id,exhausted:!entry};}
