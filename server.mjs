import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.GPA_PORT || 8766);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('GPA_PORT must be a valid TCP port.');
}
const origin = 'http://'+host+':'+port;
const root = new URL('./', import.meta.url);
const staticPaths = /^\/(?:index\.html|styles\.css|(?:game|materials|demo-decks|study-pack)\.js|vendor\/(?:pdf-text|gsap\.min)\.js|vendor\/archive\/(?:libarchive\.js|worker-bundle\.js|libarchive\.wasm)|vendor\/InstrumentSerif-Regular\.ttf|assets\/Tuz_(?:Still|Boss|Hit|Miss)\.png|assets\/Tuz_Idle\.gif)$/;
const mime = {html:'text/html; charset=utf-8', css:'text/css; charset=utf-8',
  js:'text/javascript; charset=utf-8', wasm:'application/wasm', png:'image/png', gif:'image/gif', ttf:'font/ttf'};

function reply(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}

async function readJson(stream, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) throw new Error('The request is too large. Use a shorter excerpt.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function agentEndpoint(value) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error('Enter the full agent endpoint URL.'); }
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.hash || url.search) {
    throw new Error('Use an HTTPS endpoint, or HTTP on localhost. Put credentials in the key field.');
  }
  if (local && Number(url.port || (url.protocol === 'https:' ? 443 : 80)) === port) {
    throw new Error('Enter the endpoint of your model provider.');
  }
  return url;
}

async function runAgent(req, res) {
  if (req.headers.origin !== origin || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    return reply(res, 403, {error:'Open the game from its local server to connect a model.'});
  }
  let input;
  let endpoint;
  try {
    input = await readJson(req, 350000);
    endpoint = agentEndpoint(input.endpoint);
    if (typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 52000) {
      throw new Error('Choose a shorter section for your agent.');
    }
    if (!['chat','claude','webhook'].includes(input.mode) ||
        (input.mode !== 'webhook' && (typeof input.model !== 'string' || !input.model.trim() || input.model.length > 160))) {
      throw new Error('Choose a supported format and enter its model ID when required.');
    }
    if (typeof input.token !== 'string' || input.token.length > 4096 || /[\r\n]/.test(input.token)) {
      throw new Error('Enter a valid API key.');
    }
  } catch (error) {
    return reply(res, 400, {error:error.message});
  }
  const headers = {'Content-Type':'application/json'};
  if (input.token) headers.Authorization = 'Bearer '+input.token;
  const messages = [{role:'user',content:input.prompt}];
  let body;
  if (input.mode === 'claude') {
    headers['anthropic-version'] = '2026-10-21';
    body = {model:input.model,messages,max_tokens:4096};
  } else if (input.mode === 'chat') {
    body = {model:input.model,messages,stream:false};
  } else {
    body = {prompt:input.prompt};
  }
  const disconnect = new AbortController();
  const abort = () => disconnect.abort();
  res.once('close',abort);
  try {
    const upstream = await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(body),
      redirect:'error',signal:AbortSignal.any([disconnect.signal,AbortSignal.timeout(120000)])});
    if (!upstream.ok) {
      await upstream.body?.cancel();
      return reply(res,502,{error:'The agent returned HTTP '+upstream.status+'. Check the URL, model, and key.'});
    }
    const length = Number(upstream.headers.get('content-length'));
    if (length > 350000) {
      await upstream.body?.cancel();
      return reply(res,502,{error:'The agent response was too large.'});
    }
    const response = await readJson(upstream.body,350000);
    let result;
    if (input.mode === 'claude') {
      result = response.content?.filter(block=>block.type==='text').map(block=>block.text).join('');
    } else if (input.mode === 'chat') {
      result = response.choices?.[0]?.message?.content;
    } else {
      result = response.deck ?? response;
    }
    if (!result) return reply(res,502,{error:'The agent did not return a deck.'});
    reply(res,200,{result});
  } catch (error) {
    if (!res.destroyed) reply(res,502,{error:error.name==='TimeoutError'
      ? 'The agent took too long. Try a smaller excerpt.'
      : 'The response could not be read. Check that the model endpoint is running and returns JSON.'});
  } finally {
    res.off('close',abort);
  }
}

const server = createServer(async (req,res) => {
  if (req.headers.host !== host+':'+port) return reply(res,403,{error:'Open '+origin});
  let pathname;
  try { pathname = new URL(req.url,origin).pathname; }
  catch { return reply(res,400,{error:'Invalid URL'}); }
  if (req.method==='POST' && pathname==='/api/agent') return runAgent(req,res);
  const file = pathname==='/' ? '/index.html' : pathname;
  if (!['GET','HEAD'].includes(req.method) || !staticPaths.test(file)) {
    return reply(res,404,{error:'File not found'});
  }
  try {
    const path = fileURLToPath(new URL('.'+file,root));
    const {size} = await stat(path);
    res.writeHead(200,{'Content-Type':mime[file.split('.').at(-1)],'Content-Length':size,
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if (req.method==='HEAD') return res.end();
    createReadStream(path).on('error',()=>res.destroy()).pipe(res);
  } catch {
    reply(res,404,{error:'File not found'});
  }
});
server.listen(port,host,()=>console.log('Your GPA Must Be Desperate is ready at '+origin));
