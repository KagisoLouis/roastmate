export class ChessClock{
 constructor(minutes=10,now=()=>performance.now()){this.now=now;this.initial=minutes*60000;this.reset();}
 reset(){this.remaining={w:this.initial,b:this.initial};this.active=null;this.mark=this.now();this.flagged=null;this.started=false;}
 snapshot(){return {remaining:{...this.remaining},active:this.active,flagged:this.flagged,started:this.started};}
 settle(){const t=this.now();if(this.active&&!this.flagged){this.remaining[this.active]=Math.max(0,this.remaining[this.active]-(t-this.mark));if(this.remaining[this.active]===0){this.flagged=this.active;this.active=null;}}this.mark=t;return this.flagged;}
 start(color){this.settle();if(!this.flagged){this.active=color;this.mark=this.now();this.started=true;}}
 stop(){this.settle();this.active=null;}
 restore(s){this.remaining={...s.remaining};this.flagged=s.flagged;this.started=s.started;this.active=s.active;this.mark=this.now();}
}
export function formatTime(ms){const s=Math.ceil(Math.max(0,ms)/1000);return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');}
