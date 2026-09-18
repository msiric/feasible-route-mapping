import { create } from 'zustand';
export const useDemo = create<{live:boolean;setLive:(live:boolean)=>void}>(set=>({live:false,setLive:live=>set({live})}));
