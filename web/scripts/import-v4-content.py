from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
doc=(root.parents[2]/'08_拾光叙展示案例与素材脚本_V4.md').read_text()
spec=(root.parents[2]/'07_拾光叙展示网站完整开发说明_V4.md').read_text()
caseids={'T':'teacher','L':'leader','N':'nurse','B':'birthday','A':'anniversary'}
relations=[]
for group,code,label,explain in re.findall(r'^\| (工作|学习|家庭|生活|兜底) \| `([^`]+)` \| ([^|]+) \| ([^|]+) \|',spec,re.M):
 relations.append(dict(group=group,code=code,label=label.strip(),explain=explain.strip()))
result={}
for prefix,cid in caseids.items():
 authors=[];photos=[];stories=[];shots=[];voices=[]
 for line in doc.splitlines():
  if re.match(r'^\| '+prefix+r'-U\d{2}／',line):
   cols=[x.strip() for x in line.strip('|').split('|')]
   ids=cols[0].split('／'); name=cols[1].split('；')[0];codes=re.findall(r'`([a-z_]+)`',cols[1])
   authors.append(dict(id=ids[0],userId='user-linyue' if name=='林悦' else ids[0].lower(),name=name,relationCodes=list(dict.fromkeys(codes)),relationNote=re.sub(r'`[^`]+`','',cols[1].split('；',1)[1]).strip('，； '),impressions=cols[2].split('、'),wishId=ids[1],wish=cols[3]))
  if re.match(r'^\| '+prefix+r'-P\d{2} \|',line):
   cols=[x.strip() for x in line.strip('|').split('|')]
   date,precision=cols[2].split('／'); filename='images/campus.png' if cols[0]=='T-P18' else f'images/cases/{cid}/{cols[0].lower()}.jpg'
   photos.append(dict(id=cols[0],authorId=cols[1],date='' if date=='不记得' else date,precision={'年':'year','月':'month','日':'day','未知':'unknown'}[precision],scene=cols[3],caption=cols[4],path=filename,source='通用场景示意' if cols[0]=='T-P18' else '虚构情景重现'))
  if re.match(r'^\| '+prefix+r'-M\d{2} \|',line):
   cols=[x.strip() for x in line.strip('|').split('|')]
   shots.append(dict(id=cols[0],layout=cols[1],photoIds=re.findall(prefix+r'-P\d{2}',cols[2]),seconds=int(cols[3]),caption=cols[4] if len(cols)>4 else ''))
  if re.match(r'^\| '+prefix+r'-A\d{2} \|',line):
   cols=[x.strip() for x in line.strip('|').split('|')]
   voices.append(dict(id=cols[0],author=cols[1].split('／')[0],blockId=cols[1].split('／')[1],text=cols[2],path=f'audio/cases/{cid}/{cols[0].lower()}.m4a'))
 for m in re.finditer(r'^\*\*('+prefix+r'-S\d{2})｜([^｜]+)｜(.+?)\*\*([^\n]*)\n\n([^\n]+)',doc,re.M):
  sid,author,title,meta,body=m.groups();authors_match=[u for u in authors if u['name']==author]
  stories.append(dict(id=sid,authorId=authors_match[0]['id'],title=title,body=body,photoIds=re.findall(prefix+r'-P\d{2}',meta),featured='重点' in meta))
 for vid,author,block,body in re.findall(r'`('+prefix+r'-A\d{2})` ([^／；\n]+?)关联 ('+prefix+r'-[SW]\d{2})：“([^”]+)”',doc):
  voices.append(dict(id=vid,author=author,blockId=block,text=body,path=f'audio/cases/{cid}/{vid.lower()}.m4a'))
 polished={}
 for sid,text in re.findall(r'^\| ('+prefix+r'-S01) \| ([^|]+) \|',doc,re.M):polished[sid]=text.strip()
 result[cid]=dict(authors=authors,photos=photos,stories=stories,shots=shots,voices=voices,polished=polished)
 assert len(photos)==(18 if prefix=='T' else 12)
 assert len(voices)==(3 if prefix=='T' else 2),(cid,voices)
(root/'src/v4/content.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
(root/'src/v4/relations.json').write_text(json.dumps(relations,ensure_ascii=False,indent=2))
jobs=[]
for cid,data in result.items():
 for p in data['photos']:
  if p['id']=='T-P18':continue
  jobs.append(dict(id=p['id'],caseId=cid,path=p['path'],scene=p['scene'],date=p['date']))
(root/'scripts/photo-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2))
print('Imported',sum(len(c['authors']) for c in result.values()),'participants,',sum(len(c['photos']) for c in result.values()),'photos,',sum(len(c['voices']) for c in result.values()),'voices')
