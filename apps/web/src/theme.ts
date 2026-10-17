import {useSyncExternalStore} from 'react';

export type Theme='dark'|'light';
const KEY='theme';
const EVENT='migration-theme-change';

function readTheme():Theme {
 if(typeof window==='undefined')return 'dark';
 try {return window.localStorage.getItem(KEY)==='light'?'light':'dark';}
 catch {return 'dark';}
}
function subscribe(onChange:()=>void){
 window.addEventListener('storage',onChange);
 window.addEventListener(EVENT,onChange);
 return ()=>{window.removeEventListener('storage',onChange);window.removeEventListener(EVENT,onChange);};
}
export function applyTheme(theme:Theme){
 if(typeof document==='undefined')return;
 document.documentElement.classList.toggle('dark',theme==='dark');
 document.documentElement.style.colorScheme=theme;
 try{window.localStorage.setItem(KEY,theme);}catch{/* Storage can be unavailable in private contexts. */}
 window.dispatchEvent(new Event(EVENT));
}
export function useTheme(){
 const theme=useSyncExternalStore(subscribe,readTheme,()=> 'dark' as Theme);
 return {theme,setTheme:applyTheme,toggleTheme:()=>applyTheme(theme==='dark'?'light':'dark')};
}
export function initializeTheme(){
 applyTheme(readTheme());
}
