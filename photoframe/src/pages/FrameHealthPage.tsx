import {
  BowlFood,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CheckFat,
  ClipboardText,
  Clock,
  Gift,
  HeadCircuit,
  Heartbeat,
  HouseLine,
  MapPin,
  NewspaperClipping,
  Pill,
  Play,
  Plus,
  ShieldCheck,
  Stethoscope,
  VideoCamera,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'

type HealthModuleId = 'medicine' | 'records' | 'cognition' | 'tips' | 'checkin' | 'service'
type HealthRecordTab = 'diet' | 'daily' | 'report' | 'cognition'
type MedicineStatus = 'missed' | 'done' | 'upcoming'
type DoctorDemoRecordType = 'bloodPressure' | 'report' | 'lab' | 'diet'

type DoctorDemoRecord = {
  type: DoctorDemoRecordType
  tab: HealthRecordTab
  savedAt: number
  value?: string
  note?: string
}

type MedicineDose = {
  id: string
  name: string
  dosage: string
  note: string
  photo: string
}

type MedicineSchedule = {
  id: string
  time: string
  period: string
  summary: string
  medicines: MedicineDose[]
}

type HealthModule = {
  id: HealthModuleId
  title: string
  description: string
  Icon: Icon
  detailTitle: string
  detailSummary: string
  primaryAction: string
}

const HEALTH_MODULES: HealthModule[] = [
  {
    id: 'service',
    title: 'AI医生',
    description: '问身体，中西医都能聊',
    Icon: Stethoscope,
    detailTitle: '问问 AI医生',
    detailSummary: '身体不舒服、报告看不懂、用药不清楚时，可以先让小叙帮你整理重点。',
    primaryAction: '开始咨询',
  },
  {
    id: 'medicine',
    title: '用药提醒',
    description: '按时吃药提醒',
    Icon: Pill,
    detailTitle: '今天按时吃药',
    detailSummary: '把每天要吃的药、时间和剂量排好，到点用相框和家人端一起提醒。',
    primaryAction: '添加提醒',
  },
  {
    id: 'records',
    title: '健康记录',
    description: '已存档的报告与数据',
    Icon: ClipboardText,
    detailTitle: '健康资料自动存档',
    detailSummary: 'AI聊天中提到的报告、拍照录入的单据，以及语音记录的健康数据，都会按时间整理保存。',
    primaryAction: '新增记录',
  },
  {
    id: 'tips',
    title: '健康小贴士',
    description: '为你挑选的养生内容',
    Icon: NewspaperClipping,
    detailTitle: '适合老人慢慢看的内容',
    detailSummary: '结合生活习惯和健康记录，推送适合老人阅读的大字健康内容。',
    primaryAction: '播放今日贴士',
  },
]

const HEALTH_MODULE_MAP = Object.fromEntries(HEALTH_MODULES.map((module) => [module.id, module])) as Record<HealthModuleId, HealthModule>
HEALTH_MODULE_MAP.checkin = {
  id: 'checkin',
  title: '每日打卡',
  description: '日历查看安心记录',
  Icon: CalendarCheck,
  detailTitle: '每天报个平安',
  detailSummary: '点立即打卡、和任意 AI 聊天，或语音录入健康数据，都可以完成一次打卡。',
  primaryAction: '立即打卡',
}
HEALTH_MODULE_MAP.cognition = {
  id: 'cognition',
  title: '记忆与认知',
  description: 'AI识别记忆变化',
  Icon: HeadCircuit,
  detailTitle: '温和观察记忆变化',
  detailSummary: '从日常聊天和讲述里观察记忆变化，提前提醒家人留意认知风险。',
  primaryAction: '查看观察',
}

type CheckinCalendarDay = {
  day?: number
  key: string
  state: 'blank' | 'done' | 'future' | 'missed' | 'today'
}

const CHECKIN_TODAY = new Date(2026, 5, 22)
const MISSED_DAY_PATTERN = [4, 14, 27]

const checkinStateLabel: Record<CheckinCalendarDay['state'], string> = {
  blank: '',
  done: '已打卡',
  future: '',
  missed: '未打卡',
  today: '今天',
}

function getCheckinMonth(offset: number) {
  const monthDate = new Date(CHECKIN_TODAY.getFullYear(), CHECKIN_TODAY.getMonth() + offset, 1)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlankCount = (monthDate.getDay() + 6) % 7
  const isCurrentMonth = year === CHECKIN_TODAY.getFullYear() && month === CHECKIN_TODAY.getMonth()
  const isFutureMonth = monthDate > new Date(CHECKIN_TODAY.getFullYear(), CHECKIN_TODAY.getMonth(), 1)
  const days: CheckinCalendarDay[] = Array.from({ length: leadingBlankCount }, (_, index) => ({
    key: `blank-${year}-${month}-${index}`,
    state: 'blank',
  }))

  for (let day = 1; day <= daysInMonth; day += 1) {
    const state: CheckinCalendarDay['state'] = isFutureMonth || (isCurrentMonth && day > CHECKIN_TODAY.getDate())
      ? 'future'
      : isCurrentMonth && day === CHECKIN_TODAY.getDate()
        ? 'today'
        : MISSED_DAY_PATTERN.includes(day)
          ? 'missed'
          : 'done'

    days.push({ day, key: `${year}-${month + 1}-${day}`, state })
  }

  return {
    days,
    label: `${year}年${month + 1}月`,
  }
}

const medicineSchedules: MedicineSchedule[] = [
  {
    id: 'morning',
    time: '08:00',
    period: '早餐后',
    summary: '2种药',
    medicines: [
      {
        id: 'amlodipine',
        name: '降压药 氨氯地平',
        dosage: '1片',
        note: '早餐后服用，今天吃完后先坐一会儿再出门。',
        photo: '/health/medicine-boxes/amlodipine-besylate.webp',
      },
      {
        id: 'aspirin',
        name: '护心药 阿司匹林',
        dosage: '1片',
        note: '早餐后服用，按医嘱保护心脑血管。',
        photo: '/health/medicine-boxes/aspirin-enteric.jpg',
      },
    ],
  },
  {
    id: 'noon',
    time: '12:30',
    period: '午饭后',
    summary: '1种药',
    medicines: [
      {
        id: 'stomach',
        name: '胃药 铝碳酸镁',
        dosage: '1片',
        note: '午饭后服用，今天胃不舒服的话可以告诉家人。',
        photo: '/health/medicine-boxes/hydrotalcite-chewable.webp',
      },
    ],
  },
  {
    id: 'night',
    time: '21:00',
    period: '睡前',
    summary: '4种药',
    medicines: [
      {
        id: 'atorvastatin',
        name: '降脂药 阿托伐他汀',
        dosage: '1片',
        note: '睡前服用，按医嘱帮助控制血脂。',
        photo: '/health/medicine-boxes/atorvastatin-calcium.webp',
      },
      {
        id: 'calcium',
        name: '补钙药 钙D3',
        dosage: '1片',
        note: '睡前随温水服用，帮助补钙。',
        photo: '/health/medicine-boxes/calcium-d3.webp',
      },
      {
        id: 'metformin',
        name: '血糖药 二甲双胍',
        dosage: '1片',
        note: '按医嘱服用，帮助控制餐后血糖。',
        photo: '/health/medicine-boxes/metformin-hydrochloride.jpeg',
      },
      {
        id: 'stomach-night',
        name: '胃药 铝碳酸镁',
        dosage: '1片',
        note: '今晚如胃部不适，吃完后先休息。',
        photo: '/health/medicine-boxes/hydrotalcite-chewable.webp',
      },
    ],
  },
]

const healthReportGroups = [
  {
    year: '2026年',
    reports: [
      { title: '宝安人民医院体检报告', date: '6月12日', summary: '血压略高，建议继续观察并按时记录。', type: '体检' },
      { title: '南山社康血脂化验单', date: '5月28日', summary: '已提取胆固醇和甘油三酯，整体需要少油饮食。', type: '化验' },
      { title: '宝安人民医院眼科复查单', date: '5月10日', summary: '复查结果已存档，建议半年后再次复查。', type: '复查' },
      { title: '南山医院骨密度检查', date: '4月22日', summary: '骨密度偏低，建议适当补钙和多晒太阳。', type: '检查' },
    ],
  },
  {
    year: '2025年',
    reports: [
      { title: '宝安人民医院年度体检报告', date: '11月18日', summary: '血糖和血脂已归档，建议保持清淡饮食。', type: '体检' },
      { title: '南山社康肝肾功能化验单', date: '9月6日', summary: '主要指标平稳，继续按时复查就好。', type: '化验' },
      { title: '宝安人民医院心电图检查', date: '6月21日', summary: '心率节律基本稳定，已提醒家人留意复查时间。', type: '检查' },
      { title: '南山医院骨科复查单', date: '3月15日', summary: '膝关节复查记录已保存，建议减少久站。', type: '复查' },
    ],
  },
]

const healthRecords = [
  { label: '血压', value: '136/82', unit: 'mmHg', time: '今天', note: '比昨天略高，先坐下休息会儿' },
  { label: '血糖', value: '6.1', unit: 'mmol/L', time: '今天', note: '整体平稳，饭后散步就很好' },
  { label: '心率', value: '76', unit: '次/分', time: '今天', note: '节律平稳，今天不用担心' },
  { label: '血氧', value: '97', unit: '%', time: '今天', note: '数值不错，呼吸保持顺畅' },
  { label: '体温', value: '36.5', unit: '°C', time: '昨天', note: '没有发热，注意添减衣服' },
  { label: '体重', value: '63.8', unit: 'kg', time: '前天', note: '变化不大，照常吃饭就好' },
  { label: '步数', value: '4,286', unit: '步', time: '今天', note: '比昨天多一些，饭后慢走很不错' },
]

const dietRecordWeeks = [
  {
    date: '6月22日',
    summaryTitle: '今天已记录早餐和午餐',
    summaryText: '目前蛋白质补充不错，晚餐还没记录。晚上建议清淡一点，少吃高嘌呤食物，多喝温水。',
    summaryTone: 'good',
    meals: [
      {
        meal: '早餐',
        time: '08:10',
        title: '白粥、鸡蛋、青菜',
        photo: '/perf/health-diet/breakfast-table.jpg',
        calories: '约 360 千卡',
        nutrition: '蛋白质适中，脂肪较低，青菜补充了少量维生素。',
        risk: '血糖平稳',
        note: '搭配清淡，整体比较稳，午餐可以多一点深色蔬菜。',
        tone: 'good',
      },
      {
        meal: '午餐',
        time: '12:25',
        title: '蒸鱼、米饭、时蔬',
        photo: '/perf/health-diet/home-meal.jpg',
        calories: '约 520 千卡',
        nutrition: '蛋白质较足，主食适中，蔬菜能补充膳食纤维。',
        risk: '血脂友好',
        note: '鱼肉适合补充蛋白，米饭量保持半碗到一碗就好。',
        tone: 'good',
      },
      { meal: '晚餐', isAdd: true },
    ],
  },
  {
    date: '6月21日',
    summaryTitle: '三餐已记录，全天整体正常',
    summaryText: '蛋白质、主食和蔬菜都有覆盖，午餐略偏咸，晚餐清淡一些后整体更平衡。',
    summaryTone: 'good',
    meals: [
      {
        meal: '早餐',
        time: '07:55',
        title: '燕麦、牛奶、苹果',
        photo: '/perf/health-diet/breakfast-table.jpg',
        calories: '约 330 千卡',
        nutrition: '膳食纤维较足，牛奶补充蛋白，水果带来维生素。',
        risk: '血脂友好',
        note: '粗粮和水果搭配好，牛奶不加糖更稳妥。',
        tone: 'good',
      },
      {
        meal: '午餐',
        time: '12:18',
        title: '米饭、炒青菜、瘦肉',
        photo: '/perf/health-diet/home-meal.jpg',
        calories: '约 560 千卡',
        nutrition: '蛋白质适中，蔬菜足够，主食量需要留意一点。',
        risk: '血压风险偏高',
        note: '这餐可能偏咸，下午多喝温水，晚餐尽量清淡一点。',
        tone: 'risk',
      },
      {
        meal: '晚餐',
        time: '18:35',
        title: '青菜豆腐汤、少量米饭',
        photo: '/perf/health-diet/light-dinner.jpg',
        calories: '约 390 千卡',
        nutrition: '脂肪偏低，晚餐负担轻，豆腐补充植物蛋白。',
        risk: '晚餐清淡',
        note: '这餐比较适合作为晚餐，睡前不再加重口味零食就很好。',
        tone: 'good',
      },
    ],
  },
]

const healthRecordTabs: { id: HealthRecordTab; label: string }[] = [
  { id: 'daily', label: '身体数据' },
  { id: 'diet', label: '饮食记录' },
  { id: 'report', label: '健康报告' },
  { id: 'cognition', label: '记忆认知' },
]

const DOCTOR_DEMO_STORAGE_KEY = 'frameDoctorDemoRecord'
const VALID_HEALTH_RECORD_TABS: HealthRecordTab[] = ['diet', 'daily', 'report']

function getHealthRecordTabFromSearch(value: string | null): HealthRecordTab {
  return VALID_HEALTH_RECORD_TABS.includes(value as HealthRecordTab) ? value as HealthRecordTab : 'daily'
}

function readDoctorDemoRecord(): DoctorDemoRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(DOCTOR_DEMO_STORAGE_KEY) || 'null') as Partial<DoctorDemoRecord> | null
    if (!parsed || !parsed.type || !parsed.tab || typeof parsed.savedAt !== 'number') return null
    if (!['bloodPressure', 'report', 'lab', 'diet'].includes(parsed.type)) return null
    if (!VALID_HEALTH_RECORD_TABS.includes(parsed.tab)) return null
    return parsed as DoctorDemoRecord
  } catch {
    return null
  }
}

const HEALTH_TIP_CATEGORIES = ['全部', '血压血糖', '饮食', '防跌倒', '中医调养']

const cognitionSignals = [
  { label: '重复提问', value: '略有增加', tone: 'watch' },
  { label: '找物品', value: '本周 2 次', tone: 'soft' },
  { label: '表达连贯', value: '稳定', tone: 'good' },
]

const healthTips = [
  {
    title: '血压高一点，先做这三件事',
    category: '血压血糖',
    meta: '3分钟',
    summary: '先坐下休息，复测一次，再回想今天盐分和情绪有没有波动。',
    photo: '/perf/health-tips/elder-care.jpg',
  },
  {
    title: '晚饭后怎么吃更舒服',
    category: '饮食',
    meta: '4分钟',
    summary: '少油少盐，饭后慢慢走一会儿，夜里别一次喝太多水。',
    photo: '/perf/health-diet/home-meal.jpg',
  },
  {
    title: '夜里起身防跌倒',
    category: '防跌倒',
    meta: '3分钟',
    summary: '床边留灯，拖鞋放顺，起身先坐一会儿再站起来。',
    photo: '/perf/health-tips/healthy-walk.jpg',
  },
  {
    title: '晨起先喝温水还是先吃药',
    category: '中医调养',
    meta: '3分钟',
    summary: '早上先坐稳、喝几口温水，再按医嘱吃药，别空腹喝浓茶。',
    photo: '/perf/health-tips/elder-care.jpg',
  },
  {
    title: '湿热天怎么吃得清爽',
    category: '中医调养',
    meta: '4分钟',
    summary: '少油炸和太甜的点心，粥汤里加些青菜，下午茶别喝太浓。',
    photo: '/perf/health-diet/light-dinner.jpg',
  },
  {
    title: '睡前泡脚要注意什么',
    category: '中医调养',
    meta: '3分钟',
    summary: '水温别太烫，十来分钟就好；如果头晕胸闷，先停下来告诉家人。',
    photo: '/perf/health-tips/healthy-walk.jpg',
  },
]

const healthConvenienceServices = [
  {
    title: '居家护理',
    desc: '上门护理 康复照护',
    Icon: HouseLine,
  },
  {
    title: '认知专区',
    desc: '记忆观察 认知训练',
    Icon: HeadCircuit,
  },
  {
    title: '远程医疗',
    desc: '线上问三甲医生',
    Icon: VideoCamera,
  },
  {
    title: '就医协助',
    desc: '报告解读 挂号陪诊',
    Icon: CalendarCheck,
  },
]

export function FrameHealthPage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1700)
  }

  const openModule = (moduleId: string) => {
    if (moduleId === 'service') {
      navigate(withScenario('/frame/ai?role=doctor'))
      return
    }
    if (moduleId === 'cognition') {
      showToast('记忆与认知即将上线')
      return
    }
    navigate(withScenario(`/frame/health/${moduleId}`))
  }

  return (
    <FramePageShell className="frame-space-page frame-health-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario('/frame'))} aria-label="返回相框">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>健康守望</h1>
      </header>

      <main className="frame-health-entry">
        <div className="frame-health-entry__section-title">
          <h2>常用功能</h2>
        </div>
        <section className="frame-health-entry__modules" aria-label="健康守望功能">
          {HEALTH_MODULES.map(({ id, title, description, Icon: ModuleIcon }) => (
            <button className={`frame-health-module-card frame-health-module-card--${id}`} key={id} type="button" onClick={() => openModule(id)}>
              {id === 'service' ? (
                <span className="frame-health-module-card__doctor-avatar" aria-hidden="true">
                  <img src="/elder-ai-boy-doctor-halfbody-v1.png" alt="" draggable={false} />
                </span>
              ) : (
                <ModuleIcon size={36} weight="duotone" />
              )}
              <strong>{title}</strong>
              <p>{description}</p>
            </button>
          ))}
        </section>

        <section className="frame-health-home-service" aria-label="健康服务">
          <div className="frame-health-home-service__title">
            <h2>健康服务</h2>
          </div>
          <section className="frame-health-home-service__left" aria-label="便民健康服务">
            <div className="frame-health-home-service__body">
              <div className="frame-health-service-primary-grid">
                {healthConvenienceServices.map(({ title, desc, Icon: ServiceIcon }) => (
                  <button
                    className={`frame-health-service-main-card ${title === '认知专区' ? 'frame-health-service-main-card--cognition' : ''}`}
                    key={title}
                    type="button"
                    onClick={() => showToast(title === '认知专区' ? '认知专区即将上线' : `${title}服务已为你登记`)}
                  >
                    <ServiceIcon size={32} weight="duotone" aria-hidden="true" />
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <section className="frame-health-community-doctor frame-health-community-doctor--embedded">
              <div className="frame-health-community-doctor__card">
                <img src="/health/services/community-doctor-chen-jing.jpg" alt="" loading="eager" decoding="async" />
                <div>
                  <strong>陈静医生</strong>
                  <p><MapPin size={19} weight="fill" aria-hidden="true" /> 海湾社区健康中心</p>
                </div>
                <button type="button" onClick={() => showToast('已为你联系社区医生')}>
                  联系我的社区医生
                </button>
              </div>
            </section>
          </section>
        </section>
      </main>

      {toastMessage ? <div className="frame-settings-toast">{toastMessage}</div> : null}
    </FramePageShell>
  )
}

export function FrameHealthDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const [toastMessage, setToastMessage] = useState('')
  const [medicineStatus, setMedicineStatus] = useState<Record<string, MedicineStatus>>({ morning: 'done' })
  const [selectedMedicineSchedule, setSelectedMedicineSchedule] = useState<MedicineSchedule | null>(null)
  const [checkinMonthOffset, setCheckinMonthOffset] = useState(0)
  const [healthRecordTab, setHealthRecordTab] = useState<HealthRecordTab>(() => getHealthRecordTabFromSearch(searchParams.get('tab')))
  const [doctorDemoRecord, setDoctorDemoRecord] = useState<DoctorDemoRecord | null>(() => readDoctorDemoRecord())
  const [healthTipCategory, setHealthTipCategory] = useState('全部')
  const module = id && id in HEALTH_MODULE_MAP ? HEALTH_MODULE_MAP[id as HealthModuleId] : null

  useEffect(() => {
    setHealthRecordTab(getHealthRecordTabFromSearch(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    setDoctorDemoRecord(readDoctorDemoRecord())
  }, [module?.id, healthRecordTab])

  if (!module) {
    return <Navigate to={withScenario('/frame/health')} replace />
  }

  if (module.id === 'service') {
    return <Navigate to={withScenario('/frame/ai?role=doctor')} replace />
  }

  const ModuleIcon = module.Icon
  const checkinMonth = getCheckinMonth(checkinMonthOffset)
  const visibleHealthTips = healthTipCategory === '全部' ? healthTips : healthTips.filter((tip) => tip.category === healthTipCategory)
  const checkinBackToDiary = module.id === 'checkin' && searchParams.get('from') === 'diary'
  const backTarget = module.id === 'checkin' ? (checkinBackToDiary ? '/frame/diary' : '/frame') : '/frame/health'
  const backLabel = module.id === 'checkin' ? (checkinBackToDiary ? '返回AI日记' : '返回相框首页') : '返回健康守望'

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1800)
  }

  const updateMedicineStatus = (scheduleId: string, status: MedicineStatus) => {
    setMedicineStatus((current) => ({ ...current, [scheduleId]: status }))
    setSelectedMedicineSchedule(null)
    showToast(status === 'done' ? '已记录服药' : '已记录还没吃')
  }

  return (
    <FramePageShell className={`frame-space-page frame-health-page frame-health-detail-page frame-health-detail-page--${module.id} frame-light-nav-page`} mode={mode}>
      <header className={`frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav${module.id === 'records' ? ' frame-health-records-topbar' : ''}`}>
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario(backTarget))} aria-label={backLabel}>
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        {module.id !== 'records' ? <h1>{module.id === 'checkin' ? '打卡记录' : module.title}</h1> : null}
        {module.id === 'records' ? (
          <nav className="frame-health-record-top-tabs" aria-label="健康记录分类">
            {healthRecordTabs.map((tab) => (
              <button
                className={healthRecordTab === tab.id ? 'is-active' : ''}
                key={tab.id}
                onClick={() => tab.id === 'cognition' ? showToast('记忆与认知即将上线') : setHealthRecordTab(tab.id)}
                type="button"
              >
                <strong>{tab.label}</strong>
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      {module.id === 'records' ? (
        <main className="frame-health-records-canvas">
          {healthRecordTab === 'diet' ? (
            <section className="frame-health-diet-board" aria-label="饮食记录">
              {doctorDemoRecord?.type === 'diet' ? (
                <section className="frame-health-ai-saved-card frame-health-ai-saved-card--diet" aria-label="AI刚记录的饮食">
                  <BowlFood size={34} weight="duotone" aria-hidden="true" />
                  <div>
                    <span>AI刚记录</span>
                    <strong>今天晚餐已归档</strong>
                    <p>结合午餐看，今天蛋白质基本够；晚餐米饭适量，酱汁少蘸。</p>
                  </div>
                </section>
              ) : null}
              {dietRecordWeeks.map((group) => (
                <section className="frame-health-diet-day" key={group.date} aria-label={`${group.date}饮食记录`}>
                  <h2>
                    <BowlFood size={30} weight="duotone" aria-hidden="true" />
                    <strong>{group.date}</strong>
                  </h2>
                  <div className={`frame-health-diet-day__summary is-${group.summaryTone}`}>
                    {group.summaryTone === 'risk' ? <Warning size={26} weight="fill" aria-hidden="true" /> : null}
                    <strong>{group.summaryTitle}</strong>
                    <p>{group.summaryText}</p>
                  </div>
                  <div className="frame-health-diet-rail">
                    {group.meals.map((meal) => (
                      meal.isAdd ? (
                        <button className="frame-health-diet-add-card" key={`${group.date}-${meal.meal}-add`} type="button" onClick={() => showToast('可以拍照添加饮食记录')}>
                          <span><Plus size={34} weight="bold" aria-hidden="true" /></span>
                          <strong>{meal.meal}未记录</strong>
                          <p>拍下这一餐，AI会自动识别食物和风险。</p>
                        </button>
                      ) : (
                      <article className="frame-health-diet-card" key={`${group.date}-${meal.meal}`}>
                        <div className="frame-health-diet-card__photo">
                          <img src={meal.photo} alt="" loading="lazy" decoding="async" />
                        </div>
                        <div className="frame-health-diet-card__body">
                          <header>
                            <strong>{meal.meal}</strong>
                            <time>{meal.time}</time>
                          </header>
                          <div className="frame-health-diet-card__insight">
                            <strong>识别到：{meal.title}</strong>
                            <p>{meal.calories}，{meal.nutrition}</p>
                          </div>
                          <div className={`frame-health-diet-card__note is-${meal.tone}`}>
                            {meal.tone === 'risk' ? <Warning size={25} weight="fill" aria-hidden="true" /> : null}
                            <strong>{meal.risk}</strong>
                            <p>{meal.note}</p>
                          </div>
                        </div>
                      </article>
                      )
                    ))}
                  </div>
                </section>
              ))}
            </section>
          ) : healthRecordTab === 'daily' ? (
            <section className="frame-health-data-board frame-health-data-board--standalone" aria-label="日常健康数据">
              {[
                ...(doctorDemoRecord?.type === 'bloodPressure' ? [{
                  label: '血压',
                  value: doctorDemoRecord.value || '148/86',
                  unit: 'mmHg',
                  time: '刚刚',
                  note: doctorDemoRecord.note || '比昨天 136/82 高一些，先休息后复测。',
                }] : []),
                ...healthRecords,
              ].map((record, index) => (
                <article className={index === 0 && doctorDemoRecord?.type === 'bloodPressure' ? 'frame-health-data-card--ai-saved' : undefined} key={`${record.label}-${record.time}-${index}`}>
                  <span>{record.label}</span>
                  <time>{record.time}</time>
                  <strong>
                    {record.value}
                    {record.unit ? <small>{record.unit}</small> : null}
                  </strong>
                  <p>{record.note}</p>
                </article>
              ))}
            </section>
          ) : (
            <section className="frame-health-report-years" aria-label="健康报告">
              {healthReportGroups.map((group) => (
                <section className="frame-health-report-year" key={group.year} aria-label={`${group.year}健康报告`}>
                  <h2>{group.year}</h2>
                  <div className="frame-health-report-grid frame-health-report-grid--standalone">
                    {[
                      ...(group.year === '2026年' && doctorDemoRecord?.tab === 'report' ? [{
                        title: doctorDemoRecord.type === 'lab' ? 'AI解读血脂化验单' : 'AI解读血脂体检报告',
                        date: '刚刚',
                        summary: doctorDemoRecord.type === 'lab'
                          ? '甘油三酯比5月略高，已提醒清淡饮食并给家人看。'
                          : '血脂仍偏高，但比上次年度体检略稳，继续少油和饭后慢走。',
                        type: doctorDemoRecord.type === 'lab' ? '化验' : '体检',
                        isAiSaved: true,
                      }] : []),
                      ...group.reports,
                    ].map((report: { title: string; date: string; summary: string; type: string; isAiSaved?: boolean }) => (
                      <article className={report.isAiSaved ? 'frame-health-ai-saved-report' : undefined} key={`${group.year}-${report.title}-${report.date}`}>
                        <span>{report.type}</span>
                        <strong>{report.title}</strong>
                        <time>{report.date}</time>
                        <p>{report.summary}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
        </main>
      ) : module.id === 'tips' ? (
        <main className="frame-health-tips-canvas">
          <section className="frame-square-topic-rail frame-health-tips-topic-rail" aria-label="健康内容分类">
            {HEALTH_TIP_CATEGORIES.map((category) => (
              <button key={category} className={healthTipCategory === category ? 'is-active' : ''} type="button" onClick={() => setHealthTipCategory(category)}>
                {category}
              </button>
            ))}
          </section>

          <section className="frame-health-tips-grid" aria-label={`${healthTipCategory}健康小贴士`}>
            {visibleHealthTips.map((tip) => (
              <button className="frame-health-tip-card" key={tip.title} type="button" onClick={() => showToast(`正在播放：${tip.title}`)}>
                <div>
                  <img src={tip.photo} alt="" loading="lazy" decoding="async" />
                  <em>{tip.category}</em>
                </div>
                <h2>{tip.title}</h2>
                <span className="frame-health-tip-card__footer">
                  <small><Play size={20} weight="fill" aria-hidden="true" /> 读给我听</small>
                  <time>{tip.meta}</time>
                </span>
              </button>
            ))}
          </section>
        </main>
      ) : (
      <main className="frame-health-detail">
        {module.id !== 'checkin' && module.id !== 'medicine' ? (
          <section className="frame-health-detail-hero" aria-label={`${module.title}概览`}>
            <div className="frame-health-detail-hero__icon">
              <ModuleIcon size={50} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <span>健康守望</span>
              <h2>{module.detailTitle}</h2>
              <p>{module.detailSummary}</p>
            </div>
            <button className="frame-health-detail-hero__primary" type="button" onClick={() => showToast(`${module.primaryAction}已记录`)}>
              <Plus size={26} weight="bold" aria-hidden="true" />
              {module.primaryAction}
            </button>
          </section>
        ) : null}

        <section className="frame-health-detail-workspace">
          <div className="frame-health-detail-panel frame-health-detail-panel--main">
            {module.id === 'checkin' ? (
              <>
                <div className="frame-health-panel-heading frame-health-checkin-heading">
                  <div className="frame-health-checkin-month-switch">
                    <button type="button" onClick={() => setCheckinMonthOffset((current) => current - 1)} aria-label="查看上个月">
                      <CaretLeft size={28} weight="bold" aria-hidden="true" />
                    </button>
                    <span>{checkinMonth.label}</span>
                    <button type="button" onClick={() => setCheckinMonthOffset((current) => Math.min(current + 1, 0))} aria-label="查看下个月" disabled={checkinMonthOffset >= 0}>
                      <CaretRight size={28} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="frame-health-checkin-calendar" aria-label="本月打卡日历">
                  {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
                    <span className="frame-health-checkin-calendar__weekday" key={weekday}>周{weekday}</span>
                  ))}
                  {checkinMonth.days.map((item) => (
                    <button
                      className={`frame-health-checkin-day is-${item.state}`}
                      key={item.key}
                      type="button"
                      disabled={item.state === 'blank'}
                      onClick={() => showToast(item.state === 'future' ? '还没到这一天' : `${item.day}日 ${checkinStateLabel[item.state] || '已记录'}`)}
                    >
                      {item.day ? <strong>{item.day}</strong> : null}
                      {checkinStateLabel[item.state] ? <span>{checkinStateLabel[item.state]}</span> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {module.id === 'medicine' ? (
              <>
                <div className="frame-health-medicine-datebar" aria-label="用药日期">
                  <button type="button" onClick={() => showToast('已切到昨天')}>
                    <CaretLeft size={24} weight="bold" aria-hidden="true" />
                    昨天
                  </button>
                  <div>
                    <strong>6月23日 周二</strong>
                  </div>
                  <button type="button" onClick={() => showToast('已切到明天')}>
                    明天
                    <CaretRight size={24} weight="bold" aria-hidden="true" />
                  </button>
                </div>
                <div className="frame-health-medicine-schedule">
                  {medicineSchedules.map((item) => {
                    const status = medicineStatus[item.id] ?? (item.id === 'night' ? 'upcoming' : 'missed')
                    const isDone = status === 'done'
                    const isUpcoming = status === 'upcoming'

                    return (
                      <button className={`frame-health-medicine-card is-${status}`} key={item.id} type="button" onClick={() => setSelectedMedicineSchedule(item)}>
                        <span className="frame-health-medicine-card__time">
                          <time>{item.time}</time>
                          <small>{item.period}</small>
                        </span>
                        <span className={`frame-health-medicine-card__items is-count-${Math.min(item.medicines.length, 5)}`}>
                          {item.medicines.map((medicine) => (
                            <span className="frame-health-medicine-card__item" key={medicine.id}>
                              <img src={medicine.photo} alt="" loading="lazy" decoding="async" />
                              <strong>{medicine.name}</strong>
                              <small>{medicine.dosage}</small>
                            </span>
                          ))}
                        </span>
                        <span className="frame-health-medicine-card__status">
                          {isDone ? <CheckCircle size={32} weight="fill" aria-hidden="true" /> : isUpcoming ? <Clock size={32} weight="duotone" aria-hidden="true" /> : <WarningCircle size={32} weight="duotone" aria-hidden="true" />}
                          {isDone ? '已吃完' : isUpcoming ? '未到点' : '还没吃'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}

            {module.id === 'cognition' ? (
              <>
                <div className="frame-health-panel-heading">
                  <span>温和观察</span>
                  <h2>先看趋势，不制造焦虑</h2>
                </div>
                <div className="frame-health-cognition-meter">
                  <HeadCircuit size={72} weight="duotone" aria-hidden="true" />
                  <strong>本周整体稳定</strong>
                  <p>有两次找物品记录，建议家人继续陪聊观察。</p>
                </div>
                <div className="frame-health-signal-grid">
                  {cognitionSignals.map((signal) => (
                    <article className={`is-${signal.tone}`} key={signal.label}>
                      <span>{signal.label}</span>
                      <strong>{signal.value}</strong>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

          </div>

          {module.id === 'checkin' ? (
            <aside className="frame-health-detail-panel frame-health-detail-panel--side frame-health-checkin-side" aria-label="打卡数据与奖励">
              <div className="frame-health-checkin-data">
                <div className="frame-health-checkin-section-title">
                  <CalendarCheck size={36} weight="duotone" aria-hidden="true" />
                  <h2>打卡数据</h2>
                </div>
                <div className="frame-health-checkin-stats" aria-label="打卡统计">
                  <article>
                    <span>连续打卡</span>
                    <strong>7 天</strong>
                  </article>
                  <article>
                    <span>累计打卡</span>
                    <strong>48 天</strong>
                  </article>
                  <article>
                    <span>本月未打</span>
                    <strong>2 天</strong>
                  </article>
                </div>
              </div>
              <div className="frame-health-checkin-rewards">
                <div className="frame-health-checkin-section-title">
                  <Gift size={36} weight="duotone" aria-hidden="true" />
                  <h2>打卡奖励</h2>
                </div>
                <div className="frame-health-checkin-reward-list" aria-label="打卡奖励">
                  <article className="is-done">
                    <span>累计 3 天</span>
                    <strong>暖心问候卡</strong>
                    <em>已达成</em>
                  </article>
                  <article className="is-done">
                    <span>累计 7 天</span>
                    <strong>纸巾一提</strong>
                    <em>已达成</em>
                  </article>
                  <article>
                    <span>累计 14 天</span>
                    <strong>超市优惠券</strong>
                    <em>继续打卡</em>
                  </article>
                  <article className="is-current">
                    <span>累计 21 天</span>
                    <strong>纸质回忆录</strong>
                    <em>还差 14 天</em>
                  </article>
                  <article>
                    <span>累计 30 天</span>
                    <strong>健康礼包</strong>
                    <em>继续打卡</em>
                  </article>
                  <article>
                    <span>累计 60 天</span>
                    <strong>水果礼盒券</strong>
                    <em>继续打卡</em>
                  </article>
                  <article>
                    <span>累计 90 天</span>
                    <strong>居家清洁券</strong>
                    <em>继续打卡</em>
                  </article>
                </div>
              </div>
            </aside>
          ) : module.id === 'medicine' ? null : (
            <aside className="frame-health-detail-panel frame-health-detail-panel--side" aria-label="健康守望辅助信息">
              <div className="frame-health-panel-heading">
                <span>AI守望</span>
                <h2>需要关注的事</h2>
              </div>
              <article className="frame-health-watch-note">
                <ShieldCheck size={38} weight="duotone" aria-hidden="true" />
                <div>
                  <strong>已同步给家人</strong>
                  <p>重要提醒会同时出现在子女端，家人可以帮忙确认。</p>
                </div>
              </article>
              <article className="frame-health-watch-note">
                <Heartbeat size={38} weight="duotone" aria-hidden="true" />
                <div>
                  <strong>连续记录更有用</strong>
                  <p>AI会把每天的小变化连起来看，发现异常再提醒。</p>
                </div>
              </article>
              <article className="frame-health-watch-note is-warning">
                <WarningCircle size={38} weight="duotone" aria-hidden="true" />
                <div>
                  <strong>不替代医生诊断</strong>
                  <p>遇到明显不舒服，优先联系家人或线下医生。</p>
                </div>
              </article>
            <button className="frame-health-side-doctor" type="button" onClick={() => navigate(withScenario('/frame/ai?role=doctor'))}>
                <Stethoscope size={34} weight="duotone" aria-hidden="true" />
                去问 AI医生
              </button>
            </aside>
          )}
        </section>
      </main>

      )}
      {selectedMedicineSchedule ? (
        <div className="frame-medicine-dialog-backdrop" role="presentation" onClick={() => setSelectedMedicineSchedule(null)}>
          <section className="frame-medicine-dialog frame-letter-layout" role="dialog" aria-modal="true" aria-labelledby="frame-medicine-dialog-title" onClick={(event) => event.stopPropagation()}>
            <button className="frame-letter-close frame-medicine-dialog__close" type="button" aria-label="关闭用药提醒" onClick={() => setSelectedMedicineSchedule(null)}>
              <X size={34} weight="bold" aria-hidden="true" />
            </button>
            <div className="frame-medicine-dialog__visual frame-letter-sheet">
              <div className={`frame-medicine-dialog__photo-board is-count-${Math.min(selectedMedicineSchedule.medicines.length, 5)}`}>
                {selectedMedicineSchedule.medicines.map((medicine) => (
                  <article key={medicine.id}>
                    <img src={medicine.photo} alt="" loading="lazy" decoding="async" />
                    <strong>{medicine.name}</strong>
                    <span>{medicine.dosage}</span>
                  </article>
                ))}
              </div>
            </div>

            <aside className="frame-medicine-dialog__content frame-letter-reply-panel">
              <span className="frame-medicine-dialog__eyebrow">{selectedMedicineSchedule.time} · {selectedMedicineSchedule.period}</span>
              <h2 id="frame-medicine-dialog-title">现在该吃药了</h2>
              <p>对照左侧照片确认药片，吃完后点下方按钮完成记录。</p>
              <div className="frame-medicine-dialog__actions">
                <button className="frame-medicine-dialog__primary" type="button" onClick={() => updateMedicineStatus(selectedMedicineSchedule.id, 'done')}>
                  <CheckFat size={38} weight="bold" aria-hidden="true" />
                  我已吃完
                </button>
                <button className="frame-medicine-dialog__secondary" type="button" onClick={() => updateMedicineStatus(selectedMedicineSchedule.id, 'missed')}>
                  还没吃
                </button>
              </div>
            </aside>
          </section>
        </div>
      ) : null}
      {toastMessage ? <div className="frame-settings-toast">{toastMessage}</div> : null}
    </FramePageShell>
  )
}
