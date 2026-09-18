import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
const aliases=JSON.parse(fs.readFileSync(new URL('./tsconfig.paths.json',import.meta.url))).compilerOptions.paths;
export default defineConfig({plugins:[react()],resolve:{alias:Object.fromEntries(Object.entries(aliases).map(([key,value])=>[key.replace('/*',''),path.resolve(value[0].replace('/*',''))]))},server:{host:'127.0.0.1',port:5176,proxy:{'/api':'http://127.0.0.1:5076'}},build:{outDir:'build',sourcemap:false}});
