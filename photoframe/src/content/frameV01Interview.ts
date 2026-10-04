export interface FrameV01InterviewFollowup {
  detail: string
  text: string
  audioUrl: string
  durationMs: number
}

export const FRAME_V01_INTERVIEW_SCRIPT = {
  question: '你的第一次长时间离家是什么时候？',
  poem: {
    verse: '少小离家老大回，乡音无改鬓毛衰。',
    attribution: '贺知章《回乡偶书》',
  },
  opening: '“少小离家老大回，乡音无改鬓毛衰。”这是唐代诗人贺知章的《回乡偶书》。\n有些离开，在当时看来，只是坐上一趟车、换一个地方生活。很多年以后再回头看，才发现那一天，是自己第一次真正离开父母的照顾，开始独自面对外面的世界。\n\n您可以从以下角度聊聊：\n当时带走了哪些行李？\n是谁送别了您？当时是怎样的情景和画面？',
  openingDisplay: '有些离开，在当时看来，只是坐上一趟车、换一个地方生活。很多年以后再回头看，才发现那一天，是自己第一次真正离开父母的照顾，开始独自面对外面的世界。\n\n您可以从以下角度聊聊：\n当时带走了哪些行李？\n是谁送别了您？当时是怎样的情景和画面？',
  openingAudio: {
    url: '/audio/interview/first-departure-peiqi/opening.mp3',
    durationMs: 35_352,
  },
  followups: [
    {
      detail: '标旗队伍走到哪里，木生就跟到哪里',
      text: '奶奶，老一辈的爱情故事听着好感人好纯粹啊！我很好奇，乡里围观扛标旗的人那么多，您看到爷爷那么执着的时候，是不是又害羞、又悄悄心动，心里暖暖的呀？',
      audioUrl: '/audio/interview/first-departure-peiqi/followup-1.mp3',
      durationMs: 16_872,
    },
    {
      detail: '那时候只觉得木生稳重、靠谱，跟着他能过安稳日子',
      text: '那个偷偷离开家的夜晚，一定特别难熬吧？一边是最亲的家人、从小长大的家，一边是想奔赴的心上人，奶奶那时候心里，是不是又舍不得、又对以后的日子充满期待呀？',
      audioUrl: '/audio/interview/first-departure-peiqi/followup-2.mp3',
      durationMs: 16_896,
    },
    {
      detail: '夜路上的舍不得，还有木生亲手做的木头自行车',
      text: '哎，您被抓回家时，看着爸妈憔悴难过的样子，肯定又愧疚又难受。当时发生了什么呀，是什么让最后爸妈松口成全你们了？',
      audioUrl: '/audio/interview/first-departure-peiqi/followup-3.mp3',
      durationMs: 12_600,
    },
  ] satisfies FrameV01InterviewFollowup[],
  wrapup: {
    lead: '您和木生爷爷的故事，我认真听完了。',
    detail: '那辆木头自行车，还有祠堂里一里一外跪着的三天三夜',
    tail: '，让我记住了您年轻时认定一个人的坚定。',
    audioUrl: '/audio/interview/first-departure-peiqi/wrapup.mp3',
  },
}
