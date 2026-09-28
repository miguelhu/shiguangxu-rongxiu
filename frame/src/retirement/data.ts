import raw from './content.json'
export type CaseId = keyof typeof raw
export type Photo = { id: string; path: string; caption: string; date: string; authorId: string; scene?: string }
export type Block = { id: string; kind: string; authorId: string; author: string; relation: string; title: string; body: string; photoIds: string[]; tags: string[]; audio: string; audioText: string; sticker: string }
export type Gift = { schema: 1; caseId: CaseId; address: string; name: string; category: string; host: string; date: string; cover: string; bio: string; photos: Photo[]; blocks: Block[]; letter: string; letterConfirmed: boolean; version: number; fresh: Block[]; media: Photo[]; preview: boolean; updatedAt?: string }
export const titles: Record<CaseId, string[]> = {
  teacher: ['陈老师', '陈明远', '清华大学', '2026-07-18', '荣休礼'],
  leader: ['周老师', '周启山', '远川装备', '2026-06-20', '荣休礼'],
  nurse: ['沈老师', '沈知秋', '晴川医院护理团队', '2026-10-16', '荣休礼'],
  birthday: ['雅琴', '顾雅琴', '家人与朋友', '2026-08-24', '生日礼'],
  anniversary: ['正安与文澜', '正安与文澜', '家人与朋友', '2026-10-01', '婚龄礼'],
}
const relations: Record<string,string> = { student:'学生',research_student:'学生',colleague:'同事',child:'子女',friend:'朋友',subordinate:'下属',family:'家人',spouse:'爱人',peer:'同行' }
export function caseId(): CaseId { const p = new URLSearchParams(location.hash.split('?')[1] || location.search); const id=p.get('case'); return id && id in raw ? id as CaseId : 'teacher' }
export function fixture(id: CaseId): Gift {
  const d=raw[id]; const meta=titles[id]; const authors = new Map(d.authors.map(a=>[a.id,a]));
  const base=(authorId:string) => {const a=authors.get(authorId)!; return {authorId,author:a.name,relation:relations[a.relationCodes[0]] || '亲友',tags:[],audio:'',audioText:'',sticker:'',photoIds:[],title:''} }
  const blocks: Block[] = [
    ...d.stories.map(s=> {const voice=d.voices.find(v=>v.blockId===s.id);return {...base(s.authorId),...s,kind:'story',audio:voice?.path||'',audioText:voice?.text||'',body:s.body}}),
    ...d.authors.map(a=>({...base(a.id),id:a.wishId,kind:'wish',body:a.wish,tags:a.impressions})),
  ]
  const letter=`亲爱的${meta[0]}：\n\n${d.authors.slice(0,5).map(a=>a.wish).join('\n\n')}\n\n把这些心意放在一起，是想让您知道：那些被您认真对待的时光，我们都记得。\n\n所有惦记您的人`
  return {schema:1,caseId:id,address:meta[0],name:meta[1],host:meta[2],date:meta[3],category:meta[4],cover:`images/${id}.png`,bio:'把被记得的时光，留在身边。',photos:[...d.photos].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')),blocks,letter,letterConfirmed:true,version:1,fresh:[],media:d.photos,preview:false}
}
export function validGift(value: unknown, id: CaseId): value is Gift {
  if(!value || typeof value!=='object')return false
  const g=value as Gift
  return g.schema===1 && g.caseId===id && typeof g.address==='string' && typeof g.letter==='string' && Array.isArray(g.photos) && Array.isArray(g.blocks) && Array.isArray(g.fresh) && Array.isArray(g.media)
}
export function readGift(id:CaseId): Gift { try { const g=JSON.parse(localStorage.getItem(`sgx-frame-${new URLSearchParams(location.hash.split('?')[1]).get('preview')==='1'?'preview':'gift'}-v1:${id}`)||'null');if(validGift(g,id))return g }catch{}return fixture(id) }
export const bundled=(path:string)=>`${import.meta.env.BASE_URL}${/^(images|audio)\//.test(path)?'':'retirement/'}${path}`
export function mediaUrl(path:string) { return /^(https?:|blob:|data:)/.test(path)?path:bundled(path.replace(/^\//,'')) }
