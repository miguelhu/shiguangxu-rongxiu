export type ConnectionRequest={id:string,name:string,relation:string,message:string,status:'pending'|'accepted'|'declined'|'removed',createdAt:string}
export type ConnectionState={code:string,expiresAt:number,requests:ConnectionRequest[]}
const KEY='sgx-elder-connections-v1'
export const CONNECTION_EVENT='sgx-connections-changed'
export function readConnections():ConnectionState{try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value?.code&&Array.isArray(value.requests))return value}catch{}return {code:'SGX-CHEN-2026',expiresAt:Date.now()+7*86400000,requests:[]}}
export function writeConnections(state:ConnectionState){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new Event(CONNECTION_EVENT))}
export function ensureInvitation(){const state=readConnections();if(!localStorage.getItem(KEY))writeConnections(state);return state}
export function renewInvitation(){const state={...readConnections(),code:'SGX-'+crypto.randomUUID().slice(0,8).toUpperCase(),expiresAt:Date.now()+7*86400000};writeConnections(state);return state}
export function applyConnection(code:string,name:string,relation:string,message:string){const state=readConnections();if(code.trim().toUpperCase()!==state.code||state.expiresAt<Date.now())throw Error('邀请已失效或邀请码不正确，请向对方索取新邀请。');if(!name.trim()||!relation.trim())throw Error('请填写姓名和关系。');if(state.requests.some(r=>r.name===name.trim()&&['pending','accepted'].includes(r.status)))throw Error('已经提交过申请，请等待确认，或查看已添加的亲友。');const request:ConnectionRequest={id:crypto.randomUUID(),name:name.trim(),relation:relation.trim(),message:message.trim(),status:'pending',createdAt:new Date().toISOString()};writeConnections({...state,requests:[request,...state.requests]});return request}
export function resolveConnection(id:string,status:ConnectionRequest['status']){const state=readConnections();writeConnections({...state,requests:state.requests.map(r=>r.id===id?{...r,status}:r)})}
