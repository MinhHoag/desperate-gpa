'use strict';
const byId = id => document.getElementById(id);
const musicPanel=byId('music-panel');
const musicButton=document.createElement('button');
musicButton.type='button';
musicButton.textContent='Music';
musicButton.setAttribute('aria-haspopup','dialog');
byId('sound').after(musicButton);
musicButton.onclick=()=>{
  const player=byId('spotify-player');
  if(!player.hasAttribute('src'))player.src=player.dataset.src;
  musicPanel.showModal();
};
byId('music-close').onclick=()=>musicPanel.close();
const levels=demoDecks.map(deck=>[deck.title,deck.title]);
const random = values => values[Math.floor(Math.random()*values.length)];
function shuffle(values){
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
const sets=demoDecks.map(deck=>deck.cards);
const customDeckStart=levels.length;
function deckStorageId(index){
  if(index===0)return '0';
  // Keep the original numeric IDs for imported decks.
  if(index>=customDeckStart)return String(index-customDeckStart+1);
  return 'preset:'+demoDecks[index].title;
}
const customDecks=TuzMaterials.restore();
function registerDeck(deck){
  const index=levels.length;
  levels.push([deck.title,'Your material · '+deck.title]);
  sets.push(deck.cards);
  return index;
}
customDecks.forEach(registerDeck);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const key='desperate-gpa-best-v1';
const orderKey='desperate-gpa-order-v1';
const lastOrders={};
try{Object.assign(lastOrders,JSON.parse(localStorage.getItem(orderKey))||{});}catch{}
function makeQuestion(levelIndex,questionIndex){
  const base=sets[levelIndex][questionIndex];
  const question=random([base,...(base.variants || [])]);
  return {...question,options:shuffle(question.options)};
}
const reactions={
  idle:{sprite:'Idle.gif', icon:'', lines:['Think fast. My tails are already warmed up.','Ready to make the scoreboard nervous?']},
  play:{sprite:'Idle.gif', icon:'', lines:['Your move.','Catch it.','Read the question.']},
  hit:{sprite:'Hit.png', icon:'✦', lines:['Clean hit!','Fast paws.','Nice. Can you chain another?']},
  miss:{sprite:'Miss.png', icon:'…', lines:['One shield. You’ve still got this.','That one slipped through. Get the next.','Spot the highlighted bit. Then we’re back in.']},
  taunt:{sprite:'Boss.png', icon:'!?', lines:['Still calculating? My tails got there first.','Come on. I’ve already picked mine.','Clock’s ticking. Catch me if you can.']},
  rush:{sprite:'Boss.png', icon:'!!', lines:['Tick, tick. Pick one!','Going, going…','Last shot. Show me what you’ve got.']},
  boss:{sprite:'Boss.png', icon:'!', lines:['Double points. Try to keep up.','I’d bet a tail on this one.','Last wave. Make it count.']},
  retry:{sprite:'Boss.png', icon:'↻', lines:['Rematch? I’m shuffling the deck.','Same arena. New opening.']},
  clear:{sprite:'Hit.png', icon:'✦', lines:['I’m counting that as a flex.','Nice run. Now beat your ghost.']}
};
let currentMood='idle';
function sprite(){
  const reaction=reactions[currentMood];
  const name=reduced.matches&&reaction.sprite==='Idle.gif'?'Still.png':reaction.sprite;
  byId('rush-pet').src='assets/Tuz_'+name;
}
function react(mood){
  currentMood=mood;
  const reaction=reactions[mood];
  byId('pet-wrap').dataset.mood=mood==='clear'?'hit':mood==='retry'?'boss':mood==='rush'?'taunt':mood;
  byId('emote').textContent=reaction.icon;
  byId('emote').hidden=!reaction.icon;
  byId('taunt').textContent=random(reaction.lines);
  byId('tuz-chat').dataset.mood=mood;
  byId('taunt').dataset.urgent=String(mood==='rush');
  sprite();
}
reduced.addEventListener('change',sprite);
const tuzChat=byId('tuz-chat'), tuzGrab=byId('pet-wrap');
const petPos={x:12,y:0,width:315,height:95,pointer:null,offsetX:0,offsetY:0,travel:null,restUntil:0,dropped:false,initialized:false};
const randomBetween=(min,max)=>min+Math.random()*(max-min);
function floorY(){return Math.max(0,innerHeight-petPos.height-8);}
function rightEdge(){return Math.max(0,innerWidth-petPos.width-8);}
function placeTuz(x,y){
  petPos.x=Math.max(0,Math.min(rightEdge(),x));
  petPos.y=Math.max(0,Math.min(floorY(),y));
  const startButton=byId('start');
  if(!startButton.hidden&&petPos.pointer===null&&!petPos.dropped){
    const button=startButton.getBoundingClientRect();
    const overlapsX=petPos.x<button.right+8&&petPos.x+petPos.width>button.left-8;
    const overlapsY=petPos.y<button.bottom+8&&petPos.y+petPos.height>button.top-8;
    if(overlapsX&&overlapsY){
      if(button.right+8<=rightEdge())petPos.x=button.right+8;
      else petPos.y=Math.max(0,button.top-petPos.height-8);
    }
  }
  tuzChat.style.transform='translate3d('+petPos.x+'px,'+petPos.y+'px,0)';
}
function measureTuz(){
  petPos.width=tuzChat.offsetWidth;
  petPos.height=tuzChat.offsetHeight;
  if(!petPos.initialized){
    petPos.initialized=true;placeTuz(12,floorY());
  }else{
    placeTuz(petPos.x,petPos.pointer===null&&!petPos.dropped?floorY():petPos.y);
  }
}
new ResizeObserver(measureTuz).observe(tuzChat);
window.addEventListener('resize',measureTuz);
measureTuz();
function travelTuz(x,y,time,duration){
  petPos.travel={x0:petPos.x,y0:petPos.y,x,y,time,duration};
}
function moveTuz(time){
  if(petPos.pointer!==null)return;
  if(reduced.matches){
    if(petPos.dropped&&time>=petPos.restUntil){petPos.dropped=false;placeTuz(petPos.x,floorY());}
    petPos.travel=null;return;
  }
  if(petPos.travel){
    const {x0,y0,x,y,time:start,duration}=petPos.travel;
    const t=Math.min(1,Math.max(0,(time-start)/duration));
    const ease=t*t*(3-2*t);
    placeTuz(x0+(x-x0)*ease,y0+(y-y0)*ease);
    if(t===1){
      petPos.travel=null;
      petPos.restUntil=time+randomBetween(350,1250);
    }
    return;
  }
  if(time<petPos.restUntil)return;
  if(petPos.dropped){
    petPos.dropped=false;
    travelTuz(petPos.x,floorY(),time,750);
    return;
  }
  const limit=rightEdge();
  if(limit<16)return;
  let x=randomBetween(8,limit);
  if(Math.abs(x-petPos.x)<Math.min(110,limit*.25)){
    x=petPos.x<limit/2?randomBetween(limit*.64,limit):randomBetween(8,limit*.36);
  }
  travelTuz(x,floorY(),time,Math.max(1000,Math.min(7000,Math.abs(x-petPos.x)*randomBetween(8,13))));
}
tuzGrab.addEventListener('pointerdown',event=>{
  if(event.button!==0||petPos.pointer!==null)return;
  petPos.pointer=event.pointerId;petPos.travel=null;
  petPos.offsetX=event.clientX-petPos.x;petPos.offsetY=event.clientY-petPos.y;
  tuzGrab.dataset.dragging='true';
  tuzGrab.setPointerCapture(event.pointerId);
});
tuzGrab.addEventListener('pointermove',event=>{
  if(event.pointerId!==petPos.pointer)return;
  placeTuz(event.clientX-petPos.offsetX,event.clientY-petPos.offsetY);
});
function dropTuz(event){
  if(event.pointerId!==petPos.pointer)return;
  petPos.pointer=null;petPos.dropped=true;
  petPos.restUntil=performance.now()+1800;
  tuzGrab.dataset.dragging='false';
}
for(const name of ['pointerup','pointercancel','lostpointercapture'])tuzGrab.addEventListener(name,dropTuz);
tuzGrab.addEventListener('keydown',event=>{
  const delta={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]}[event.key];
  if(!delta)return;
  event.preventDefault();petPos.travel=null;petPos.dropped=true;
  petPos.restUntil=performance.now()+1800;
  placeTuz(petPos.x+delta[0],petPos.y+delta[1]);
});
function makeReason(text){
  const reason=document.createElement('span');
  reason.className='reason';
  const split=text.search(/;|:\s|[.!?](?=\s|$)/u);
  const end=split<0?text.length:split;
  const focus=document.createElement('strong');
  focus.textContent=text.slice(0,end);
  reason.append(focus,document.createTextNode(text.slice(end)));
  return reason;
}
function explain(verdict, question){
  const tag=document.createElement('span');
  tag.className='verdict';tag.textContent=verdict;
  const focus=document.createElement('mark');
  focus.textContent=question.answer;
  byId('feedback').replaceChildren(tag,focus,makeReason(question.why));
}
function missedCard({question,selected,wave,stopped}){
  const item=document.createElement('li');
  item.className='miss-card';
  const label=document.createElement('span');
  label.className='label';label.textContent='Wave '+wave;
  const title=document.createElement('h3');
  title.textContent=question.prompt;
  const picked=document.createElement('p'), solution=document.createElement('p'), reason=document.createElement('p');
  const answer=document.createElement('mark');
  answer.textContent=question.answer;
  picked.textContent=stopped?'Run stopped before you picked.':selected?'Your pick · '+selected:'Time ran out before you picked.';
  solution.append('Correct · ',answer);
  reason.append('Why it works · ',makeReason(question.why));
  item.append(label,title,picked,solution,reason);
  if(question.source){
    const source=document.createElement('button');
    source.type='button';
    source.textContent='Open source · '+question.source.label;
    source.onclick=async()=>{
      const tab=window.open('about:blank','_blank');
      if(!tab){source.textContent='Allow pop-ups to open the source';return;}
      tab.opener=null;
      try{await TuzPacks.open(question.source,tab);}
      catch(error){tab.close();source.textContent=error.message;}
    };
    item.append(source);
  }
  return item;
}
let records={};
try{records=JSON.parse(localStorage.getItem(key))||{};}catch{}
const sectionKey='desperate-gpa-section-v1';
let level=0, round=[], index=0, shields=3, score=0, runStartScore=0, streak=0, correct=0, misses=[];
try{
  const saved=localStorage.getItem(sectionKey);
  const savedLevel=levels.findIndex((_,index)=>deckStorageId(index)===saved);
  if(savedLevel>=0)level=savedLevel;
}catch{}
function selectSection(index){
  level=index;
  byId('level').value=String(level);
  byId('deck-picker-open').textContent=levels[level][0]+' ▾';
  try{localStorage.setItem(sectionKey,deckStorageId(level));}catch{}
}
let outcomes=[];
let state='idle', deadline=0, duration=0, transition=0, audio, soundOn=true;
let tauntStage=0, lastTick=0, scoreMotion, gainMotion, comboMotion;
const demoGroup=document.createElement('optgroup');
demoGroup.label='Preset decks';
const customGroup=document.createElement('optgroup');
customGroup.label='Your material';
levels.forEach(([title],i)=>{
  const group=i<customDeckStart?demoGroup:customGroup;
  group.append(new Option(title,i));
});
byId('level').append(demoGroup);
if(customDecks.length)byId('level').append(customGroup);
byId('level').value=String(level);
const deckPicker=byId('deck-picker');
const pickerButton=document.createElement('button');
pickerButton.id='deck-picker-open';pickerButton.type='button';
pickerButton.setAttribute('aria-haspopup','dialog');
pickerButton.textContent=levels[level][0]+' ▾';
byId('level').hidden=true;
byId('level').after(pickerButton);
document.querySelector('label[for="level"]').htmlFor='deck-picker-open';
function renderDeckPicker(){
  const query=byId('deck-search').value.trim().toLowerCase();
  const list=byId('deck-picker-list');list.replaceChildren();
  const groups=new Map();
  const folders=new Map();
  for(const option of [...customGroup.children,...demoGroup.children]){
    const deck=customDecks[Number(option.value)-customDeckStart];
    const folderName=deck?.pack==='EECS 220 Exam 2'?'eecs220_exam2':deck?.pack;
    const name=folderName?deck.chapter:option.parentElement.label;
    if(![folderName,deck?.pack,name,option.textContent].join(' ').toLowerCase().includes(query))continue;
    let destination=groups;
    if(folderName){
      if(!folders.has(folderName))folders.set(folderName,new Map());
      destination=folders.get(folderName);
    }
    if(!destination.has(name))destination.set(name,[]);
    destination.get(name).push(option);
  }
  function renderGroup(container,name,options){
    const heading=document.createElement('h3');heading.textContent=name;container.append(heading);
    for(const option of options){
      const button=document.createElement('button');
      button.type='button';button.textContent=option.textContent;
      button.setAttribute('aria-pressed',String(Number(option.value)===level));
      button.onclick=()=>{selectSection(Number(option.value));reset();deckPicker.close();};
      container.append(button);
    }
  }
  if(folders.size){
    const heading=document.createElement('h3');
    heading.textContent='Imported study decks';
    list.append(heading);
  }
  for(const [name,chapters] of folders){
    const folder=document.createElement('details');
    folder.className='deck-folder';
    folder.open=Boolean(query);
    const summary=document.createElement('summary');
    summary.textContent=name;
    const content=document.createElement('div');
    content.className='deck-folder-content';
    for(const [chapter,options] of chapters)renderGroup(content,chapter,options);
    folder.append(summary,content);
    list.append(folder);
  }
  for(const [name,options] of groups)renderGroup(list,name,options);
  if(!list.children.length)list.textContent='No matching decks.';
}
pickerButton.onclick=()=>{byId('deck-search').value='';renderDeckPicker();deckPicker.showModal();byId('deck-search').focus();};
byId('deck-search').oninput=renderDeckPicker;
byId('picker-close').onclick=()=>deckPicker.close();
const materialPanel=byId('material-panel');
const packPromptToggle=byId('pack-prompt-toggle');
const packPromptPanel=byId('pack-prompt-panel');
packPromptToggle.onclick=()=>{
  packPromptPanel.hidden=!packPromptPanel.hidden;
  packPromptToggle.setAttribute('aria-expanded',String(!packPromptPanel.hidden));
};
byId('pack-prompt-copy').onclick=async()=>{
  const prompt=byId('pack-prompt-text');
  const status=byId('pack-prompt-status');
  try{
    await navigator.clipboard.writeText(prompt.value);
    status.textContent='Copied';
  }catch{
    byId('pack-prompt-preview').open=true;
    prompt.focus();
    prompt.select();
    status.textContent='Press Ctrl+C or Command+C to copy.';
  }
};
const deckEditor=byId('deck-editor');
const editButton=document.createElement('button');
editButton.type='button';
editButton.textContent='Edit deck';
editButton.hidden=true;
byId('add-material').after(editButton);
const editCard=byId('edit-card');
const editStatus=byId('edit-status');
const currentDeck=()=>customDecks[level-customDeckStart];
function showCard(index){
  const cards=currentDeck().cards;
  editCard.replaceChildren(...cards.map((card,i)=>new Option((i+1)+'. '+card.prompt.slice(0,65),i)));
  editCard.value=String(index);
  byId('edit-position').textContent='Question '+(index+1)+' of '+cards.length;
  byId('edit-prev').disabled=index===0;
  byId('edit-next').disabled=index===cards.length-1;
  const grid=byId('edit-card-grid');
  const scrollTop=grid.scrollTop;
  grid.replaceChildren(...cards.map((card,i)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='edit-question-card';
    button.setAttribute('aria-pressed',String(i===index));
    const number=document.createElement('span');
    number.className='card-number';number.textContent=String(i+1).padStart(2,'0');
    const prompt=document.createElement('strong');prompt.textContent=card.prompt;
    const answer=document.createElement('span');answer.textContent=card.answer;
    button.append(number,prompt,answer);
    button.onclick=()=>navigateCard(i);
    return button;
  }));
  grid.scrollTop=scrollTop;
  const cardButton=grid.children[index];
  if(grid.clientHeight){
    const viewport=grid.getBoundingClientRect();
    const selected=cardButton.getBoundingClientRect();
    if(selected.top<viewport.top)grid.scrollTop+=selected.top-viewport.top-5;
    if(selected.bottom>viewport.bottom)grid.scrollTop+=selected.bottom-viewport.bottom+5;
  }
  const card=cards[index];
  byId('edit-prompt').value=card.prompt;
  byId('edit-choices').replaceChildren(...card.options.map((choice,i)=>{
    const row=document.createElement('div');row.className='edit-choice-row';
    const radio=document.createElement('input');
    radio.type='radio';radio.name='edit-correct';radio.checked=choice===card.answer;
    radio.setAttribute('aria-label','Mark answer '+(i+1)+' correct');
    const input=document.createElement('input');
    input.type='text';input.required=true;input.maxLength=140;input.value=choice;
    input.setAttribute('aria-label','Answer '+(i+1));
    const tag=document.createElement('span');tag.className='correct-tag';
    tag.textContent='Correct';tag.setAttribute('aria-hidden','true');
    row.append(radio,input,tag);return row;
  }));
  byId('edit-why').value=card.why;
  byId('edit-remove').disabled=cards.length<=5;
  byId('edit-deck-form').dataset.dirty='false';
}
function navigateCard(index){
  if(index===Number(editCard.value))return;
  if(byId('edit-deck-form').dataset.dirty==='true' && !window.confirm('Discard unsaved edits to this question?'))return;
  showCard(index);
  editStatus.textContent='';
}
editButton.onclick=()=>{
  editStatus.textContent='';
  closeRename();
  byId('edit-card-grid').scrollTop=0;
  showCard(0);
  deckEditor.showModal();
};
function closeRename(){
  const trigger=byId('rename-deck-open');
  trigger.textContent=currentDeck().title;
  trigger.setAttribute('aria-expanded','false');
  byId('rename-deck-form').hidden=true;
}
byId('rename-deck-open').onclick=()=>{
  const trigger=byId('rename-deck-open');
  if(!byId('rename-deck-form').hidden){closeRename();return;}
  trigger.setAttribute('aria-expanded','true');
  const input=byId('rename-deck-name');
  input.value=currentDeck().title;
  byId('rename-deck-status').textContent='';
  byId('rename-deck-form').hidden=false;
  input.focus();
  input.select();
};
byId('rename-deck-cancel').onclick=()=>{
  closeRename();
  byId('rename-deck-open').focus();
};
byId('rename-deck-form').onsubmit=event=>{
  event.preventDefault();
  const input=byId('rename-deck-name');
  const status=byId('rename-deck-status');
  const title=input.value.trim();
  if(!title){status.textContent='Enter a module name.';return;}
  const deck=currentDeck();
  const renamed={...deck,title};
  if(!TuzMaterials.save(customDecks.map(entry=>entry===deck?renamed:entry))){
    status.textContent='Could not save the name in this browser.';
    return;
  }
  deck.title=title;
  levels[level]=[title,'Your material · '+title];
  customGroup.children[level-customDeckStart].textContent=title;
  selectSection(level);
  paint();
  closeRename();
  byId('rename-deck-open').focus();
  editStatus.textContent='Module renamed.';
};
byId('edit-prev').onclick=()=>navigateCard(Number(editCard.value)-1);
byId('edit-next').onclick=()=>navigateCard(Number(editCard.value)+1);
byId('edit-deck-form').oninput=event=>{event.currentTarget.dataset.dirty='true';};
function canCloseEditor(){
  return byId('edit-deck-form').dataset.dirty!=='true'||window.confirm('Discard unsaved edits to this question?');
}
byId('edit-close').onclick=()=>{if(canCloseEditor())deckEditor.close();};
deckEditor.addEventListener('cancel',event=>{if(!canCloseEditor())event.preventDefault();});
byId('delete-deck').onclick=()=>{
  const deck=currentDeck();
  if(!deck||!window.confirm('Remove “'+deck.title+'” and its best score?'))return;
  const removed=level-customDeckStart;
  const remaining=customDecks.filter((_,index)=>index!==removed);
  if(!TuzMaterials.save(remaining)){
    editStatus.textContent='Could not remove the deck. Browser storage is unavailable.';
    return;
  }
  const lastId=customDecks.length;
  for(const [entries,storageKey] of [[records,key],[lastOrders,orderKey]]){
    for(let id=removed+1;id<lastId;id++){
      if(Object.hasOwn(entries,id+1))entries[id]=entries[id+1];
      else delete entries[id];
    }
    delete entries[lastId];
    try{localStorage.setItem(storageKey,JSON.stringify(entries));}catch{}
  }
  customDecks.splice(removed,1);
  levels.splice(level,1);
  sets.splice(level,1);
  customGroup.replaceChildren(...customDecks.map((entry,index)=>new Option(entry.title,customDeckStart+index)));
  if(!customDecks.length)customGroup.remove();
  deckEditor.close();
  selectSection(0);
  reset();
  pickerButton.focus();
  byId('feedback').textContent='Deck removed.';
};
function saveCardChanges(cards,index,message){
  const deck=currentDeck();
  deck.cards.splice(0,deck.cards.length,...cards);
  const saved=TuzMaterials.save(customDecks);
  showCard(index);
  editStatus.textContent=message+(saved?'':' Saved for this tab only. Browser storage is unavailable.');
}
byId('edit-remove').onclick=()=>{
  const cards=currentDeck().cards;
  const index=Number(editCard.value);
  if(cards.length<=5)return;
  saveCardChanges(cards.filter((_,i)=>i!==index),Math.min(index,cards.length-2),'Question deleted.');
};
byId('edit-deck-form').onsubmit=event=>{
  event.preventDefault();
  const index=Number(editCard.value);
  const cards=[...currentDeck().cards];
  const rows=[...byId('edit-choices').children];
  const options=rows.map(row=>row.querySelector('input[type=text]').value.trim());
  const selected=rows.findIndex(row=>row.firstElementChild.checked);
  const previous=cards[index];
  cards[index]={
    prompt:byId('edit-prompt').value,options,
    answer:options[selected],why:byId('edit-why').value
  };
  try{
    const validated=TuzMaterials.fromAgent(currentDeck().title,{cards});
    if(validated.cards.length!==cards.length)throw new Error('Use a unique prompt, four distinct choices, and an answer that matches one choice.');
    const updated=validated.cards[index];
    if(previous.source)updated.source=previous.source;
    cards[index]=updated;
    saveCardChanges(cards,index,'Question saved.');
  }catch(error){editStatus.textContent=error.message;}
};
const materialForm=byId('material-form');
const materialText=byId('material-text');
const materialName=byId('material-name');
const materialStatus=byId('material-status');
const materialBuild=byId('material-build');
let importVersion=0;
let agentRequest=null;
const materialMode=materialForm.elements.namedItem('build-mode');
const agentPanel=byId('ai-panel');
const profilePicker=byId('agent-profile');
const agentProvider=byId('agent-provider');
const agentFormat=byId('agent-format');
const agentToken=byId('agent-token');
const profilesKey='desperate-gpa-ai-v1';
const useAgentServer=location.protocol==='http:'&&location.hostname==='127.0.0.1';
const providers={
  ollama:{label:'Ollama', endpoint:'http://127.0.0.1:11434/v1/chat/completions', mode:'chat'},
  openai:{label:'OpenAI', endpoint:'https://api.openai.com/v1/chat/completions', mode:'chat', key:true},
  anthropic:{label:'Anthropic', endpoint:'https://api.anthropic.com/v1/messages', mode:'claude', key:true},
  gemini:{label:'Google Gemini', endpoint:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', mode:'chat', key:true},
  openrouter:{label:'OpenRouter', endpoint:'https://openrouter.ai/api/v1/chat/completions', mode:'chat', key:true},
  custom:{label:'Custom endpoint'}
};
let profiles=[];
let activeProfile=-1;
const sessionKeys=new Map();
try{
  const stored=JSON.parse(localStorage.getItem(profilesKey)||'null');
  if(Array.isArray(stored?.profiles)){
    profiles=stored.profiles.slice(0,10);
    if(Number.isInteger(stored.active)&&Object.hasOwn(providers,profiles[stored.active]?.provider))activeProfile=stored.active;
  }
}catch{}

function modeControls(){
  const mode=materialMode.value;
  byId('agent-settings').hidden=mode!=='agent';
  byId('manual-settings').hidden=mode!=='manual';
  byId('local-material-note').hidden=mode!=='local';
  const connection=profiles[activeProfile];
  byId('agent-summary').textContent=connection
    ? 'Using '+connection.name+'.'
    : 'Choose a provider and model first.';
  materialBuild.textContent={local:'Make deck',agent:'Generate questions',manual:'Import agent deck'}[mode];
}

function updateAiFields(){
  const preset=providers[agentProvider.value];
  const custom=agentProvider.value==='custom';
  byId('agent-custom').hidden=custom&&profilePicker.value==='-1';
  const needsModel=!(custom&&agentFormat.value==='webhook');
  byId('ai-custom-fields').hidden=!custom;
  agentFormat.disabled=!custom;
  byId('agent-url').disabled=!custom;
  byId('agent-url').required=custom;
  byId('agent-model-field').hidden=!needsModel;
  byId('agent-model').disabled=!needsModel;
  byId('agent-model').required=needsModel;
  agentToken.required=Boolean(preset.key);
  byId('agent-token-field').firstChild.textContent=preset.key?'API key ':'API key (optional) ';
}

function loadProfile(index){
  const profile=profiles[index];
  agentProvider.value=profile?.provider||'ollama';
  agentFormat.value=profile?.mode==='webhook'?'webhook':'chat';
  byId('agent-url').value=profile?.provider==='custom'?profile.endpoint:'';
  byId('agent-model').value=profile?.model||'';
  agentToken.value=sessionKeys.get(index)||'';
  updateAiFields();
}

function openAiPanel(){
  byId('ai-status').hidden=true;
  byId('agent-launch').hidden=useAgentServer;
  byId('agent-profile-field').hidden=!profiles.length;
  profilePicker.replaceChildren(new Option('New connection','-1'),
    ...profiles.map((profile,index)=>new Option(profile.name,String(index))));
  profilePicker.value=String(activeProfile);
  loadProfile(activeProfile);
  agentPanel.showModal();
}

function getConnection(){
  const provider=agentProvider.value;
  const preset=providers[provider];
  const mode=preset.mode||agentFormat.value;
  const endpoint=preset.endpoint||byId('agent-url').value.trim();
  const model=mode==='webhook'?'':byId('agent-model').value.trim();
  let url;
  try{url=new URL(endpoint);}catch{throw new Error('Enter the full endpoint URL.');}
  if(url.username||url.password||url.hash||url.search)throw new Error('Use the key field for credentials and remove query parameters or fragments from the endpoint.');
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))){
    throw new Error('Use HTTPS for hosted providers or HTTP on localhost.');
  }
  if(mode!=='webhook'&&!model)throw new Error('Enter the model ID from your provider.');
  return {provider,name:model?preset.label+' · '+model:preset.label,endpoint,model,mode};
}

byId('configure-ai').onclick=openAiPanel;
byId('configure-from-material').onclick=openAiPanel;
byId('ai-close').onclick=()=>agentPanel.close();
byId('agent-custom').onclick=()=>{
  profilePicker.value='-1';
  loadProfile(-1);
  agentProvider.value='custom';
  updateAiFields();
  byId('agent-url').focus();
};
byId('agent-manual').onclick=()=>{
  agentPanel.close();
  materialMode.value='manual';
  modeControls();
  if(!materialPanel.open){
    reportMaterial('');
    materialPanel.showModal();
  }
  materialText.focus();
};
agentPanel.addEventListener('close',()=>{agentToken.value='';});
profilePicker.onchange=()=>loadProfile(Number(profilePicker.value));
agentProvider.onchange=()=>{agentToken.value='';updateAiFields();};
agentFormat.onchange=updateAiFields;
byId('ai-form').onsubmit=event=>{
  event.preventDefault();
  try{
    const profile=getConnection();
    const token=agentToken.value.trim();
    if(providers[profile.provider].key&&!token)throw new Error('Enter your provider’s API key.');
    let index=Number(profilePicker.value);
    if(index<0){
      index=profiles.findIndex(saved=>saved.endpoint===profile.endpoint&&saved.model===profile.model&&saved.mode===profile.mode);
      if(index<0)index=profiles.length;
    }
    if(index>=10)throw new Error('Select an existing connection to replace it. This browser can save up to ten.');
    const next=[...profiles];
    next[index]=profile;
    try{localStorage.setItem(profilesKey,JSON.stringify({profiles:next,active:index}));}catch{}
    profiles=next;
    activeProfile=index;
    sessionKeys.set(index,token);
    materialMode.value='agent';
    modeControls();
    reportMaterial('Using '+profile.name+'.');
    agentPanel.close();
  }catch(error){
    const status=byId('ai-status');
    status.textContent=error.message||'Could not save the connection.';
    status.dataset.error='true';
    status.hidden=false;
  }
};
if(activeProfile>=0)materialMode.value='agent';
modeControls();
byId('material-mode').onchange=modeControls;
byId('copy-agent-prompt').onclick=async()=>{
  try{
    const prompt=TuzMaterials.agentPrompt(materialName.value,materialText.value);
    const field=byId('manual-prompt');
    field.value=prompt;
    byId('manual-prompt-field').hidden=false;
    const toast=byId('copy-toast');
    toast.hidden=false;
    clearTimeout(toast.hideTimer);
    toast.hideTimer=setTimeout(()=>{toast.hidden=true;},1800);
    try{
      await navigator.clipboard.writeText(prompt);
      reportMaterial('Prompt copied. Paste it into your agent.');
    }catch{
      field.focus();field.select();
      reportMaterial('The prompt is selected. Press Ctrl+C to copy it.');
    }
  }catch(error){
    reportMaterial(error.message,true);
  }
};
function reportMaterial(message,error=false){
  materialStatus.textContent=message;
  materialStatus.dataset.error=String(error);
}
async function generateWithAgent(profile,token,prompt,signal){
  if(useAgentServer){
    const response=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...profile,token,prompt}),signal});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error||'The agent request failed.');
    return payload.result;
  }
  const headers={'Content-Type':'application/json'};
  const messages=[{role:'user',content:prompt}];
  let body={model:profile.model,messages,stream:false};
  if(profile.mode==='claude'){
    headers['x-api-key']=token;
    headers['anthropic-version']='2023-06-01';
    headers['anthropic-dangerous-direct-browser-access']='true';
    body={model:profile.model,messages,max_tokens:4096};
  }else{
    if(token)headers.Authorization='Bearer '+token;
    if(profile.mode==='webhook')body={prompt};
  }
  let response;
  try{
    response=await fetch(profile.endpoint,{method:'POST',headers,body:JSON.stringify(body),
      credentials:'omit',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(120000)])});
  }catch(error){
    if(signal.aborted)throw error;
    if(error.name==='TimeoutError')throw new Error('The model took too long. Try a shorter excerpt.');
    throw new Error('Could not reach the endpoint from this page. Check the URL and browser access (CORS), or use Manual AI chat.');
  }
  if(!response.ok)throw new Error('The provider returned HTTP '+response.status+'. Check the endpoint, model, and API key.');
  const payload=await response.json();
  if(profile.mode==='claude')return payload.content?.filter(block=>block.type==='text').map(block=>block.text).join('');
  if(profile.mode==='webhook')return payload.deck??payload;
  return payload.choices?.[0]?.message?.content;
}
byId('add-material').onclick=()=>{
  reportMaterial('');
  materialPanel.showModal();
};
byId('material-close').onclick=()=>materialPanel.close();
byId('pack-file').onchange=async event=>{
  const file=event.target.files[0];
  event.target.value='';
  if(!file || materialBuild.disabled)return;
  materialBuild.disabled=true;
  event.target.disabled=true;
  reportMaterial('Importing '+file.name+'…');
  try{
    const decks=await TuzPacks.read(file,TuzMaterials.maxDecks-customDecks.length,customDecks);
    if(!TuzMaterials.save([...customDecks,...decks]))throw new Error('Could not save decks in this browser.');
    const first=levels.length;
    if(!customGroup.isConnected)byId('level').append(customGroup);
    for(const deck of decks){
      customDecks.push(deck);
      customGroup.append(new Option(deck.title,registerDeck(deck)));
    }
    selectSection(first);
    reset();
    byId('feedback').textContent=decks.length+' study modules imported.';
    materialPanel.close();
  }catch(error){
    reportMaterial(error.message||'Could not import this study pack.',true);
  }finally{
    materialBuild.disabled=false;
    event.target.disabled=false;
  }
};
materialPanel.addEventListener('close',()=>{
  importVersion++;
  agentRequest?.abort();
  agentRequest=null;
  materialBuild.disabled=false;
  byId('material-file').value='';
  byId('material-filename').textContent='';
});
byId('material-file').onchange=async event=>{
  const file=event.target.files[0];
  if(!file)return;
  byId('material-filename').textContent=file.name;
  const version=++importVersion;
  reportMaterial('Reading '+file.name+'…');
  materialBuild.disabled=true;
  try{
    const text=await TuzMaterials.readFile(file);
    if(version!==importVersion)return;
    materialText.value=text;
    if(!materialName.value.trim())materialName.value=file.name.replace(/\.[^.]+$/,'').slice(0,70);
    reportMaterial('File loaded. You can edit the text before making your deck.');
  }catch(error){
    if(version===importVersion)reportMaterial(error.message||'Could not read this file.',true);
  }finally{
    if(version===importVersion)materialBuild.disabled=false;
  }
};
const materialDrop=byId('material-drop');
for(const name of ['dragenter','dragover']){
  materialDrop.addEventListener(name,event=>{event.preventDefault();materialDrop.classList.add('drag-over');});
}
materialDrop.addEventListener('dragleave',()=>materialDrop.classList.remove('drag-over'));
materialDrop.addEventListener('drop',event=>{
  event.preventDefault();materialDrop.classList.remove('drag-over');
  const file=event.dataTransfer.files[0];
  if(!file)return;
  const transfer=new DataTransfer();transfer.items.add(file);
  byId('material-file').files=transfer.files;
  byId('material-file').dispatchEvent(new Event('change'));
});
materialForm.onsubmit=async event=>{
  event.preventDefault();
  if(materialBuild.disabled)return;
  try{
    if(customDecks.length>=TuzMaterials.maxDecks)throw new Error('This browser has reached the 20-deck limit.');
    const mode=materialMode.value;
    const title=materialName.value;
    let deck;
    if(mode==='local'){
      deck=TuzMaterials.makeDeck(title,materialText.value);
    }else if(mode==='manual'){
      deck=TuzMaterials.fromAgent(title,byId('agent-reply').value);
    }else{
      const profile=profiles[activeProfile];
      if(!profile){openAiPanel();return;}
      const token=sessionKeys.get(activeProfile)||'';
      if(providers[profile.provider].key&&!token){openAiPanel();return;}
      const prompt=TuzMaterials.agentPrompt(title,materialText.value);
      const request=new AbortController();
      agentRequest=request;
      materialBuild.disabled=true;
      reportMaterial('Waiting for your agent…');
      try{
        const result=await generateWithAgent(profile,token,prompt,request.signal);
        if(!result)throw new Error('The provider did not return a deck.');
        deck=TuzMaterials.fromAgent(title,result);
      }finally{
        if(agentRequest===request){agentRequest=null;materialBuild.disabled=false;}
      }
      if(request.signal.aborted)return;
    }
    customDecks.push(deck);
    const saved=TuzMaterials.save(customDecks);
    const index=registerDeck(deck);
    if(!customGroup.isConnected)byId('level').append(customGroup);
    customGroup.append(new Option(deck.title,index));
    selectSection(index);
    reset();
    byId('feedback').textContent=deck.cards.length+' questions ready. '+(saved?'':'This browser could not save the deck. It is available until you close this tab.');
    materialName.value='';
    materialText.value='';
    byId('agent-reply').value='';
    byId('manual-prompt-field').hidden=true;
    materialPanel.close();
  }catch(error){
    if(error.name!=='AbortError')reportMaterial(error.message||'Could not make a deck from this material.',true);
  }
};
const waveNodes=Array.from({length:5},(_,i)=>{
  const node=document.createElement('li'),number=document.createElement('span');
  const name=document.createElement('span'),status=document.createElement('span');
  node.className='wave-node';node.dataset.boss=String(i===4);
  number.className='node-number';number.textContent=String(i+1);
  name.className='node-name';name.textContent=i===4?'Boss':'Wave '+(i+1);
  status.className='node-state';node.append(number,name,status);
  byId('wave-map').append(node);
  return {node,status};
});
const scoreTier=value=>value>=2300?4:value>=1200?3:value>=500?2:1;
function paint(){
  byId('wave-count').textContent=(state==='idle'?0:index+1)+' / 5';
  waveNodes.forEach(({node,status},i)=>{
    const result=outcomes[i]||(state==='play'&&index===i?'active':'waiting');
    node.dataset.state=result;
    if(result==='active')node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
    status.textContent={active:'Live',hit:'✓ Hit',miss:'× Miss',waiting:'Ready'}[result];
  });
  byId('shields').textContent='◆'.repeat(shields)+'◇'.repeat(3-shields);
  byId('shields').setAttribute('aria-label',shields+' shields left');
  byId('shield-badge').dataset.low=String(shields<=1);
  byId('score').textContent=score.toLocaleString();
  byId('score').setAttribute('aria-label',score+' points');
  byId('score').dataset.tier='red-'+scoreTier(score);
  const multiplier=Math.min(5,1+streak);
  byId('combo').textContent='×'+multiplier;
  byId('combo').dataset.tier=String(multiplier);
  byId('combo').title=streak+' hits in this chain';
  byId('chain-count').textContent=streak>1?streak+' chain':'';
  const growth=Math.max(0,streak-1);
  tuzChat.style.setProperty('--chain-scale',String(Math.min(2.22,1+.024*growth+.012*growth*growth)));
  byId('best').textContent=(Number(records[deckStorageId(level)])||0).toLocaleString();
  const active=state==='play'||state==='feedback';
  byId('deck-context').textContent=levels[level][1]+(index===4&&active?' · Boss':'');
  byId('add-material').disabled=active;
  byId('configure-ai').disabled=active;
  byId('stop-run').hidden=!active;
  editButton.hidden=level<customDeckStart;
  editButton.disabled=active;

}
function popScore(gain, previous){
  const scoreNode=byId('score'), gainNode=byId('score-gain');
  const crossed=scoreTier(previous)<scoreTier(score);
  scoreMotion?.cancel();gainMotion?.cancel();comboMotion?.cancel();
  gainNode.textContent='+'+gain.toLocaleString();
  if(reduced.matches)return;
  const bump=crossed?1.28:1.16;
  if(window.gsap){
    const comboNode=byId('combo');
    const timeline=gsap.timeline({onComplete:()=>{
      gsap.set([scoreNode,comboNode,gainNode],{clearProps:'transform,opacity'});
    }});
    gsap.set([scoreNode,comboNode],{scale:1});
    timeline.to(scoreNode,{scale:bump,duration:.10,ease:'power2.out'},0)
      .to(scoreNode,{scale:1,duration:crossed?.42:.30,ease:'back.out(1.6)'},.10)
      .to(comboNode,{scale:crossed?1.20:1.12,duration:.12,ease:'power2.out'},.04)
      .to(comboNode,{scale:1,duration:.32,ease:'back.out(1.4)'},.16)
      .fromTo(gainNode,{xPercent:-50,yPercent:-20,opacity:0},
        {yPercent:-95,opacity:1,duration:.16,ease:'power2.out'},0)
      .to(gainNode,{yPercent:-210,opacity:0,duration:.5,ease:'power1.in'},.23);
    scoreMotion={cancel(){
      timeline.kill();
      gsap.set([scoreNode,comboNode,gainNode],{clearProps:'transform,opacity'});
    }};
    gainMotion=null;comboMotion=null;
    return;
  }
  scoreMotion=scoreNode.animate([
    {transform:'scale(1)'},
    {transform:'scale('+bump+')',offset:.23},
    {transform:'scale(1)'}
  ],{duration:crossed?460:340,easing:'ease-out'});
  comboMotion=byId('combo').animate([
    {transform:'scale(1)'},{transform:'scale(1.14)',offset:.23},{transform:'scale(1)'}
  ],{duration:400,easing:'ease-out'});
  gainMotion=gainNode.animate([
    {transform:'translate(-50%,-20%)',opacity:0},
    {transform:'translate(-50%,-90%)',opacity:1,offset:.2},
    {transform:'translate(-50%,-190%)',opacity:0}
  ],{duration:740,easing:'ease-out'});
}
// Short original synth cues. Each note is [MIDI pitch, start, duration, voice, gain].
const sounds={
  toggle:[[72,0,.08,'sine',.045],[79,.07,.11,'triangle',.04]],
  launch:[[55,0,.09,'triangle',.045],[62,.065,.09,'triangle',.045],[67,.13,.13,'triangle',.045]],
  boss:[[43,0,.2,'triangle',.075],[43,.14,.17,'triangle',.075],[55,.28,.24,'sawtooth',.035]],
  miss:[[55,0,.11,'triangle',.06],[48,.07,.18,'triangle',.055]],
  critical:[[52,0,.15,'triangle',.065],[43,.1,.2,'triangle',.06],[43,.28,.13,'sine',.045]],
  tick:[[77,0,.045,'sine',.025]],
  timeout:[[49,0,.14,'square',.032],[43,.105,.21,'triangle',.055]],
  tier:[[79,0,.08,'triangle',.06],[83,.065,.09,'triangle',.05],[86,.13,.1,'sine',.05],[91,.195,.21,'triangle',.04]],
  clear:[[67,0,.11,'triangle',.05],[71,.09,.11,'triangle',.05],[74,.18,.11,'triangle',.045],[79,.27,.23,'sine',.06]],
  record:[[67,0,.11,'triangle',.055],[71,.08,.1,'triangle',.05],[74,.16,.1,'triangle',.05],[79,.24,.12,'triangle',.06],[83,.32,.12,'sine',.06],[86,.42,.28,'triangle',.055]],
  fail:[[60,0,.13,'triangle',.05],[56,.105,.15,'triangle',.045],[48,.215,.24,'sine',.06]],
  retry:[[62,0,.08,'triangle',.045],[65,.06,.08,'triangle',.045],[69,.12,.15,'triangle',.05]]
};
let effectsBus;
async function playEffect(cue){
  if(!soundOn)return;
  try{
    if(!audio||audio.state==='closed')audio=new (window.AudioContext||window.webkitAudioContext)();
    if(!effectsBus){
      effectsBus=audio.createGain();
      effectsBus.gain.value=.95;
      effectsBus.connect(audio.destination);
    }
    if(audio.state==='suspended')await audio.resume();
    if(!soundOn||audio.state!=='running')return;
    const pitch=64+Math.min(streak-1,4)*2;
    const notes=cue==='hit'
      ?[[pitch,0,.09,'triangle',.055],[pitch+7,.058,.14,'sine',.06]]
      :sounds[cue];
    const now=audio.currentTime+.015;
    for(const [midi,offset,length,voice,volume] of notes){
      const oscillator=audio.createOscillator(), envelope=audio.createGain(), at=now+offset;
      oscillator.type=voice;
      oscillator.frequency.value=440*2**((midi-69)/12);
      envelope.gain.setValueAtTime(.0001,at);
      envelope.gain.linearRampToValueAtTime(Math.min(.23,volume*2.4),at+.008);
      envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
      oscillator.connect(envelope).connect(effectsBus);
      oscillator.start(at);oscillator.stop(at+length);
      oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
    }
  }catch{
    byId('sound').textContent='Retry SFX';
    byId('sound').title='Audio could not start. Click to try again.';
  }
}
function reset(keepChain=false){
  clearTimeout(transition);
  scoreMotion?.cancel();gainMotion?.cancel();comboMotion?.cancel();
  state='idle';document.body.classList.remove('review-open');outcomes=[];byId('ready-panel').hidden=false;index=0;shields=3;
  if(!keepChain){score=0;streak=0;}
  runStartScore=score;correct=0;misses=[];
  byId('targets').replaceChildren();byId('result').hidden=true;byId('next-level').hidden=true;byId('next-wave').hidden=true;
  byId('start').hidden=false;byId('start').textContent='Start run';
  byId('arena').dataset.state='idle';byId('question').textContent='Ready to play?';
  byId('feedback').textContent='';
  byId('fill').style.transform='scaleX(1)';byId('fill').classList.remove('urgent');
  react('idle');paint();
}
function start(keepChain=false){
  const retry=state!=='idle'&&!keepChain;
  reset(keepChain);
  const set=sets[level];
  const indices=set.map((_,i)=>i);
  const order=shuffle(indices).slice(0,5);
  const storageId=deckStorageId(level);
  const previous=lastOrders[storageId];
  if(Array.isArray(previous)&&order[0]===previous[0]){
    const i=1+Math.floor(Math.random()*(order.length-1));
    [order[0],order[i]]=[order[i],order[0]];
  }
  lastOrders[storageId]=order;
  try{localStorage.setItem(orderKey,JSON.stringify(lastOrders));}catch{}
  round=order.map(i=>makeQuestion(level,i));
  byId('start').hidden=true;byId('ready-panel').hidden=true;
  launch();
  if(retry)react('retry');
  playEffect(retry?'retry':'launch');
}
function stop(){
  if(state!=='play'&&state!=='feedback')return;
  if(state==='play'){
    outcomes[index]='miss';
    misses.push({question:round[index],wave:index+1,stopped:true});
  }
  finish(true);
}
function launch(){
  const q=round[index];
  byId('next-wave').hidden=true;
  state='play';tauntStage=0;lastTick=0;duration=index===4?15000:10000;deadline=performance.now()+duration;
  byId('arena').dataset.state=index===4?'boss':'play';
  byId('question').textContent=q.prompt;
  byId('feedback').textContent=index===4?'Boss wave · 2× points':'';
  react(index===4?'boss':'play');
  if(index===4)playEffect('boss');
  byId('targets').dataset.count=String(q.options.length);
  byId('targets').replaceChildren(...q.options.map((answer,i)=>{
    const button=document.createElement('button');button.type='button';button.className='target';
    button.style.setProperty('--speed',(1.45+i*.17)+'s');
    button.style.setProperty('--lag',(-i*.42)+'s');
    const number=document.createElement('strong');number.textContent=(i+1)+' ';
    button.append(number,document.createTextNode(answer));button.onclick=()=>hit(i);
    return button;
  }));
  paint();
}
function hit(choice){
  if(state!=='play')return;
  const q=round[index];
  if(choice>=q.options.length)return;
  const time=Math.max(0,deadline-performance.now());
  if(time===0)choice=-1;
  const selected=q.options[choice], ok=selected===q.answer;
  state='feedback';outcomes[index]=ok?'hit':'miss';
  const targets=[...byId('targets').children];
  targets.forEach((button,i)=>{button.disabled=true;if(q.options[i]===q.answer)button.dataset.result='correct';else if(i===choice)button.dataset.result='wrong';});
  if(ok){
    const gain=(100+Math.floor(60*time/duration))*Math.min(5,1+streak)*(index===4?2:1);
    const previous=score;
    streak++;correct++;score+=gain;
    popScore(gain,previous);
    explain('HIT +'+gain,q);react('hit');
    const tierUp=scoreTier(previous)<scoreTier(score);
    playEffect(tierUp?'tier':'hit');
  }else{
    shields--;
    misses.push({question:q,selected,wave:index+1});
    explain(choice<0?'Time!':'Shield down.',q);react('miss');
    playEffect(choice<0?'timeout':shields===1?'critical':'miss');
  }
  byId('arena').dataset.state=ok?'hit':'miss';paint();
  byId('next-wave').hidden=false;
  byId('next-wave').textContent=shields===0||index===round.length-1?'See results →':'Next wave →';
  const words=(q.answer+' '+q.why).trim().split(/\s+/).length;
  transition=setTimeout(advance,Math.min(8500,Math.max(ok?3400:4800,1050+words*220)));
}
function advance(){
  if(state!=='feedback')return;
  clearTimeout(transition);
  if(shields===0||index===round.length-1){finish();return;}
  index++;launch();
}
function nextStudyModule(){
  const pack=currentDeck()?.pack;
  if(!pack)return -1;
  const next=customDecks.findIndex((deck,index)=>index>level-customDeckStart&&deck.pack===pack);
  return next<0?-1:customDeckStart+next;
}
function finish(stopped=false){
  clearTimeout(transition);
  const cleared=!stopped&&shields>0;
  const packFinished=cleared&&Boolean(currentDeck()?.pack)&&nextStudyModule()<0;
  state='done';
  byId('next-wave').hidden=true;
  const runPoints=score-runStartScore;
  const storageId=deckStorageId(level);
  const best=Number(records[storageId])||0, newBest=!stopped&&runPoints>best;
  if(newBest){records[storageId]=runPoints;try{localStorage.setItem(key,JSON.stringify(records));}catch{}}
  byId('arena').dataset.state=cleared?'hit':'miss';
  byId('question').textContent=stopped?'Run stopped · Failed':cleared?'Deck cleared':'Shields depleted';
  byId('targets').replaceChildren();
  const runSummary='+'+runPoints.toLocaleString()+' this run · '+correct+' / 5 hits';
  byId('feedback').textContent=(newBest?'New personal best! ':'')+runSummary;
  if(packFinished)byId('feedback').append(' · Last module cleared');
  react(cleared?'clear':'retry');
  playEffect(newBest?'record':cleared?'clear':'fail');
  byId('result-title').textContent=runSummary;
  byId('result-detail').textContent='Total '+score.toLocaleString()+' points. '+(cleared&&!packFinished?'Next run carries your score and chain forward. Retry starts fresh.':'Retry starts fresh with three shields.');
  byId('review').replaceChildren(...misses.map(missedCard));
  byId('review-heading').hidden=!misses.length;
  const showReview=misses.length>0;
  byId('result').hidden=!showReview;
  document.body.classList.toggle('review-open',showReview);
  byId('start').hidden=false;byId('start').textContent='Retry run';
  const next=byId('next-level');
  next.hidden=!cleared||packFinished;
  next.textContent='Next run →';
  paint();(next.hidden?byId('start'):next).focus();
}
function draw(time){
  moveTuz(time);
  if(state==='play'){
    const fraction=Math.max(0,(deadline-time)/duration);
    byId('fill').style.transform='scaleX('+Math.min(1,fraction)+')';
    byId('fill').classList.toggle('urgent',fraction<.27);
    const seconds=Math.ceil((deadline-time)/1000);
    if(seconds>0&&seconds<=2&&seconds!==lastTick){lastTick=seconds;playEffect('tick');}
    if(!fraction)hit(-1);
    else if(fraction<=.22&&tauntStage<2){tauntStage=2;react('rush');}
    else if(fraction<=.54&&tauntStage<1){tauntStage=1;react('taunt');}
  }
  const phase=reduced.matches?0:time/230;
  const path=(amp,freq,offset)=>{
    let d='';for(let x=0;x<=800;x+=8)d+=(x?'L':'M')+x+','+(100+Math.sin(x*freq+phase+offset)*amp).toFixed(1);
    return d;
  };
  byId('trace').setAttribute('d',path(31+Math.min(streak,5)*5,.032,0));
  byId('trace-two').setAttribute('d',path(18,.052,2));
  if(state==='idle'){
    byId('attract-trace').setAttribute('d',path(41,.027,0));
    byId('attract-echo').setAttribute('d',path(22,.054,1.8));
  }
  requestAnimationFrame(draw);
}
byId('level').onchange=()=>{selectSection(Number(byId('level').value));reset();};
byId('start').onclick=()=>start();
byId('stop-run').onclick=stop;
byId('next-wave').onclick=advance;
byId('next-level').onclick=()=>{
  if(state!=='done'||byId('next-level').hidden)return;
  const next=nextStudyModule();
  if(next>=0)selectSection(next);
  start(true);
};
const motionKey='desperate-gpa-gentle-v1';
let gentle=false;
try{gentle=localStorage.getItem(motionKey)==='on';}catch{}
function setOptionMotion(){
  byId('arena').dataset.optionMotion=gentle?'gentle':'full';
  const button=byId('option-motion');
  button.setAttribute('aria-pressed',String(gentle));
  button.textContent=gentle?'Gentler options on':'Gentler options';
}
byId('option-motion').onclick=()=>{
  gentle=!gentle;setOptionMotion();
  try{localStorage.setItem(motionKey,gentle?'on':'off');}catch{}
};
setOptionMotion();
const effectsKey='desperate-gpa-effects-v1';
try{soundOn=localStorage.getItem(effectsKey)!=='off';}catch{}
function syncEffectsButton(){
  byId('sound').setAttribute('aria-pressed',String(soundOn));
  byId('sound').textContent=soundOn?'SFX on':'SFX off';
  byId('sound').title='';
}
syncEffectsButton();
byId('sound').onclick=()=>{
  if(byId('sound').textContent==='Retry SFX'){
    syncEffectsButton();
    playEffect('toggle');
    return;
  }
  soundOn=!soundOn;syncEffectsButton();
  try{localStorage.setItem(effectsKey,soundOn?'on':'off');}catch{}
  if(effectsBus)effectsBus.gain.setTargetAtTime(soundOn ? .95 : 0,audio.currentTime,.012);
  if(soundOn)playEffect('toggle');
};
document.addEventListener('keydown',event=>{
  if(deckPicker.open||agentPanel.open||materialPanel.open||deckEditor.open||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input, textarea, select'))return;
  if(state==='play'&&/^[1-4]$/.test(event.key))hit(Number(event.key)-1);
  if(state==='feedback'&&event.code==='Space'){event.preventDefault();advance();}
  if(event.key==='Escape')stop();
  if((state==='idle'||state==='done')&&event.key.toLowerCase()==='r'){event.preventDefault();start();}
});
reset();requestAnimationFrame(draw);
