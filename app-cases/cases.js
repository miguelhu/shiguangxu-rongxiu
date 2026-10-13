const pic='/app/images/t-p03.jpg',boy='/app/xiaoxu-helper.png';
const scenarios=[
{title:'老照片，慢慢聊',subtitle:'保存后，继续补充同一件事',steps:[
{title:'从一张照片说起',note:'上传和说话汇入同一个对话。',messages:[['user','',pic],['ai','收到照片了，您想存起来，还是发给亲友？']],choices:['存起来','发出去']},
{title:'先留下记得的部分',note:'不要求把所有信息说完整。',messages:[['user','存起来。这是退休前一年，和几个老同事在杭州拍的。'],['ai','退休前一年，和老同事在杭州。这些先记下了，那天有什么让您一直记得的小事？']],progress:1},
{title:'保存，仍然在聊',note:'没有结束页，没有“再记一段”。输入栏始终保留。',messages:[['user','先帮我存下。'],['ai','已经存好了。我在，您接着说。']],receipt:'已保存到我的拾光'},
{title:'想起来的，再接着说',note:'继续补充原来的回忆，不新建一条重复记录。',messages:[['user','对了，那天老周还带了自己做的点心，大家边吃边笑。'],['ai','原来还有老周带来的点心。照片外的这段事，也一起记下。']],progress:2},
{title:'把补充也留下',note:'同一份拾光更新内容，前面的对话和照片仍在。',messages:[['user','这个也帮我记进去。'],['ai','这句也存好了。您慢慢想，我听着。']],receipt:'这份拾光已更新'}]},
{title:'近况，送给女儿',subtitle:'一句话，找到要分享的人',steps:[
{title:'直接说出想做的事',note:'分享意图不需要先找功能菜单。',messages:[['user','我想给晓禾发张照片。'],['ai','好，发给女儿陈晓禾。先挑一张照片吧。']],choices:['选择照片']},
{title:'照片和想说的话',note:'媒体与文字在同一段对话里补充。',messages:[['user','',pic],['user','今天和大家见面了，挺高兴。'],['ai','照片和这句话都放好了。我们再看一眼。']]},
{title:'发送前，由本人确认',note:'账号身份决定收件人，不以同名或模糊称呼自动代替。',messages:[['ai','发给：陈晓禾（女儿）\n“今天和大家见面了，挺高兴。”']],choices:['确认发送（演示）','再改一下']},
{title:'分享后仍能接着聊',note:'案例模拟发送，不声称真实送达。',messages:[['ai','已留下这次发送记录，演示还没有真正发出。我在，您接着说。'],['user','说起来，晓禾小时候也很喜欢热闹。'],['ai','您想起晓禾小时候了，有哪件事特别记得？']]}]},
{title:'记不清，也能留下',subtitle:'没有照片，不知道年份也可以',steps:[
{title:'一句话就是起点',note:'没有照片也能用声音记录。',messages:[['user','想起以前上课的时候，学生总爱留下来问问题。'],['ai','学生留下来问问题的那些时候，您还记得。大概是哪一年？']]},
{title:'不记得，就不再追问',note:'保留时间不确定，不编造年份。',messages:[['user','哪一年真不记得了。'],['ai','没关系，时间先不确定。有没有一次提问让您特别记得？']]},
{title:'随时存下',note:'进度不构成保存门槛。',messages:[['user','今天先说这些，帮我存下吧。'],['ai','已经存好了。我在，您接着说。']],receipt:'已保存 · 时间暂不确定'},
{title:'不必被追问赶着走',note:'用户可以休息、换话题，也可以继续补充。',messages:[['user','先歇会儿。'],['ai','好，您歇一歇。想说的时候再叫我。']]}]},
{title:'聊着聊着，换件事',subtitle:'一段对话里，整理不同回忆',steps:[
{title:'先留好刚才的话',note:'已经保存的内容不会因为后续操作消失。',messages:[['user','和老同事去杭州这件事，帮我存下。'],['ai','已经存好了。我在，您接着说。']],receipt:'杭州的回忆 · 已保存'},
{title:'自然地换个话题',note:'明确换话题后建立另一份记录，聊天不清空。',messages:[['user','换个话题，昨天女儿回来一起做饭了。'],['ai','昨天和女儿一起做饭，这件事也值得留下。做了什么好吃的？']],progress:0},
{title:'暂时不存也可以',note:'舍弃需要确认，仅影响本次尚未保存的内容。',messages:[['user','这件事先不记了。']],choices:['舍弃这次记录','继续讲述']},
{title:'对话仍在',note:'前面已保存的杭州回忆保留，聊天仍然可见。',messages:[['ai','这次未保存的内容先放下，已经保存的还在。您想聊什么，我都在。']]}]}
];
let selected=0,step=0,complete=false;const $=id=>document.getElementById(id);
function render(){const c=scenarios[selected],s=c.steps[step];$('cases').replaceChildren();c.steps.forEach((entry,i)=>{const button=document.createElement('button');button.className=i===step?'active':i<step?'completed':'';button.setAttribute('aria-current',i===step?'step':'false');const number=document.createElement('small');number.textContent=i<step?'✓':String(i+1).padStart(2,'0');const label=document.createElement('strong');label.textContent=entry.title;button.append(number,label);button.onclick=()=>{step=i;complete=false;render()};$('cases').append(button)});$('caseTitle').textContent=c.title;$('sceneTitle').textContent=c.title;$('sceneSubtitle').textContent=c.subtitle;$('stepCount').textContent=`${step+1} / ${c.steps.length}`;$('stepTitle').textContent=s.title;$('stepNote').textContent=s.note;$('prev').disabled=step===0;$('next').disabled=step===c.steps.length-1;$('all').textContent=complete?'回到逐步演示':'查看完整对话';$('conversation').replaceChildren();const upto=complete?c.steps.length-1:step;c.steps.slice(0,upto+1).forEach((s,j)=>{s.messages.forEach(([role,text,photo])=>{const row=document.createElement('div');row.className='message '+role;if(role==='ai'){const img=document.createElement('img');img.src=boy;img.alt='小叙';row.append(img)}const bubble=document.createElement('div');if(photo){row.classList.add('photo-message');const img=document.createElement('img');img.src=photo;img.alt='案例照片';bubble.append(img)}if(role==='ai'){const name=document.createElement('small');name.className='speaker-name';name.textContent='小叙';bubble.append(name)}if(text){const p=document.createElement('p');p.textContent=text;bubble.append(p)}row.append(bubble);$('conversation').append(row)});if(s.receipt){const r=document.createElement('p');r.className='receipt';r.textContent='✓ '+s.receipt;$('conversation').append(r)}if(j===upto&&s.progress!==undefined){const bar=document.createElement('div');bar.className='progress';bar.innerHTML='<div class="progress-track"><i style="width:'+([8,50,95][s.progress])+'%"></i></div><div class="progress-labels"><span>段落</span><span>章节</span><span>小文</span></div>';$('conversation').append(bar)}if(j===upto&&s.choices){const box=document.createElement('div');box.className='choices';s.choices.forEach(t=>{const btn=document.createElement('button');btn.textContent=t;btn.onclick=()=>advance();box.append(btn)});$('conversation').append(box)}});requestAnimationFrame(()=>{$('conversation').scrollTop=step===0?0:$('conversation').scrollHeight})}
function advance(){if(step<scenarios[selected].steps.length-1){step++;complete=false;render()}}
$('prev').onclick=()=>{if(step){step--;complete=false;render()}};$('next').onclick=advance;$('all').onclick=()=>{complete=!complete;render()};scenarios.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=c.title;$('scenario').append(option)});$('scenario').onchange=e=>{selected=Number(e.target.value);step=0;complete=false;render()};render();
