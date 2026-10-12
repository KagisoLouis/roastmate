import {bestMove,values} from './engine.mjs';
export const names={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
export function strategy(g){if(g.isGameOver()||g.turn()!=='w')return null;const m=bestMove(g,2);if(!m)return null;const checked=g.isCheck(),early=g.history().length<18;g.move(m);let reason;
if(g.isCheckmate())reason='This move delivers checkmate. The opposing king has no legal escape.';
else if(checked)reason=`This is a legal way out of check${m.captured?' while capturing their '+names[m.captured]:''}. Your king’s safety comes first.`;
else if(m.flags.includes('k')||m.flags.includes('q'))reason='Castle to move your king out of the center and bring your rook into the game.';
else if(m.captured)reason=`Capture Black’s ${names[m.captured]} on ${m.to}${m.flags.includes('e')?' en passant':''}. ${g.isAttacked(m.to,'b')?'That square is attacked, so check the possible recapture.':'Black does not currently attack the destination square.'}`;
else if(m.san.includes('+'))reason=`Your ${names[m.piece]} gives check from ${m.to}, forcing Black to respond.`;
else if(early&&m.piece==='p'&&['d4','e4'].includes(m.to))reason=`Claim space in the center and open lines for your pieces. Your pawn on ${m.to} controls ${m.to==='e4'?'d5 and f5':'c5 and e5'}.`;
else if(early&&['n','b'].includes(m.piece))reason=`Develop your ${names[m.piece]} from ${m.from} to ${m.to}. ${m.piece==='n'&&['c3','f3'].includes(m.to)?'It helps control central squares.':'An active piece has more options than one on its starting square.'}`;
else reason=`Reposition your ${names[m.piece]} to ${m.to}. ${g.isAttacked(m.to,'b')?'The destination is attacked; compare attackers and defenders before exchanging.':'The destination is not currently attacked by Black.'}`;
const reply=bestMove(g,1);g.undo();return {move:m,title:'Play '+m.san,instruction:`Move your ${names[m.piece]} from ${m.from} to ${m.to}.`,reason,reply:reply?.san};}
