import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  let url;try{url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  const file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
  if(!file.startsWith(root)||url.includes('\0')){res.writeHead(403);res.end('Forbidden');return;}
  const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found');}
});
server.on('error',err=>{
 console.error(err.code==='EADDRINUSE'?`포트 ${port}가 사용 중입니다. 기존 실행 창을 닫거나 PORT=4174 npm start 로 실행해주세요.`:`로컬 서버를 시작하지 못했습니다: ${err.message}`);process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${server.address().port}`;
 console.log(`\n소망이 닿는 밤 · 로컬 시제품\n\n${url}\n\n이 컴퓨터에서만 접속할 수 있습니다.\n종료하려면 Control + C를 누르세요.\n`);
 if(process.argv.includes('--open')&&process.platform==='darwin'){
  const child=spawn('open',[url],{stdio:'ignore'});child.on('error',()=>console.log('위 주소를 브라우저에 붙여넣어 주세요.'));
 }
});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
