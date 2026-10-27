const pic='/app/images/t-p03.jpg',boy='/app/xiaoxu-helper.png';
const scenarios=[
{title:'老照片，慢慢聊',subtitle:'保存后，继续补充同一件事',steps:[
{title:'从一张照片说起',note:'上传和说话汇入同一个对话。',messages:[['user','',pic],['ai','照片放好啦。您想和我聊聊这张照片，把它存下来，还是先发给亲友看看？']],choices:['存起来','发出去']},
{title:'先留下记得的部分',note:'不要求把所有信息说完整。',messages:[['user','存起来。这是退休前一年，和几个老同事在杭州拍的。'],['ai','原来是退休前一年，和老同事一起去杭州。那次相聚，有没有哪件小事，现在说起来还记得？']],progress:1},
{title:'保存，仍然在聊',note:'没有结束页，没有“再记一段”。输入栏始终保留。',messages:[['user','先帮我存下。'],['ai','已经存好了，放在“我的拾光”里。想起什么，咱们就接着聊，不着急。']],receipt:'已保存到我的拾光'},
{title:'想起来的，再接着说',note:'继续补充原来的回忆，不新建一条重复记录。',messages:[['user','对了，那天老周还带了自己做的点心，大家边吃边笑。'],['ai','大家边吃边笑，还有老周亲手做的点心——这段也一起留着。您还记得，他做的是什么点心吗？']],progress:2},
{title:'把补充也留下',note:'同一份拾光更新内容，前面的对话和照片仍在。',messages:[['user','这个也帮我记进去。'],['ai','好，点心的事也添进刚才那份回忆了。您慢慢想，我听着。']],receipt:'这份拾光已更新'}]},
{title:'近况，送给女儿',subtitle:'一句话，找到要分享的人',steps:[
{title:'直接说出想做的事',note:'分享意图不需要先找功能菜单。',messages:[['user','我想给晓禾发张照片。'],['ai','好呀，给晓禾看看您的近况。您先挑张照片，想捎上的话也可以直接跟我说。']],choices:['选择照片']},
{title:'照片和想说的话',note:'媒体与文字在同一段对话里补充。',messages:[['user','',pic],['user','今天和大家见面了，挺高兴。'],['ai','好，就把“今天和大家见面了，挺高兴”这句话一起带给晓禾。发之前，您再看看。']]},
{title:'发送前，由本人确认',note:'账号身份决定收件人，不以同名或模糊称呼自动代替。',messages:[['ai','发给：陈晓禾（女儿）\n“今天和大家见面了，挺高兴。”']],choices:['确认发送（演示）','再改一下']},
{title:'分享后仍能接着聊',note:'案例模拟发送，不声称真实送达。',messages:[['ai','这次分享的记录留下了。演示还没有真正发出。您刚才说见面很高兴，想再聊聊吗？'],['user','说起来，晓禾小时候也很喜欢热闹。'],['ai','说到晓禾小时候，您先想起的是哪一幕呀？']]}]},
{title:'记不清，也能留下',subtitle:'没有照片，不知道年份也可以',steps:[
{title:'一句话就是起点',note:'没有照片也能用声音记录。',messages:[['user','想起以前上课的时候，学生总爱留下来问问题。'],['ai','下课了还围着您问问题，这个画面您一直记着呀。有没有哪个学生，或者哪次提问，让您印象特别深？']]},
{title:'不记得，就不再追问',note:'保留时间不确定，不编造年份。',messages:[['user','具体的事一时想不起来，哪一年也真不记得了。'],['ai','年份想不起来也没关系，咱们先不管它。您想起哪一幕，就从那一幕说起。']]},
{title:'随时存下',note:'进度不构成保存门槛。',messages:[['user','今天先说这些，帮我存下吧。'],['ai','已经存好了，放在“我的拾光”里。想起什么，咱们就接着聊，不着急。']],receipt:'已保存 · 时间暂不确定'},
{title:'不必被追问赶着走',note:'用户可以休息、换话题，也可以继续补充。',messages:[['user','先歇会儿。'],['ai','好，您歇一歇。想说的时候再叫我。']]}]},
{title:'聊着聊着，换件事',subtitle:'一段对话里，整理不同回忆',steps:[
{title:'先留好刚才的话',note:'已经保存的内容不会因为后续操作消失。',messages:[['user','和老同事去杭州这件事，帮我存下。'],['ai','已经存好了，放在“我的拾光”里。想起什么，咱们就接着聊，不着急。']],receipt:'杭州的回忆 · 已保存'},
{title:'自然地换个话题',note:'明确换话题后建立另一份记录，聊天不清空。',messages:[['user','换个话题，昨天女儿回来一起做饭了。'],['ai','好，咱们聊聊昨天。您和女儿一起做了什么好吃的？']],progress:0},
{title:'暂时不存也可以',note:'舍弃需要确认，仅影响本次尚未保存的内容。',messages:[['user','这件事先不记了。']],choices:['舍弃这次记录','继续讲述']},
{title:'对话仍在',note:'前面已保存的杭州回忆保留，聊天仍然可见。',messages:[['ai','好，这件事先不存。刚才杭州的回忆还好好留着呢。咱们接着聊，您想说什么都可以。']]}]}
];
// Guided examples: suggestions are optional, and every action has its own result.
scenarios.push(
{title:'说一段，整理成回忆',subtitle:'先听您说，再一起确认',steps:[
{title:'先听完，不急着问',note:'语音讲述后，AI给出不同整理方式。',messages:[['user','那次毕业，学生送了我一本手写的册子。里面有他们偷偷记下的课堂小事，我翻了好久。'],['ai','他们把课堂里的小事都记住了呀。您想接着讲，还是先看看我帮您整理的一小段？']],choices:[{label:'帮我整理一下',next:1},{label:'我还想接着说',reply:'好，先不整理。那本册子里，您先翻到的是哪一页？'},{label:'就按原话留着',reply:'好，原话就很好。这段先保留您的说法，不替您改。'}]},
{title:'整理结果由您确认',note:'保留原意，不替长者添加未表达的感受。',messages:[['user','先帮我整理一下。'],['ai','毕业时，学生们送给我一本手写册子，里面记着课堂上的小事。我捧着册子，翻看了很久。\n\n这样写，像您想说的吗？']],choices:[{label:'这样就好',next:2},{label:'再口语一点',reply:'那次毕业，学生送了我一本手写的册子，记的都是上课时的小事。我拿着翻了好久。\n这样更像平时说话，您看看。'},{label:'保留我的原话',reply:'好，整理稿先不用。保存时保留您刚才说的原话。'}]},
{title:'留好，也能接着聊',note:'本页为流程演示，不写入真实回忆。',messages:[['user','这样就好，存起来。'],['ai','这段就这样留着。那本册子以后要是找到了，还可以把照片添进来。']],receipt:'演示 · 整理完成',choices:[{label:'看看真实记录入口',view:'me'},{label:'继续聊那本册子',reply:'册子里有没有一句话，您到现在还记得？'}]}
]},
{title:'帮我找那张照片',subtitle:'说出记得的线索，逐步缩小范围',steps:[
{title:'用一句话找回忆',note:'检索能力的交互示意，候选为固定案例素材。',messages:[['user','帮我找找以前和学生拍的那张照片，具体哪年忘了。'],['ai','年份不记得也没关系。您还记得，是毕业时拍的，还是后来见面时拍的？']],choices:[{label:'毕业的时候',next:1},{label:'后来见面的时候',reply:'好，那就先看重逢的照片。您还记得是在学校，还是在外面见面？'},{label:'真记不清了',reply:'没关系，咱们先按“和学生在一起”看几张，您认一认。'}]},
{title:'先认照片，再做下一步',note:'展示候选，不宣称一定找对。',messages:[['user','毕业的时候。'],['ai','先看看这张，是您想找的吗？',pic]],choices:[{label:'就是这张',next:2},{label:'不是这张',reply:'好，这张先放一边。您还记得是室内合影，还是在校园里拍的？'}]},
{title:'找到以后，顺手办事',note:'AI回复旁出现与当前照片有关的动作。',messages:[['ai','找到这张了。想再聊聊那天，还是发给亲友看看？']],choices:[{label:'讲讲那天的事',reply:'好呀。看着这张照片，您先想起了什么？'},{label:'发给晓禾',caseIndex:1},{label:'先看看就好',reply:'好，咱们就慢慢看，不急着做什么。'}]}
]},
{title:'替我带一句问候',subtitle:'AI帮忙措辞，发送仍由您确认',steps:[
{title:'说出想问候谁',note:'不替用户承诺或发送；先协助拟一句话。',messages:[['user','想给女儿发个问候，没什么特别的事，就是想她了。'],['ai','那就简简单单说声想她。不用写得很正式，您喜欢哪种说法？']],choices:[{label:'就说想她了',next:1},{label:'问问她最近怎么样',reply:'可以说：“晓禾，最近怎么样？有空跟我聊聊，我想听听你的近况。”'},{label:'我自己说',reply:'好，您怎么说都行，我先听着。'}]},
{title:'一句话，保留自己的口气',note:'建议文案可以采用，也可以直接改。',messages:[['ai','“晓禾，今天想你了。得空的时候，咱们说说话。”\n您看看，要不要改几个字？']],choices:[{label:'就用这句',next:2},{label:'短一点',reply:'“晓禾，想你了。有空聊聊呀。”'},{label:'我想再添一句',reply:'您说，想添什么？我把两句放在一起，再给您看看。'}]},
{title:'亲友和内容都确认',note:'示例只展示确认结果，不实际发送消息。',messages:[['ai','发给：陈晓禾 · 女儿\n“晓禾，今天想你了。得空的时候，咱们说说话。”']],choices:[{label:'确认发送（演示）',next:3},{label:'先不发',reply:'好，先不发。您想再改改，或者只跟我聊聊，都可以。'}]},
{title:'问候以后继续聊',note:'不编造对方已读、回应或送达。',messages:[['ai','演示到这里就完成了，还没有真正发出。您刚才说想晓禾了，想聊聊她吗？']],receipt:'演示 · 已确认问候'}
]},
{title:'听错了，轻松改回来',subtitle:'不确定就询问，不自作主张',steps:[
{title:'名字没听清，先核对',note:'低置信度识别给候选，也允许重新说。',messages:[['user','把这张照片发给小禾。'],['ai','您说的是女儿陈晓禾吗？我先跟您确认一下。']],choices:[{label:'对，是晓禾',next:1},{label:'不是，是另一位',reply:'好，先不选人。您可以再说一遍名字，或者从亲友里点选。',viewAfter:'me'},{label:'打开亲友',view:'me'}]},
{title:'先选内容，不擅自发送',note:'确认收件人后继续当前分享任务。',messages:[['ai','好，收件人选陈晓禾。想拍张现在的照片，还是从相册里选？']],choices:[{label:'现在拍一张',view:'camera'},{label:'看看分享案例',caseIndex:1},{label:'只说一句话',reply:'好，就带一句话。您想跟晓禾说什么？'}]}
]}
);
scenarios[0].steps[0].choices=[{label:'存起来',next:1},{label:'发给亲友',caseIndex:1}];
scenarios[0].steps[1].choices=[{label:'先帮我存下',next:2},{label:'我还记得一件小事',reply:'您说，我听着。那天还有什么让您记得？'}];
scenarios[1].steps[2].choices=[{label:'确认发送（演示）',next:3},{label:'再改一下',reply:'好，先不发送。您想换张照片，还是改一句话？'}];
scenarios[3].steps[2].choices=[{label:'舍弃这次记录',next:3},{label:'继续讲述',reply:'好，这次先不舍弃。刚才说到和女儿做饭，您接着说。'}];
scenarios.push(...[{"title":"相框提醒，按时吃药","subtitle":"您定时间，小叙帮忙记","steps":[{"title":"先问清时间","note":"只按用户要求设置提醒，不建议药品、剂量或服药时间。","messages":[["user","小叙，提醒我吃药。"],["ai","您想几点提醒？是今天一次，还是每天都提醒？"]],"choices":[{"label":"每天晚上八点","next":1},{"label":"只提醒今天","reply":"好，只提醒今天。您希望几点？"}]},{"title":"确认内容和设备","note":"用户明确确认后才建立提醒；相框需绑定且获得授权。","messages":[["user","每天晚上八点，在我的相框上提醒。"],["ai","每天晚上八点，在您的相框显示“该按原来的安排吃药了”。这样设置对吗？"]],"choices":[{"label":"确认设置（演示）","next":2},{"label":"改个时间","reply":"好，先不设置。您希望改到几点？"}]},{"title":"相框轻提醒","note":"定时和设备联动为示意，不是真实提醒服务。","messages":[["ai","提醒设置预览完成。当前演示不会按时响铃，也不会同步到真实相框。"],["ai","相框提醒预览 · 20:00\n该按原来的安排吃药了。"]],"choices":[{"label":"我知道了","reply":"提醒已收起。不把“知道了”记为已经服药。"},{"label":"十分钟后再提醒","reply":"演示：这一次延后十分钟；每天八点的计划不变。"},{"label":"取消这个提醒","reply":"演示：这条吃药提醒已取消，其他提醒不受影响。"}]}]},{"title":"出门前，带上钥匙","subtitle":"一句话，留个小提醒","steps":[{"title":"明确是哪一天","note":"相对日期显示为明确日期；不推断定位触发。","messages":[["user","明天早上九点提醒我带钥匙出门。"],["ai","明天上午九点提醒您“带上钥匙”。只提醒这一次，要在相框显示吗？"]],"choices":[{"label":"相框提醒我","next":1},{"label":"只在手机提醒","reply":"好，预览改为手机提醒。明天上午九点，只提醒一次，确认后才保存。"}]},{"title":"确认提醒预览","note":"示例时间基于演示日期；正式端需明确用户时区及具体日期。","messages":[["user","对，确认。"],["ai","相框提醒预览：明天上午九点 · 带上钥匙。\n这次是演示，不会真的到时提醒。"]],"choices":[{"label":"再加上雨伞","reply":"内容改为“带上钥匙和雨伞”。时间不变，您确认后再更新。"},{"label":"先取消","reply":"好，这条提醒先取消。"}]}]},{"title":"周末，给女儿打电话","subtitle":"只做提醒，不自动呼叫","steps":[{"title":"一次还是每周","note":"确认周期，避免擅自建立重复任务。","messages":[["user","周日提醒我给晓禾打个电话。"],["ai","这周日几点提醒？是只这一次，还是以后每周日都提醒？"]],"choices":[{"label":"每周日晚上七点","next":1},{"label":"只这周日","reply":"好，只这一次。您希望几点提醒？"}]},{"title":"提醒卡片","note":"不代拨电话，不泄露对方来信。","messages":[["user","每周日晚上七点，相框上提醒。"],["ai","每周日晚上七点，提醒您“给晓禾打个电话”。只提醒，不自动拨号。"]],"choices":[{"label":"确认（演示）","next":2},{"label":"先不设置","reply":"好，先不设置，想好了再告诉我。"}]},{"title":"联系仍由本人决定","note":"相框与App都需要实际服务接入；此页展示交互。","messages":[["ai","提醒预览已确认，当前不会实际触发。到时可以收起提醒，或打开与晓禾的联系入口。"]],"choices":[{"label":"看看给晓禾的问候","caseIndex":6},{"label":"知道了","reply":"好，咱们接着聊。"}]}]}]);
let selected=0,step=0,complete=false;const $=id=>document.getElementById(id);
function render(){document.querySelector('.live-app')?.remove();document.querySelector('.screen').classList.remove('show-live');const c=scenarios[selected],s=c.steps[step];$('cases').replaceChildren();c.steps.forEach((entry,i)=>{const button=document.createElement('button');button.className=i===step?'active':i<step?'completed':'';button.setAttribute('aria-current',i===step?'step':'false');const number=document.createElement('small');number.textContent=i<step?'✓':String(i+1).padStart(2,'0');const label=document.createElement('strong');label.textContent=entry.title;button.append(number,label);button.onclick=()=>{step=i;complete=false;render()};$('cases').append(button)});$('caseTitle').textContent=c.title;$('sceneTitle').textContent=c.title;$('sceneSubtitle').textContent=c.subtitle;$('stepCount').textContent=`${step+1} / ${c.steps.length}`;$('stepTitle').textContent=s.title;$('stepNote').textContent=s.note;$('prev').disabled=step===0;$('next').disabled=step===c.steps.length-1;$('all').textContent=complete?'回到逐步演示':'查看完整对话';$('conversation').replaceChildren();const upto=complete?c.steps.length-1:step;c.steps.slice(0,upto+1).forEach((s,j)=>{s.messages.forEach(([role,text,photo])=>{const row=document.createElement('div');row.className='message '+role;if(role==='ai'){const img=document.createElement('img');img.src='/app/xiaoxu-perch.png';img.alt='小叙';row.append(img)}const bubble=document.createElement('div');if(photo){row.classList.add('photo-message');const img=document.createElement('img');img.src=photo;img.alt='案例照片';bubble.append(img)}if(role==='ai'){const name=document.createElement('small');name.className='speaker-name';name.textContent='小叙';bubble.append(name)}if(text){const p=document.createElement('p');p.textContent=text;bubble.append(p)}row.append(bubble);$('conversation').append(row)});if(s.receipt){const r=document.createElement('p');r.className='receipt';r.textContent='✓ '+s.receipt;$('conversation').append(r)}if(j===upto&&s.progress!==undefined){const bar=document.createElement('div');bar.className='progress';bar.innerHTML='<div class="progress-track"><i style="width:'+([8,50,95][s.progress])+'%"></i></div><div class="progress-labels"><span>段落</span><span>章节</span><span>小文</span></div>';$('conversation').append(bar)}if(j===upto&&s.choices){const box=document.createElement('div');box.className='choices';s.choices.forEach(t=>{const btn=document.createElement('button');btn.textContent=typeof t==='string'?t:t.label;btn.onclick=()=>choose(t,box);box.append(btn)});$('conversation').append(box)}});requestAnimationFrame(()=>{$('conversation').scrollTop=step===0?0:$('conversation').scrollHeight});openLiveApp('fragment',true)}
function advance(){if(step<scenarios[selected].steps.length-1){step++;complete=false;render()}}
$('prev').onclick=()=>{if(step){step--;complete=false;render()}};$('next').onclick=advance;$('all').onclick=()=>{complete=!complete;render()};scenarios.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=c.title;$('scenario').append(option)});$('scenario').onchange=e=>{selected=Number(e.target.value);step=0;complete=false;render()};render();

function openLiveApp(view,withCase=false){const screen=document.querySelector('.screen');screen.querySelector('.live-app')?.remove();const frame=document.createElement('iframe');frame.className='live-app';frame.title='拾光叙 · 长者 App';frame.src='/app-plus/?view='+view+(withCase?'&example='+selected+'&through='+(complete?scenarios[selected].steps.length-1:step):'');frame.allow='microphone; camera';screen.classList.add('show-live');screen.insertBefore(frame,screen.querySelector('.home-indicator'));}
$('appMine').onclick=()=>openLiveApp('me');
$('appHome').onclick=()=>render();

$('appCamera').onclick=()=>openLiveApp('camera');

function choose(option,box){
 if(typeof option==='string'){advance();return;}
 if(option.view){openLiveApp(option.view);return;}
 if(option.caseIndex!==undefined){selected=option.caseIndex;step=0;complete=false;$('scenario').value=String(selected);render();return;}
 if(option.next!==undefined){step=option.next;complete=false;render();return;}
 if(option.reply){box.remove();addReply('user',option.label);addReply('ai',option.reply);const actions=document.createElement('div');actions.className='choices';const again=document.createElement('button');again.textContent='返回本步选项';again.onclick=render;actions.append(again);if(step<scenarios[selected].steps.length-1){const next=document.createElement('button');next.textContent='继续主线演示';next.onclick=advance;actions.append(next)}$('conversation').append(actions);$('conversation').scrollTop=$('conversation').scrollHeight;}
}
function addReply(role,text){const row=document.createElement('div');row.className='message '+role;if(role==='ai'){const avatar=document.createElement('img');avatar.src='/app/xiaoxu-perch.png';avatar.alt='小叙';row.append(avatar)}const bubble=document.createElement('div');const paragraph=document.createElement('p');paragraph.textContent=text;bubble.append(paragraph);row.append(bubble);$('conversation').append(row);}

window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==document.querySelector('.live-app')?.contentWindow||event.data?.type!=='sgx-case-choice')return;choose(event.data.option,document.createElement('div'));});
