'use strict';
const TuzPacks = (() => {
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('tuz-study-sources', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function files(mode, operation) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('files', mode);
        const result = operation(tx.objectStore('files'));
        tx.oncomplete = () => resolve(result?.result);
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  async function readZip(file) {
    const bytes = await file.arrayBuffer();
    const view = new DataView(bytes);
    const decoder = new TextDecoder();
    const entries = new Map();
    let end = bytes.byteLength - 22;
    while (end >= Math.max(0,bytes.byteLength-65557) && view.getUint32(end,true) !== 0x06054b50) end--;
    if(end < Math.max(0,bytes.byteLength-65557)) throw new Error('Choose a valid ZIP archive.');
    let cursor = view.getUint32(end+16,true);
    let total = 0;
    for(let i=0;i<view.getUint16(end+10,true);i++){
      if(view.getUint32(cursor,true)!==0x02014b50) throw new Error('Invalid ZIP directory.');
      const length=view.getUint16(cursor+28,true);
      const name=decoder.decode(bytes.slice(cursor+46,cursor+46+length));
      const offset=view.getUint32(cursor+42,true);
      const method=view.getUint16(cursor+10,true);
      const size=view.getUint32(cursor+24,true);
      const compressed=view.getUint32(cursor+20,true);
      cursor+=46+length+view.getUint16(cursor+30,true)+view.getUint16(cursor+32,true);
      if(name.endsWith('/')) continue;
      total+=size;
      if(total>80*1024**2 || entries.has(name) || view.getUint32(offset,true)!==0x04034b50) throw new Error('Invalid or oversized ZIP.');
      const start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true);
      if(start+compressed>bytes.byteLength) throw new Error('Incomplete ZIP entry.');
      entries.set(name,{method,size,blob:new Blob([bytes.slice(start,start+compressed)])});
    }
    async function get(path) {
      const entry=entries.get(path);
      if(!entry) throw new Error('Missing ZIP file: '+path);
      if(entry.method===0 && entry.blob.size===entry.size) return entry.blob;
      if(entry.method!==8) throw new Error('Use standard ZIP compression.');
      const reader=entry.blob.stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const chunks=[];
      let length=0;
      try {
        while(true){
          const {value,done}=await reader.read();
          if(done) break;
          length+=value.byteLength;
          if(length>entry.size) throw new Error('Invalid ZIP entry size.');
          chunks.push(value);
        }
      } finally { await reader.cancel(); }
      if(length!==entry.size) throw new Error('Incomplete ZIP entry.');
      return new Blob(chunks);
    }
    return readEntries([...entries.keys()],get);
  }

  async function readArchive(file) {
    if(location.protocol==='file:') throw new Error('For RAR, 7z, or TAR, launch the local game with npm start. ZIP also works directly from index.html.');
    const {Archive}=await import('./vendor/archive/libarchive.js');
    const archive=await Archive.open(file);
    try {
      const entries=new Map();
      let total=0;
      for(const entry of await archive.getFilesArray()){
        const size=entry.file.size;
        if(!Number.isSafeInteger(size) || size<0) continue;
        total+=size;
        if(total>80*1024**2) throw new Error('The unpacked archive is larger than 80 MB.');
      }
      await archive.extractFiles();
      for(const {file,path} of await archive.getFilesArray()){
        if(file instanceof File) entries.set(path+file.name,file);
      }
      return await readEntries([...entries.keys()],async path=>{
        const entry=entries.get(path);
        if(!entry) throw new Error('Missing archive file: '+path);
        return entry;
      });
    } finally {
      await archive.close();
    }
  }

  async function readEntries(names,get) {
    const manifest=names.find(name=>/^[^/]+\/manifest\.json$/.test(name));
    if(!manifest) throw new Error('The ZIP needs a top-level pack folder with manifest.json.');
    const root=manifest.slice(0,-'manifest.json'.length);
    const json=async path=>JSON.parse(await (await get(root+path)).text());
    const pack=await json('manifest.json');
    for(const chapter of pack.chapters){
      for(const module of chapter.modules){
        const {cards}=await json(module.path+'/questions.json');
        const variants=await json(module.path+'/variants.json');
        const references=await json(module.path+'/references.json');
        module.cards=cards.map((card,index)=>({...card,source:references[index],variants:variants[index]}));
      }
    }
    for(const source of pack.files) source.blob=await get(root+'material/'+source.name);
    return pack;
  }

  async function read(file, remaining, existing) {
    if (file.size > 80 * 1024 ** 2) throw new Error('Study packs must be under 80 MB.');
    const pack = await (/\.zip$/i.test(file.name) ? readZip(file) : readArchive(file));
    if (pack.format !== 'tuz-study-pack-v1' || typeof pack.title !== 'string' ||
        !pack.title.trim() || !Array.isArray(pack.chapters) || !Array.isArray(pack.files)) {
      throw new Error('Choose a valid Tuz study pack.');
    }
    const id = pack.title.trim().slice(0,100);
    if (existing.some(deck => deck.pack === id)) throw new Error('This pack is already imported.');
    const sources = new Map();
    for (const source of pack.files) {
      if (typeof source.id !== 'string' || sources.has(source.id) ||
          typeof source.name !== 'string' || !/\.pdf$/i.test(source.name) ||
          !source.blob) throw new Error('Invalid PDF in the study pack.');
      if(await source.blob.slice(0,5).text()!=='%PDF-') throw new Error('Invalid PDF in the study pack.');
      sources.set(source.id,source.blob.slice(0,source.blob.size,'application/pdf'));
    }
    function card(raw, fallback) {
      const {prompt, answer, why, options} = raw;
      const ref = raw.source || fallback;
      if (![prompt,answer,why].every(value => typeof value === 'string' && value.trim()) ||
          !Array.isArray(options) || options.length !== 4 || new Set(options).size !== 4 ||
          !options.every(value => typeof value === 'string' && value.trim()) ||
          !options.includes(answer) || !sources.has(ref?.file) ||
          !Number.isInteger(ref.page) || ref.page < 1 || typeof ref.label !== 'string') {
        throw new Error('A question has invalid choices or a missing source.');
      }
      return {prompt,answer,why,options,source:{key:[id,ref.file],page:ref.page,label:ref.label}};
    }
    const decks = pack.chapters.flatMap(chapter => chapter.modules.map(module => ({
      pack:id, chapter:String(chapter.title).slice(0,100), title:String(module.title).slice(0,70),
      cards:module.cards.map(raw => ({
        ...card(raw,module.source),
        variants:(raw.variants || []).map(variant => card(variant,raw.source || module.source))
      }))
    })));
    if (!decks.length || decks.length > remaining || decks.some(deck => deck.cards.length < 5 || deck.cards.length > 60)) {
      throw new Error('The pack exceeds your available deck slots or has a module outside the 5–60 question limit.');
    }
    await files('readwrite', store => {
      for (const [key, blob] of sources) store.put(blob,[id,key]);
    });
    return decks;
  }

  async function open(source, tab) {
    const blob = await files('readonly', store => store.get(source.key));
    if (!blob) throw new Error('Source file missing. Import the study pack again.');
    const url = URL.createObjectURL(blob);
    tab.location.replace(url+'#page='+source.page);
    setTimeout(() => URL.revokeObjectURL(url), 300000);
  }

  function removeSources(pack) {
    return files('readwrite',store=>store.delete(IDBKeyRange.bound([pack],[pack,[]])));
  }

  return {read, open, removeSources};
})();
