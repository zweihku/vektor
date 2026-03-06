import type {
  Resume,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  SectionOrder,
  ThemeConfig,
} from '../types/resume'

export const defaultSections: SectionOrder[] = [
  { type: 'personalInfo', visible: true },
  { type: 'summary', visible: true },
  { type: 'workExperience', visible: true },
  { type: 'education', visible: true },
  { type: 'skills', visible: true },
  { type: 'projects', visible: true },
  { type: 'certifications', visible: true },
  { type: 'languages', visible: true },
]

const defaultTheme: ThemeConfig = {
  primaryColor: '#2563eb',
  fontFamily: 'Inter, system-ui, sans-serif',
}

function generateId(): string {
  return crypto.randomUUID()
}

const samplePersonalInfo: PersonalInfo = {
  fullName: '张三',
  email: 'zhangsan@email.com',
  phone: '+86 138-0000-0000',
  location: '北京市海淀区',
  linkedin: 'linkedin.com/in/sanzhang',
  website: 'zhangsan.dev',
  jobTitle: '高级前端工程师',
}

const sampleWorkExperience: WorkExperience[] = [
  {
    id: generateId(),
    company: '字节跳动',
    position: '高级前端工程师',
    location: '北京',
    startDate: '2022-03',
    endDate: '',
    current: true,
    bullets: [
      '负责抖音电商核心交易链路的前端架构设计与优化，日均 PV 超过 5000 万',
      '主导前端微服务架构迁移，将构建时间缩短 60%，部署效率提升 3 倍',
      '设计并实现组件库，覆盖 80+ 业务组件，团队复用率达到 90%',
    ],
  },
  {
    id: generateId(),
    company: '阿里巴巴',
    position: '前端工程师',
    location: '杭州',
    startDate: '2019-07',
    endDate: '2022-02',
    current: false,
    bullets: [
      '参与淘宝首页改版项目，使用 React + TypeScript 重构核心模块',
      '优化页面加载性能，首屏加载时间从 3.2s 降至 1.5s',
      '开发自动化测试框架，代码覆盖率从 45% 提升至 85%',
    ],
  },
]

const sampleEducation: Education[] = [
  {
    id: generateId(),
    school: '清华大学',
    degree: '硕士',
    field: '计算机科学与技术',
    startDate: '2017-09',
    endDate: '2019-06',
    gpa: '3.8/4.0',
    bullets: [
      '研究方向：前端工程化与 Web 性能优化',
      '发表 SCI 论文 2 篇，获得国家奖学金',
    ],
  },
  {
    id: generateId(),
    school: '北京大学',
    degree: '学士',
    field: '软件工程',
    startDate: '2013-09',
    endDate: '2017-06',
    gpa: '3.6/4.0',
    bullets: ['校级优秀毕业生，ACM/ICPC 区域赛银牌'],
  },
]

const sampleSkills: Skill[] = [
  { id: generateId(), name: 'TypeScript', level: 5 },
  { id: generateId(), name: 'Vue.js', level: 5 },
  { id: generateId(), name: 'React', level: 4 },
  { id: generateId(), name: 'Node.js', level: 4 },
  { id: generateId(), name: 'Webpack / Vite', level: 4 },
  { id: generateId(), name: 'CSS / Tailwind', level: 5 },
  { id: generateId(), name: 'Docker / K8s', level: 3 },
  { id: generateId(), name: 'CI/CD', level: 3 },
]

const sampleProjects: Project[] = [
  {
    id: generateId(),
    name: '开源组件库 ZUI',
    role: '核心维护者',
    url: 'github.com/zhangsan/zui',
    startDate: '2023-01',
    endDate: '',
    bullets: [
      '基于 Vue 3 + TypeScript 开发的企业级组件库，GitHub Star 2000+',
      '支持按需加载、主题定制、国际化，npm 周下载量 5000+',
    ],
  },
]

const sampleCertifications: Certification[] = [
  {
    id: generateId(),
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    date: '2023-06',
    url: '',
  },
]

const sampleLanguages: Language[] = [
  { id: generateId(), name: '中文', proficiency: 'native' },
  { id: generateId(), name: 'English', proficiency: 'fluent' },
]

export function createDefaultResume(name: string = '我的简历'): Resume {
  return {
    id: generateId(),
    name,
    updatedAt: new Date().toISOString(),
    template: 'modern',
    language: 'zh',
    theme: { ...defaultTheme },
    sections: defaultSections.map((s) => ({ ...s })),
    personalInfo: { ...samplePersonalInfo },
    summary:
      '拥有 5 年以上前端开发经验的高级工程师，精通 Vue.js、React 和 TypeScript。擅长大规模 Web 应用架构设计与性能优化，具有丰富的团队协作和技术方案输出经验。热衷开源社区贡献，追求极致的用户体验和代码质量。',
    workExperience: sampleWorkExperience.map((w) => ({
      ...w,
      id: generateId(),
      bullets: [...w.bullets],
    })),
    education: sampleEducation.map((e) => ({
      ...e,
      id: generateId(),
      bullets: [...e.bullets],
    })),
    skills: sampleSkills.map((s) => ({ ...s, id: generateId() })),
    projects: sampleProjects.map((p) => ({
      ...p,
      id: generateId(),
      bullets: [...p.bullets],
    })),
    certifications: sampleCertifications.map((c) => ({ ...c, id: generateId() })),
    languages: sampleLanguages.map((l) => ({ ...l, id: generateId() })),
  }
}

export function createEmptyResume(name: string = '未命名简历'): Resume {
  return {
    id: generateId(),
    name,
    updatedAt: new Date().toISOString(),
    template: 'modern',
    language: 'zh',
    theme: { ...defaultTheme },
    sections: defaultSections.map((s) => ({ ...s })),
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      jobTitle: '',
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  }
}
