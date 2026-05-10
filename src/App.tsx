import { useState, useEffect, useRef, useCallback } from "react";

// ─── Persistent State ─────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const set = (v) => {
    const next = typeof v === 'function' ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [val, set];
}


// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  "Deep Work": { color:"#ff6b6b", glow:"#ff6b6b44", icon:"🧠" },
  "Quick Win":  { color:"#ffd93d", glow:"#ffd93d44", icon:"⚡" },
  "Group":      { color:"#74b9ff", glow:"#74b9ff44", icon:"👥" },
  "Exam":       { color:"#c7a8ff", glow:"#c7a8ff44", icon:"📝" },
};
const SYS = { blue:"#0a84ff", green:"#30d158", red:"#ff453a", orange:"#ff9f0a", bg:"#000", card:"rgba(28,28,30,0.85)", card2:"rgba(44,44,46,0.9)" };
const TODAY = new Date().toISOString().slice(0,10);
const daysAgo = n => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

const TASKS0 = [
  {id:1,title:"Assignment VLSI",    type:"Deep Work",dueDate:"2026-05-23",status:"in-progress",subtasks:[{id:1,text:"Baca lecture notes Ch5",done:true},{id:2,text:"Buat circuit diagram",done:false},{id:3,text:"Tulis explanation",done:false}]},
  {id:2,title:"Buat Copy Format FYP2",type:"Quick Win",dueDate:"",          status:"in-progress",subtasks:[{id:1,text:"Download template",done:false},{id:2,text:"Isi bahagian intro",done:false}]},
  {id:3,title:"FYP ROBOT",          type:"Deep Work",dueDate:"2026-05-28",status:"in-progress",subtasks:[{id:1,text:"Test sensor reading",done:true},{id:2,text:"Debug motor control",done:false},{id:3,text:"Tulis report section",done:false},{id:4,text:"Record demo video",done:false}]},
  {id:4,title:"GROUP PROJECT HV",   type:"Group",    dueDate:"2026-05-22",status:"done",       subtasks:[{id:1,text:"Meeting with group",done:true},{id:2,text:"Finalize slides",done:true}]},
  {id:5,title:"TEST 1 - 11MAY26",   type:"Exam",     dueDate:"2026-05-11",status:"done",       subtasks:[{id:1,text:"Revise topic 1-3",done:true},{id:2,text:"Past year soalan",done:true}]},
];
const STREAK0 = [daysAgo(6),daysAgo(5),daysAgo(4),daysAgo(3),daysAgo(1)];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pScore = t => {
  if(t.status==="done") return -1;
  const w={Exam:4,"Deep Work":3,Group:2,"Quick Win":1}[t.type]||1;
  let s=w*10;
  if(t.dueDate){const d=(new Date(t.dueDate)-new Date())/86400000; s+=d<1?50:d<3?30:d<7?15:0;}
  const pct=t.subtasks.length?t.subtasks.filter(x=>x.done).length/t.subtasks.length:0;
  return Math.round(s+(1-pct)*10);
};
const ENEED={Exam:"peak","Deep Work":"peak",Group:"medium","Quick Win":"low"};
const eLvl=(h,p)=>h>=p.s&&h<p.e?"peak":h>=p.e+2&&h<p.e+4?"medium":"low";
const fmt12=h=>`${h===0?12:h>12?h-12:h}${h>=12?"pm":"am"}`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(dueDate){
  const [t,setT]=useState({});
  useEffect(()=>{
    if(!dueDate)return;
    const calc=()=>{
      const diff=new Date(dueDate+"T23:59:59")-new Date();
      if(diff<=0)return setT({expired:true});
      setT({days:Math.floor(diff/86400000),hours:Math.floor((diff%86400000)/3600000),mins:Math.floor((diff%3600000)/60000),secs:Math.floor((diff%60000)/1000)});
    };
    calc(); const id=setInterval(calc,1000); return()=>clearInterval(id);
  },[dueDate]);
  return t;
}
function useFocusTimer(active){
  const [secs,setSecs]=useState(0);
  useEffect(()=>{
    if(!active){setSecs(0);return;}
    const id=setInterval(()=>setSecs(s=>s+1),1000);
    return()=>clearInterval(id);
  },[active]);
  const m=String(Math.floor(secs/60)).padStart(2,"0");
  const s=String(secs%60).padStart(2,"0");
  return `${m}:${s}`;
}

// ─── Inject CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter",sans-serif;}
  ::-webkit-scrollbar{display:none;}
  @keyframes breatheIn {0%{transform:scale(1);opacity:.4}50%{transform:scale(1.6);opacity:.9}100%{transform:scale(1);opacity:.4}}
  @keyframes breatheRing{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.65) rotate(180deg)}100%{transform:scale(1) rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes islandExpand{from{width:120px;opacity:.6}to{width:200px;opacity:1}}
  @keyframes springIn{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(10,132,255,.4)}50%{box-shadow:0 0 0 8px rgba(10,132,255,0)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes contextIn{from{opacity:0;transform:scale(.9) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  .spring{transition:transform .5s cubic-bezier(.34,1.56,.64,1),opacity .3s ease;}
  .card-glass{background:rgba(28,28,30,.85);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);}
  .sheet-glass{background:rgba(18,18,20,.95);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);}
  .liquid-glass{background:linear-gradient(135deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,.02) 100%);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);}
`;

// ─── Dynamic Island ───────────────────────────────────────────────────────────
function DynamicIsland({focusTask,timer,onTap}){
  const [expanded,setExpanded]=useState(false);
  if(!focusTask) return null;
  const cfg=TYPE_CFG[focusTask.type]||TYPE_CFG["Deep Work"];
  return(
    <div onClick={()=>{setExpanded(!expanded);onTap&&onTap();}} style={{
      position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",
      background:"#000",borderRadius:expanded?22:99,
      padding:expanded?"12px 16px":"8px 16px",
      minWidth:expanded?220:140,cursor:"pointer",zIndex:999,
      border:"1px solid rgba(255,255,255,.08)",
      transition:"all .4s cubic-bezier(.34,1.26,.64,1)",
      boxShadow:"0 4px 30px rgba(0,0,0,.8)",
      display:"flex",alignItems:"center",gap:10,
    }}>
      <div style={{width:8,height:8,borderRadius:"50%",background:cfg.color,boxShadow:`0 0 8px ${cfg.color}`,flexShrink:0,
        animation:"pulseGlow 2s infinite"}}/>
      {!expanded&&<>
        <span style={{color:"#fff",fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{focusTask.title}</span>
        <span style={{color:cfg.color,fontSize:12,fontWeight:700,marginLeft:"auto",fontVariantNumeric:"tabular-nums"}}>{timer}</span>
      </>}
      {expanded&&<div style={{flex:1}}>
        <p style={{color:"#ffffff66",fontSize:10,fontWeight:600,margin:"0 0 2px",letterSpacing:.5}}>FOCUS SESSION</p>
        <p style={{color:"#fff",fontSize:14,fontWeight:600,margin:"0 0 4px"}}>{focusTask.title}</p>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:cfg.color,fontSize:22,fontWeight:700,fontVariantNumeric:"tabular-nums",letterSpacing:-1}}>{timer}</span>
          <span style={{color:"#ffffff33",fontSize:12}}>elapsed</span>
        </div>
      </div>}
    </div>
  );
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────
function FocusMode({task,onEnd}){
  const timer=useFocusTimer(true);
  const cfg=TYPE_CFG[task.type]||TYPE_CFG["Deep Work"];
  const [phase,setPhase]=useState("in");
  useEffect(()=>{
    const cycle=()=>setPhase(p=>p==="in"?"hold":"in");
    const id=setInterval(cycle,4000);
    return()=>clearInterval(id);
  },[]);
  const done=task.subtasks.filter(s=>s.done).length;
  return(
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeUp .4s ease"}}>
      {/* Breathing rings */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        {[1,2,3].map(i=>(
          <div key={i} style={{position:"absolute",width:i*120,height:i*120,borderRadius:"50%",
            border:`1px solid ${cfg.color}${i===1?"55":i===2?"33":"18"}`,
            transform:`scale(${phase==="in"?1+i*.15:1})`,opacity:phase==="in"?.6:.3,
            transition:`transform ${3+i*.5}s ease-in-out, opacity ${3+i*.5}s ease-in-out`}}/>
        ))}
        <div style={{width:80,height:80,borderRadius:"50%",
          background:`radial-gradient(circle, ${cfg.color}66 0%, transparent 70%)`,
          transform:phase==="in"?"scale(1.4)":"scale(1)",
          transition:"transform 4s ease-in-out",
          animation:"breatheIn 8s ease-in-out infinite"}}/>
      </div>

      {/* Content */}
      <div style={{position:"relative",textAlign:"center",padding:"0 30px"}}>
        <p style={{color:"#ffffff33",fontSize:13,fontWeight:500,letterSpacing:.5,margin:"0 0 12px"}}>{cfg.icon} {task.type.toUpperCase()}</p>
        <h2 style={{color:"#fff",fontSize:26,fontWeight:700,letterSpacing:-.8,margin:"0 0 6px",lineHeight:1.2}}>{task.title}</h2>
        <p style={{color:"#ffffff44",fontSize:14,margin:"0 0 32px"}}>{done}/{task.subtasks.length} subtasks done</p>
        <div style={{fontSize:52,fontWeight:300,letterSpacing:-2,color:"#fff",fontVariantNumeric:"tabular-nums",margin:"0 0 8px"}}>{timer}</div>
        <p style={{color:"#ffffff33",fontSize:13,margin:"0 0 48px"}}>{phase==="in"?"Breathe in…":"Hold…"}</p>
      </div>

      <button onClick={onEnd} style={{position:"absolute",bottom:52,left:"50%",transform:"translateX(-50%)",
        background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",color:"#fff",
        borderRadius:99,padding:"14px 32px",fontSize:15,fontWeight:600,cursor:"pointer",
        backdropFilter:"blur(20px)",letterSpacing:-.2}}>
        End Session
      </button>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({task,pos,onClose,onComplete,onFocus,onDelete}){
  const isDone=task.status==="done";
  const items=[
    {icon:isDone?"↩":"✓", label:isDone?"Mark Incomplete":"Mark Complete", action:onComplete, color:SYS.green},
    {icon:"🔥",             label:"Start Focus Session",                   action:onFocus,   color:SYS.orange},
    {icon:"🗑",             label:"Delete Task",                           action:onDelete,  color:SYS.red},
  ];
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:600}}/>
      <div style={{
        position:"fixed",top:Math.min(pos.y,window.innerHeight-180),left:Math.max(16,Math.min(pos.x-80,window.innerWidth-200)),
        width:200,background:"rgba(28,28,30,.95)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
        borderRadius:16,border:"1px solid rgba(255,255,255,.1)",zIndex:601,overflow:"hidden",
        boxShadow:"0 20px 60px rgba(0,0,0,.6)",animation:"contextIn .2s ease",
      }}>
        {items.map((item,i)=>(
          <button key={i} onClick={()=>{item.action();onClose();}} style={{
            display:"flex",alignItems:"center",gap:10,width:"100%",padding:"13px 16px",
            background:"transparent",border:"none",color:item.color||"#fff",fontSize:14,
            fontWeight:500,cursor:"pointer",textAlign:"left",
            borderBottom:i<items.length-1?"1px solid rgba(255,255,255,.06)":"none",
          }}>
            <span style={{fontSize:16}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function Ring({subtasks,size=46,onClick}){
  const done=subtasks.filter(s=>s.done).length;
  const pct=subtasks.length?done/subtasks.length:0;
  const r=17,circ=2*Math.PI*r;
  const c=pct===1?SYS.green:pct>.5?SYS.blue:SYS.orange;
  return(
    <div onClick={onClick} style={{position:"relative",width:size,height:size,flexShrink:0,cursor:"pointer"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .6s cubic-bezier(.34,1.26,.64,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{color:c,fontSize:11,fontWeight:700,lineHeight:1}}>{Math.round(pct*100)}</span>
        <span style={{color:"rgba(255,255,255,.25)",fontSize:8}}>%</span>
      </div>
    </div>
  );
}

// ─── Countdown Bubbles ────────────────────────────────────────────────────────
function Countdown({dueDate,status}){
  const t=useCountdown(dueDate);
  if(status==="done") return <span style={{color:SYS.green,fontSize:12,fontWeight:500}}>✓ Completed</span>;
  if(!dueDate) return <span style={{color:"rgba(255,255,255,.2)",fontSize:12}}>No deadline</span>;
  if(t.expired) return <span style={{color:SYS.red,fontSize:12,fontWeight:600}}>Overdue</span>;
  const urg=t.days<1?SYS.red:t.days<3?SYS.orange:SYS.green;
  return(
    <div style={{display:"flex",gap:4}}>
      {[{l:"d",v:t.days},{l:"h",v:t.hours},{l:"m",v:t.mins},{l:"s",v:t.secs}].map(({l,v})=>(
        <div key={l} className="liquid-glass" style={{borderRadius:9,padding:"4px 7px",minWidth:34,textAlign:"center",border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{color:urg,fontSize:14,fontWeight:700,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{String(v).padStart(2,"0")}</div>
          <div style={{color:"rgba(255,255,255,.25)",fontSize:8,marginTop:1}}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Task Card (with swipe + long press) ─────────────────────────────────────
function TaskCard({task,onUpdate,onDelete,onFocus}){
  const [expanded,setExpanded]=useState(false);
  const [swipeX,setSwipeX]=useState(0);
  const [swiping,setSwiping]=useState(false);
  const [contextPos,setContextPos]=useState(null);
  const [newSub,setNewSub]=useState("");
  const [editDate,setEditDate]=useState(false);
  const [leaving,setLeaving]=useState(null); // "complete"|"delete"
  const touchX=useRef(0); const touchY=useRef(0); const lpTimer=useRef(null);
  const isDone=task.status==="done";
  const cfg=TYPE_CFG[task.type]||TYPE_CFG["Quick Win"];

  const SWIPE_THRESHOLD=72;

  const onTouchStart=e=>{
    touchX.current=e.touches[0].clientX;
    touchY.current=e.touches[0].clientY;
    lpTimer.current=setTimeout(()=>{
      setContextPos({x:e.touches[0].clientX,y:e.touches[0].clientY});
    },500);
  };
  const onTouchMove=e=>{
    clearTimeout(lpTimer.current);
    const dx=e.touches[0].clientX-touchX.current;
    const dy=e.touches[0].clientY-touchY.current;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){
      setSwiping(true);
      setSwipeX(Math.max(-110,Math.min(110,dx)));
    }
  };
  const onTouchEnd=()=>{
    clearTimeout(lpTimer.current);
    if(swipeX>SWIPE_THRESHOLD){
      setLeaving("complete");
      setTimeout(()=>{onUpdate({...task,status:isDone?"in-progress":"done"});setLeaving(null);setSwipeX(0);setSwiping(false);},300);
    } else if(swipeX<-SWIPE_THRESHOLD){
      setLeaving("delete");
      setTimeout(()=>{onDelete(task.id);},280);
    } else {
      setSwipeX(0); setSwiping(false);
    }
  };

  const toggleSub=sid=>onUpdate({...task,subtasks:task.subtasks.map(s=>s.id===sid?{...s,done:!s.done}:s)});
  const addSub=()=>{if(!newSub.trim())return;onUpdate({...task,subtasks:[...task.subtasks,{id:Date.now(),text:newSub.trim(),done:false}]});setNewSub("");};
  const delSub=sid=>onUpdate({...task,subtasks:task.subtasks.filter(s=>s.id!==sid)});

  const showGreen=swipeX>20;
  const showRed=swipeX<-20;
  const pct=task.subtasks.length?task.subtasks.filter(s=>s.done).length/task.subtasks.length:0;

  return(
    <div style={{position:"relative",marginBottom:10,borderRadius:20,overflow:"hidden",
      animation:leaving?"springIn .3s ease forwards":undefined,
      opacity:leaving==="delete"?0:1,transition:leaving?"opacity .28s ease":"none",
    }}>
      {/* Swipe backgrounds */}
      <div style={{position:"absolute",inset:0,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"flex-start",paddingLeft:20,
        background:SYS.green,opacity:showGreen?Math.min(swipeX/SWIPE_THRESHOLD,1):0,transition:"opacity .1s",pointerEvents:"none",zIndex:0}}>
        <span style={{fontSize:24}}>{isDone?"↩":"✓"}</span>
      </div>
      <div style={{position:"absolute",inset:0,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:20,
        background:SYS.red,opacity:showRed?Math.min(-swipeX/SWIPE_THRESHOLD,1):0,transition:"opacity .1s",pointerEvents:"none",zIndex:0}}>
        <span style={{fontSize:24}}>🗑</span>
      </div>

      {/* Card */}
      <div
        className="card-glass"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{position:"relative",zIndex:1,borderRadius:20,border:"1px solid rgba(255,255,255,.07)",
          transform:`translateX(${swipeX}px)`,
          transition:swiping?"none":"transform .4s cubic-bezier(.34,1.26,.64,1)",
          boxShadow:isDone?"none":`0 2px 20px ${cfg.glow}`,
          opacity:isDone?.6:1,
        }}
      >
        {/* Header row */}
        <div style={{padding:"14px 16px 0",display:"flex",gap:12,alignItems:"flex-start"}}>
          <Ring subtasks={task.subtasks} size={46}
            onClick={()=>onUpdate({...task,status:isDone?"in-progress":"done"})}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{background:`${cfg.color}18`,color:cfg.color,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,border:`1px solid ${cfg.color}30`}}>
                {cfg.icon} {task.type}
              </span>
              {isDone&&<span style={{background:"#30d15818",color:SYS.green,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99}}>Done</span>}
            </div>
            <p style={{color:isDone?"rgba(255,255,255,.3)":"#fff",fontSize:16,fontWeight:600,margin:"0 0 8px",
              lineHeight:1.25,textDecoration:isDone?"line-through":"none",letterSpacing:-.3}}>{task.title}</p>
            <Countdown dueDate={task.dueDate} status={task.status}/>
          </div>
          <button onClick={()=>setExpanded(!expanded)} style={{background:"rgba(255,255,255,.06)",border:"none",
            color:"rgba(255,255,255,.4)",borderRadius:99,width:28,height:28,cursor:"pointer",
            fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,
            transition:"transform .3s cubic-bezier(.34,1.56,.64,1)",transform:expanded?"rotate(180deg)":"rotate(0deg)"}}>
            ↓
          </button>
        </div>

        {/* Thin progress bar */}
        {task.subtasks.length>0&&(
          <div style={{padding:"10px 16px 12px"}}>
            <div style={{height:2.5,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct*100}%`,borderRadius:99,
                background:pct===1?SYS.green:SYS.blue,transition:"width .5s cubic-bezier(.34,1.26,.64,1)"}}/>
            </div>
          </div>
        )}

        {/* Expanded */}
        {expanded&&(
          <div style={{padding:"4px 16px 16px",borderTop:"1px solid rgba(255,255,255,.05)",animation:"fadeUp .2s ease"}}>
            {/* Date */}
            {!isDone&&<div style={{display:"flex",alignItems:"center",gap:8,paddingTop:10,paddingBottom:10}}>
              <span style={{color:"rgba(255,255,255,.3)",fontSize:12}}>Due</span>
              {!editDate
                ? <button onClick={()=>setEditDate(true)} style={{background:"rgba(255,255,255,.06)",border:"none",color:task.dueDate?"#fff":"rgba(255,255,255,.3)",borderRadius:99,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>
                    {task.dueDate||"Set deadline"}
                  </button>
                : <div style={{display:"flex",gap:6}}>
                    <input type="date" defaultValue={task.dueDate} onChange={x=>onUpdate({...task,dueDate:x.target.value})}
                      style={{background:"rgba(255,255,255,.08)",border:"none",color:"#fff",borderRadius:10,padding:"6px 10px",fontSize:12,outline:"none"}}/>
                    <button onClick={()=>setEditDate(false)} style={{background:"#30d15822",border:"none",color:SYS.green,borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>✓</button>
                  </div>
              }
            </div>}

            {/* Focus button */}
            {!isDone&&(
              <button onClick={()=>onFocus(task)} style={{width:"100%",background:`${cfg.color}15`,border:`1px solid ${cfg.color}30`,
                color:cfg.color,borderRadius:12,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:12,
                display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                🔥 Start Focus Session
              </button>
            )}

            {/* Subtasks */}
            <p style={{color:"rgba(255,255,255,.3)",fontSize:11,fontWeight:600,margin:"0 0 8px",letterSpacing:.4}}>
              SUBTASKS · {task.subtasks.filter(s=>s.done).length}/{task.subtasks.length}
            </p>
            {task.subtasks.map(st=>(
              <div key={st.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <button onClick={()=>toggleSub(st.id)} style={{width:20,height:20,borderRadius:"50%",flexShrink:0,cursor:"pointer",
                  border:`2px solid ${st.done?SYS.green:"rgba(255,255,255,.2)"}`,
                  background:st.done?SYS.green:"transparent",color:"#000",fontSize:10,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all .25s cubic-bezier(.34,1.56,.64,1)"}}>
                  {st.done?"✓":""}
                </button>
                <span style={{color:st.done?"rgba(255,255,255,.3)":"rgba(255,255,255,.85)",fontSize:13,flex:1,
                  textDecoration:st.done?"line-through":"none"}}>{st.text}</span>
                <button onClick={()=>delSub(st.id)} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.2)",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <input value={newSub} onChange={x=>setNewSub(x.target.value)} onKeyDown={x=>x.key==="Enter"&&addSub()}
                placeholder="Add subtask…" style={{flex:1,background:"rgba(255,255,255,.06)",border:"none",color:"#fff",
                borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none"}}/>
              <button onClick={addSub} style={{background:SYS.blue,border:"none",color:"#fff",borderRadius:12,padding:"10px 16px",cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
            </div>
            <button onClick={()=>onDelete(task.id)} style={{marginTop:10,background:"transparent",border:"none",color:"rgba(255,69,58,.5)",fontSize:12,cursor:"pointer",padding:0}}>Delete task</button>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextPos&&<ContextMenu task={task} pos={contextPos}
        onClose={()=>setContextPos(null)}
        onComplete={()=>onUpdate({...task,status:isDone?"in-progress":"done"})}
        onFocus={()=>onFocus(task)}
        onDelete={()=>onDelete(task.id)}/>}
    </div>
  );
}

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({days,onMark}){
  const marked=days.includes(TODAY);
  let streak=0,check=new Date();
  if(!days.includes(TODAY)) check.setDate(check.getDate()-1);
  for(let i=0;i<60;i++){
    const d=check.toISOString().slice(0,10);
    if(days.includes(d)){streak++;check.setDate(check.getDate()-1);}else break;
  }
  if(!days.includes(TODAY)&&!days.includes(daysAgo(1)))streak=0;
  const last7=Array.from({length:7},(_,i)=>daysAgo(6-i));
  return(
    <div className="card-glass" style={{borderRadius:20,padding:"16px 18px",marginBottom:10,border:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8}}>
          <span style={{fontSize:26}}>{streak>=7?"🔥":streak>=3?"⚡":"📖"}</span>
          <span style={{color:"#fff",fontWeight:700,fontSize:28,letterSpacing:-1}}>{streak}</span>
          <span style={{color:"rgba(255,255,255,.35)",fontSize:14}}>day streak</span>
        </div>
        {!marked
          ? <button onClick={onMark} style={{background:SYS.blue,border:"none",color:"#fff",borderRadius:99,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Mark Today</button>
          : <div style={{background:"#30d15818",borderRadius:99,padding:"6px 14px"}}><span style={{color:SYS.green,fontSize:12,fontWeight:600}}>✓ Done!</span></div>
        }
      </div>
      <div style={{display:"flex",gap:5}}>
        {last7.map(d=>{
          const a=days.includes(d),isT=d===TODAY;
          return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",height:24,borderRadius:8,
                background:a?"linear-gradient(135deg,#0a84ff,#30d158)":"rgba(255,255,255,.06)",
                border:isT?`2px solid ${a?SYS.blue:"rgba(255,255,255,.2)"}`:"2px solid transparent",
                boxShadow:a?"0 0 12px rgba(10,132,255,.35)":"none",transition:"all .3s cubic-bezier(.34,1.26,.64,1)"}}/>
              <span style={{color:"rgba(255,255,255,.2)",fontSize:9}}>{new Date(d+"T12:00:00").toLocaleDateString("en",{weekday:"narrow"})}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Energy Card ──────────────────────────────────────────────────────────────
function EnergyCard({peak,tasks,onSetup}){
  if(!peak) return(
    <button onClick={onSetup} className="liquid-glass" style={{width:"100%",borderRadius:20,padding:"16px 18px",marginBottom:10,
      display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px dashed rgba(255,255,255,.12)",
      background:"transparent",textAlign:"left"}}>
      <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(255,159,10,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔥</div>
      <div><p style={{color:"#fff",fontSize:14,fontWeight:600,margin:"0 0 2px"}}>Set Energy Profile</p>
        <p style={{color:"rgba(255,255,255,.35)",fontSize:12,margin:0}}>Match tasks to your sharpest hours</p></div>
      <span style={{color:SYS.blue,fontSize:20,marginLeft:"auto"}}>›</span>
    </button>
  );
  const h=new Date().getHours();
  const lvl=eLvl(h,{s:peak.peakStart,e:peak.peakEnd});
  const ECFG={peak:{icon:"🔥",label:"Peak Focus",color:SYS.orange},medium:{icon:"💡",label:"Medium Energy",color:SYS.blue},low:{icon:"☕",label:"Low Energy",color:"rgba(255,255,255,.4)"}}[lvl];
  const doNow=tasks.filter(t=>t.status!=="done"&&ENEED[t.type]===lvl).sort((a,b)=>pScore(b)-pScore(a))[0]
    ||tasks.filter(t=>t.status!=="done").sort((a,b)=>pScore(b)-pScore(a))[0];
  const slots=Array.from({length:18},(_,i)=>i+6);
  return(
    <div className="card-glass" style={{borderRadius:20,padding:"16px 18px",marginBottom:10,border:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:`${ECFG.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{ECFG.icon}</div>
        <div style={{flex:1}}>
          <p style={{color:ECFG.color,fontSize:13,fontWeight:600,margin:"0 0 1px"}}>{ECFG.label}</p>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:11,margin:0}}>Right now</p>
        </div>
        <button onClick={onSetup} style={{background:"rgba(255,255,255,.06)",border:"none",color:"rgba(255,255,255,.4)",borderRadius:99,padding:"5px 12px",fontSize:11,cursor:"pointer"}}>Edit</button>
      </div>
      {doNow&&(
        <div style={{background:"rgba(255,255,255,.05)",borderRadius:14,padding:"10px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(255,255,255,.06)"}}>
          <Ring subtasks={doNow.subtasks} size={38}/>
          <div style={{flex:1}}><p style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:600,margin:"0 0 2px",letterSpacing:.4}}>DO NOW</p>
            <p style={{color:"#fff",fontSize:14,fontWeight:600,margin:0,lineHeight:1.2}}>{doNow.title}</p></div>
          <span style={{fontSize:18}}>{ECFG.icon}</span>
        </div>
      )}
      <div style={{display:"flex",height:12,borderRadius:99,overflow:"hidden",gap:1.5,marginBottom:4}}>
        {slots.map(i=>{const l=eLvl(i,{s:peak.peakStart,e:peak.peakEnd}); const c=l==="peak"?SYS.orange:l==="medium"?SYS.blue:"rgba(255,255,255,.08)";
          return <div key={i} style={{flex:1,background:c,opacity:l==="low"?.5:1,borderRadius:i===h?"3px":"0",outline:i===h?"2px solid rgba(255,255,255,.5)":"none",outlineOffset:-1}}/>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"rgba(255,255,255,.2)",fontSize:9}}>6am</span><span style={{color:"rgba(255,255,255,.4)",fontSize:9,fontWeight:600}}>now {fmt12(h)}</span><span style={{color:"rgba(255,255,255,.2)",fontSize:9}}>midnight</span></div>
    </div>
  );
}

// ─── Energy Setup Sheet ───────────────────────────────────────────────────────
function EnergySheet({onSave,onClose}){
  const [s,setS]=useState(9),[e,setE]=useState(12);
  const slots=Array.from({length:18},(_,i)=>i+6);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:400,display:"flex",alignItems:"flex-end",backdropFilter:"blur(12px)"}}>
      <div className="sheet-glass" style={{borderRadius:"28px 28px 0 0",padding:"22px 22px 44px",width:"100%",maxWidth:480,margin:"0 auto",border:"1px solid rgba(255,255,255,.08)",animation:"fadeUp .35s cubic-bezier(.34,1.26,.64,1)"}}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,.15)",borderRadius:99,margin:"0 auto 20px"}}/>
        <h2 style={{color:"#fff",fontSize:20,fontWeight:700,margin:"0 0 6px",letterSpacing:-.5}}>Peak Focus Hours 🔥</h2>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:13,margin:"0 0 20px"}}>When is your brain sharpest?</p>
        <div style={{display:"flex",gap:10,marginBottom:18}}>
          {[{label:"From",val:s,set:setS},{label:"Until",val:e,set:setE}].map(({label,val,set})=>(
            <div key={label} style={{flex:1}}>
              <p style={{color:"rgba(255,255,255,.35)",fontSize:11,fontWeight:600,margin:"0 0 6px",letterSpacing:.4}}>{label.toUpperCase()}</p>
              <select value={val} onChange={x=>set(+x.target.value)} style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:12,padding:"12px",fontSize:15,outline:"none",textAlign:"center"}}>
                {Array.from({length:24},(_,i)=>i).map(h=><option key={h} value={h}>{fmt12(h)}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:"12px",marginBottom:18,border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"flex",height:14,borderRadius:99,overflow:"hidden",gap:1}}>
            {slots.map(h=>{const l=eLvl(h,{s,e});return <div key={h} style={{flex:1,background:l==="peak"?SYS.orange:l==="medium"?SYS.blue:"rgba(255,255,255,.06)",opacity:l==="low"?.4:1}}/>;  })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><span style={{color:"rgba(255,255,255,.2)",fontSize:9}}>6am</span><span style={{color:"rgba(255,255,255,.2)",fontSize:9}}>midnight</span></div>
        </div>
        <button onClick={()=>onSave({peakStart:s,peakEnd:e})} style={{width:"100%",background:SYS.orange,border:"none",color:"#000",borderRadius:14,padding:15,fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10,letterSpacing:-.3}}>Save</button>
        <button onClick={onClose} style={{width:"100%",background:"transparent",border:"none",color:"rgba(255,255,255,.35)",padding:10,fontSize:14,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Add Task Sheet ───────────────────────────────────────────────────────────
function AddSheet({onAdd,onClose}){
  const [form,setForm]=useState({title:"",type:"Deep Work",dueDate:""});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:400,display:"flex",alignItems:"flex-end",backdropFilter:"blur(12px)"}}>
      <div className="sheet-glass" style={{borderRadius:"28px 28px 0 0",padding:"22px 22px 44px",width:"100%",maxWidth:480,margin:"0 auto",border:"1px solid rgba(255,255,255,.08)",animation:"fadeUp .35s cubic-bezier(.34,1.26,.64,1)"}}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,.15)",borderRadius:99,margin:"0 auto 20px"}}/>
        <h2 style={{color:"#fff",fontSize:20,fontWeight:700,margin:"0 0 20px",letterSpacing:-.5}}>New Task</h2>
        <input placeholder="Task name…" value={form.title} onChange={x=>setForm({...form,title:x.target.value})}
          style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.08)",color:"#fff",borderRadius:14,padding:14,fontSize:15,outline:"none",marginBottom:12}}/>
        <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
          {Object.entries(TYPE_CFG).map(([type,c])=>(
            <button key={type} onClick={()=>setForm({...form,type})} style={{background:form.type===type?`${c.color}18`:"rgba(255,255,255,.06)",
              border:`1px solid ${form.type===type?c.color+"44":"transparent"}`,
              color:form.type===type?c.color:"rgba(255,255,255,.45)",borderRadius:99,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",
              transition:"all .2s cubic-bezier(.34,1.26,.64,1)"}}>
              {c.icon} {type}
            </button>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:"12px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(255,255,255,.07)"}}>
          <span style={{color:"rgba(255,255,255,.4)",fontSize:13}}>Deadline</span>
          <input type="date" value={form.dueDate} onChange={x=>setForm({...form,dueDate:x.target.value})}
            style={{flex:1,background:"transparent",border:"none",color:"#fff",fontSize:13,outline:"none",textAlign:"right"}}/>
        </div>
        <button onClick={()=>{if(form.title){onAdd(form);onClose();}}} style={{width:"100%",background:SYS.blue,border:"none",color:"#fff",borderRadius:14,padding:15,fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10,letterSpacing:-.3}}>Add Task</button>
        <button onClick={onClose} style={{width:"100%",background:"transparent",border:"none",color:"rgba(255,255,255,.35)",padding:10,fontSize:14,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [tasks,setTasks]=useLocalStorage("sh_tasks",TASKS0);
  const [streak,setStreak]=useLocalStorage("sh_streak",STREAK0);
  const [filter,setFilter]=useLocalStorage("sh_filter","active");
  const [sortBy,setSortBy]=useLocalStorage("sh_sort","priority");
  const [showAdd,setShowAdd]=useState(false);
  const [energyPeak,setEnergyPeak]=useLocalStorage("sh_energy",null);
  const [showEnergy,setShowEnergy]=useState(false);
  const [focusTask,setFocusTask]=useState(null);
  const focusTimer=useFocusTimer(!!focusTask);

  const update=u=>setTasks(t=>t.map(x=>x.id===u.id?u:x));
  const remove=id=>setTasks(t=>t.filter(x=>x.id!==id));
  const add=f=>setTasks(t=>[...t,{id:Date.now(),title:f.title,type:f.type,dueDate:f.dueDate,status:"in-progress",subtasks:[]}]);

  const active=tasks.filter(t=>t.status!=="done");
  const filtered=tasks.filter(t=>filter==="all"?true:filter==="done"?t.status==="done":t.status!=="done");
  const sorted=[...filtered].sort((a,b)=>sortBy==="priority"?pScore(b)-pScore(a):b.id-a.id);
  const totalSub=active.reduce((a,t)=>a+t.subtasks.length,0);
  const doneSub=active.reduce((a,t)=>a+t.subtasks.filter(s=>s.done).length,0);
  const ovr=totalSub?doneSub/totalSub:0;

  return(
    <div style={{minHeight:"100vh",background:"#000",color:"#fff",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif",overflowX:"hidden"}}>
      <style>{CSS}</style>

      {/* Dynamic Island */}
      <DynamicIsland focusTask={focusTask} timer={focusTimer} onTap={()=>{}}/>

      {/* Focus Mode overlay */}
      {focusTask&&<FocusMode task={focusTask} onEnd={()=>setFocusTask(null)}/>}

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
        {/* Header */}
        <div style={{paddingTop:60,paddingBottom:8}}>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:13,margin:"0 0 4px",fontWeight:500}}>
            {new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"})}
          </p>
          <h1 style={{fontSize:34,fontWeight:700,margin:"0 0 20px",letterSpacing:-1,lineHeight:1.05}}>Study Hub</h1>

          {/* Master ring */}
          <div className="card-glass" style={{borderRadius:20,padding:"16px 18px",marginBottom:10,border:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",width:60,height:60,flexShrink:0}}>
              <svg width={60} height={60} style={{transform:"rotate(-90deg)"}}>
                <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={4}/>
                <circle cx={30} cy={30} r={24} fill="none" stroke={SYS.blue} strokeWidth={4}
                  strokeDasharray={2*Math.PI*24} strokeDashoffset={2*Math.PI*24*(1-ovr)}
                  strokeLinecap="round" style={{transition:"stroke-dashoffset .7s cubic-bezier(.34,1.26,.64,1)"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:SYS.blue,fontSize:13,fontWeight:700}}>{Math.round(ovr*100)}%</span>
              </div>
            </div>
            <div>
              <p style={{color:"#fff",fontSize:16,fontWeight:600,margin:"0 0 3px",letterSpacing:-.3}}>Overall Progress</p>
              <p style={{color:"rgba(255,255,255,.4)",fontSize:13,margin:0}}>{doneSub} of {totalSub} subtasks · {active.length} active tasks</p>
            </div>
          </div>

          <EnergyCard peak={energyPeak} tasks={tasks} onSetup={()=>setShowEnergy(true)}/>
          <StreakCard days={streak} onMark={()=>{ if(!streak.includes(TODAY))setStreak(d=>[...d,TODAY]); }}/>
        </div>

        {/* Filter + actions */}
        <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          {["active","done","all"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              background:filter===f?"#fff":"rgba(255,255,255,.08)",border:"none",
              color:filter===f?"#000":"rgba(255,255,255,.5)",borderRadius:99,padding:"7px 16px",
              fontSize:13,fontWeight:600,cursor:"pointer",textTransform:"capitalize",
              transition:"all .25s cubic-bezier(.34,1.56,.64,1)"}}>
              {f}
            </button>
          ))}
          <button onClick={()=>setSortBy(s=>s==="priority"?"recent":"priority")} style={{background:"rgba(255,255,255,.06)",border:"none",color:sortBy==="priority"?SYS.blue:"rgba(255,255,255,.35)",borderRadius:99,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",marginLeft:"auto"}}>
            {sortBy==="priority"?"↑ Priority":"Recent"}
          </button>
          <button onClick={()=>setShowAdd(true)} style={{background:SYS.blue,border:"none",color:"#fff",borderRadius:99,padding:"7px 18px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 16px rgba(10,132,255,.4)"}}>
            + New
          </button>
        </div>

        {/* Hint */}
        {filter==="active"&&sorted.length>0&&(
          <p style={{color:"rgba(255,255,255,.2)",fontSize:11,textAlign:"center",marginBottom:10}}>Swipe → complete · Swipe ← delete · Hold for menu</p>
        )}

        {/* Tasks */}
        {sorted.length===0&&<div style={{textAlign:"center",padding:60}}><p style={{fontSize:40,marginBottom:8}}>🎉</p><p style={{color:"rgba(255,255,255,.25)",fontSize:15}}>All clear!</p></div>}
        {sorted.map(task=>(
          <TaskCard key={task.id} task={task} onUpdate={update} onDelete={remove} onFocus={t=>setFocusTask(t)}/>
        ))}
        <div style={{height:60}}/>
      </div>

      {showAdd&&<AddSheet onAdd={add} onClose={()=>setShowAdd(false)}/>}
      {showEnergy&&<EnergySheet onSave={p=>{setEnergyPeak(p);setShowEnergy(false);}} onClose={()=>setShowEnergy(false)}/>}
    </div>
  );
}
