<script setup lang="ts">
import { computed } from 'vue'
import type { Resume, SectionType } from '../../types/resume'
import { sectionLabels, proficiencyLabels, currentLabel } from '../../utils/resumeLabels'
import { useResumeStore } from '../../stores/resumeStore'

const props = defineProps<{
  resume: Resume
}>()

const store = useResumeStore()
const lang = computed(() => store.language)
const labels = computed(() => sectionLabels(lang.value))
const profLabels = computed(() => proficiencyLabels(lang.value))

function formatDate(date: string): string {
  if (!date) return ''
  const [year, month] = date.split('-')
  if (!month) return year || ''
  return `${year}.${month.padStart(2, '0')}`
}

function dateRange(start: string, end: string, current?: boolean): string {
  const s = formatDate(start)
  const e = current ? currentLabel(lang.value) : formatDate(end)
  if (!s && !e) return ''
  if (!s) return e
  if (!e) return s
  return `${s} - ${e}`
}

function proficiencyLabel(level: string): string {
  return profLabels.value[level] || level
}

function hasContent(type: SectionType): boolean {
  const r = props.resume
  switch (type) {
    case 'personalInfo':
      return !!(r.personalInfo.fullName || r.personalInfo.email || r.personalInfo.phone)
    case 'summary':
      return !!r.summary
    case 'workExperience':
      return r.workExperience.length > 0
    case 'education':
      return r.education.length > 0
    case 'skills':
      return r.skills.length > 0
    case 'projects':
      return r.projects.length > 0
    case 'certifications':
      return r.certifications.length > 0
    case 'languages':
      return r.languages.length > 0
    default:
      return false
  }
}

// Sidebar sections: personal info, skills, languages, certifications
const sidebarSections: SectionType[] = ['personalInfo', 'skills', 'languages', 'certifications']
const mainSections: SectionType[] = ['summary', 'workExperience', 'education', 'projects']

function orderedSidebar(): SectionType[] {
  return props.resume.sections
    .filter((s) => sidebarSections.includes(s.type) && s.visible && hasContent(s.type))
    .map((s) => s.type)
}

function orderedMain(): SectionType[] {
  return props.resume.sections
    .filter((s) => mainSections.includes(s.type) && s.visible && hasContent(s.type))
    .map((s) => s.type)
}

// Lighter variant of the primary color for backgrounds
const lightBg = computed(() => props.resume.theme.primaryColor + '12')
</script>

<template>
  <div
    class="creative-template"
    :style="{ fontFamily: resume.theme.fontFamily }"
  >
    <!-- Full-width colored header -->
    <div
      class="creative-header"
      :style="{ backgroundColor: resume.theme.primaryColor }"
    >
      <div class="header-content">
        <div class="header-initials" :style="{ color: resume.theme.primaryColor }">
          {{ resume.personalInfo.fullName ? resume.personalInfo.fullName.charAt(0) : '' }}
        </div>
        <div class="header-text">
          <h1 class="header-name">{{ resume.personalInfo.fullName }}</h1>
          <div v-if="resume.personalInfo.jobTitle" class="header-title">
            {{ resume.personalInfo.jobTitle }}
          </div>
        </div>
      </div>
    </div>

    <!-- Body: Sidebar + Main -->
    <div class="creative-body">
      <!-- Sidebar -->
      <div
        class="creative-sidebar"
        :style="{ backgroundColor: lightBg }"
      >
        <template v-for="section in orderedSidebar()" :key="section">
          <!-- Contact Info -->
          <div v-if="section === 'personalInfo'" class="sidebar-section">
            <div class="sidebar-title" :style="{ color: resume.theme.primaryColor }">
              <span class="sidebar-icon">&#9993;</span> {{ labels['personalInfo'] }}
            </div>
            <div class="contact-grid">
              <div v-if="resume.personalInfo.email" class="contact-row">
                <span class="contact-val">{{ resume.personalInfo.email }}</span>
              </div>
              <div v-if="resume.personalInfo.phone" class="contact-row">
                <span class="contact-val">{{ resume.personalInfo.phone }}</span>
              </div>
              <div v-if="resume.personalInfo.location" class="contact-row">
                <span class="contact-val">{{ resume.personalInfo.location }}</span>
              </div>
              <div v-if="resume.personalInfo.linkedin" class="contact-row">
                <span class="contact-val">{{ resume.personalInfo.linkedin }}</span>
              </div>
              <div v-if="resume.personalInfo.website" class="contact-row">
                <span class="contact-val">{{ resume.personalInfo.website }}</span>
              </div>
            </div>
          </div>

          <!-- Skills with circles -->
          <div v-if="section === 'skills'" class="sidebar-section">
            <div class="sidebar-title" :style="{ color: resume.theme.primaryColor }">
              <span class="sidebar-icon">&#9733;</span> {{ labels['skills'] }}
            </div>
            <div class="skills-creative">
              <div v-for="skill in resume.skills" :key="skill.id" class="skill-row">
                <span class="skill-label">{{ skill.name }}</span>
                <span class="skill-circles">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="skill-circle"
                    :style="{
                      backgroundColor: i <= skill.level ? resume.theme.primaryColor : '#ddd',
                    }"
                  ></span>
                </span>
              </div>
            </div>
          </div>

          <!-- Languages -->
          <div v-if="section === 'languages'" class="sidebar-section">
            <div class="sidebar-title" :style="{ color: resume.theme.primaryColor }">
              <span class="sidebar-icon">&#9742;</span> {{ labels['languages'] }}
            </div>
            <div class="lang-creative">
              <div v-for="lang in resume.languages" :key="lang.id" class="lang-row">
                <span class="lang-name">{{ lang.name }}</span>
                <span class="lang-prof">{{ proficiencyLabel(lang.proficiency) }}</span>
              </div>
            </div>
          </div>

          <!-- Certifications -->
          <div v-if="section === 'certifications'" class="sidebar-section">
            <div class="sidebar-title" :style="{ color: resume.theme.primaryColor }">
              <span class="sidebar-icon">&#9998;</span> {{ labels['certifications'] }}
            </div>
            <div class="cert-creative">
              <div v-for="cert in resume.certifications" :key="cert.id" class="cert-row">
                <div class="cert-name">{{ cert.name }}</div>
                <div class="cert-meta">{{ cert.issuer }}<span v-if="cert.date"> | {{ formatDate(cert.date) }}</span></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Main content -->
      <div class="creative-main">
        <template v-for="section in orderedMain()" :key="section">
          <!-- Summary -->
          <div v-if="section === 'summary'" class="main-section">
            <div class="main-title" :style="{ color: resume.theme.primaryColor }">
              <span
                class="title-bar"
                :style="{ backgroundColor: resume.theme.primaryColor }"
              ></span>
              {{ labels['summary'] }}
            </div>
            <p class="creative-summary">{{ resume.summary }}</p>
          </div>

          <!-- Work Experience -->
          <div v-if="section === 'workExperience'" class="main-section">
            <div class="main-title" :style="{ color: resume.theme.primaryColor }">
              <span
                class="title-bar"
                :style="{ backgroundColor: resume.theme.primaryColor }"
              ></span>
              {{ labels['workExperience'] }}
            </div>
            <div class="timeline">
              <div
                v-for="exp in resume.workExperience"
                :key="exp.id"
                class="timeline-item"
              >
                <div
                  class="timeline-dot"
                  :style="{ backgroundColor: resume.theme.primaryColor }"
                ></div>
                <div class="timeline-content">
                  <div class="tc-header">
                    <div>
                      <div class="tc-title">{{ exp.position }}</div>
                      <div class="tc-sub">
                        {{ exp.company }}<span v-if="exp.location"> | {{ exp.location }}</span>
                      </div>
                    </div>
                    <div class="tc-date" :style="{ color: resume.theme.primaryColor }">
                      {{ dateRange(exp.startDate, exp.endDate, exp.current) }}
                    </div>
                  </div>
                  <ul v-if="exp.bullets.some((b) => b)" class="creative-bullets">
                    <li
                      v-for="(bullet, idx) in exp.bullets.filter((b) => b)"
                      :key="idx"
                    >
                      <span class="bullet-marker" :style="{ color: resume.theme.primaryColor }">&#9656;</span>
                      {{ bullet }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Education -->
          <div v-if="section === 'education'" class="main-section">
            <div class="main-title" :style="{ color: resume.theme.primaryColor }">
              <span
                class="title-bar"
                :style="{ backgroundColor: resume.theme.primaryColor }"
              ></span>
              {{ labels['education'] }}
            </div>
            <div class="timeline">
              <div
                v-for="edu in resume.education"
                :key="edu.id"
                class="timeline-item"
              >
                <div
                  class="timeline-dot"
                  :style="{ backgroundColor: resume.theme.primaryColor }"
                ></div>
                <div class="timeline-content">
                  <div class="tc-header">
                    <div>
                      <div class="tc-title">{{ edu.school }}</div>
                      <div class="tc-sub">
                        {{ edu.degree }}<span v-if="edu.field"> - {{ edu.field }}</span>
                        <span v-if="edu.gpa"> | GPA: {{ edu.gpa }}</span>
                      </div>
                    </div>
                    <div class="tc-date" :style="{ color: resume.theme.primaryColor }">
                      {{ dateRange(edu.startDate, edu.endDate) }}
                    </div>
                  </div>
                  <ul v-if="edu.bullets.some((b) => b)" class="creative-bullets">
                    <li
                      v-for="(bullet, idx) in edu.bullets.filter((b) => b)"
                      :key="idx"
                    >
                      <span class="bullet-marker" :style="{ color: resume.theme.primaryColor }">&#9656;</span>
                      {{ bullet }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Projects -->
          <div v-if="section === 'projects'" class="main-section">
            <div class="main-title" :style="{ color: resume.theme.primaryColor }">
              <span
                class="title-bar"
                :style="{ backgroundColor: resume.theme.primaryColor }"
              ></span>
              {{ labels['projects'] }}
            </div>
            <div class="timeline">
              <div
                v-for="proj in resume.projects"
                :key="proj.id"
                class="timeline-item"
              >
                <div
                  class="timeline-dot"
                  :style="{ backgroundColor: resume.theme.primaryColor }"
                ></div>
                <div class="timeline-content">
                  <div class="tc-header">
                    <div>
                      <div class="tc-title">{{ proj.name }}</div>
                      <div class="tc-sub">
                        {{ proj.role }}<span v-if="proj.url"> | {{ proj.url }}</span>
                      </div>
                    </div>
                    <div class="tc-date" :style="{ color: resume.theme.primaryColor }">
                      {{ dateRange(proj.startDate, proj.endDate) }}
                    </div>
                  </div>
                  <ul v-if="proj.bullets.some((b) => b)" class="creative-bullets">
                    <li
                      v-for="(bullet, idx) in proj.bullets.filter((b) => b)"
                      :key="idx"
                    >
                      <span class="bullet-marker" :style="{ color: resume.theme.primaryColor }">&#9656;</span>
                      {{ bullet }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.creative-template {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  color: #2c2c2c;
  font-size: 9pt;
  line-height: 1.5;
  box-sizing: border-box;
}

/* Header */
.creative-header {
  padding: 8mm 10mm;
  color: #ffffff;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 5mm;
}

.header-initials {
  width: 14mm;
  height: 14mm;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18pt;
  font-weight: 700;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.header-name {
  font-size: 20pt;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5mm;
}

.header-title {
  font-size: 10.5pt;
  font-weight: 400;
  opacity: 0.9;
  margin-top: 1mm;
}

/* Body */
.creative-body {
  display: flex;
  min-height: calc(297mm - 34mm);
}

.creative-sidebar {
  width: 33%;
  padding: 6mm 5mm 8mm 7mm;
  box-sizing: border-box;
}

.creative-main {
  width: 67%;
  padding: 6mm 8mm 8mm 6mm;
  box-sizing: border-box;
}

/* Sidebar */
.sidebar-section {
  margin-bottom: 5mm;
}

.sidebar-title {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4mm;
  margin-bottom: 3mm;
  display: flex;
  align-items: center;
  gap: 1.5mm;
}

.sidebar-icon {
  font-size: 9pt;
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
}

.contact-row {
  font-size: 8pt;
  word-break: break-all;
}

.contact-val {
  color: #444;
}

/* Skills circles */
.skills-creative {
  display: flex;
  flex-direction: column;
  gap: 2.5mm;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-label {
  font-size: 8pt;
  font-weight: 500;
}

.skill-circles {
  display: flex;
  gap: 1mm;
}

.skill-circle {
  width: 2.2mm;
  height: 2.2mm;
  border-radius: 50%;
}

/* Languages */
.lang-creative {
  display: flex;
  flex-direction: column;
  gap: 2mm;
}

.lang-row {
  display: flex;
  justify-content: space-between;
  font-size: 8pt;
}

.lang-name {
  font-weight: 500;
}

.lang-prof {
  color: #666;
  font-size: 7.5pt;
}

/* Certs */
.cert-creative {
  display: flex;
  flex-direction: column;
  gap: 2.5mm;
}

.cert-row {
  font-size: 8pt;
}

.cert-name {
  font-weight: 600;
}

.cert-meta {
  color: #666;
  font-size: 7.5pt;
  margin-top: 0.3mm;
}

/* Main content */
.main-section {
  margin-bottom: 5mm;
}

.main-title {
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 0.3mm;
  margin-bottom: 3mm;
  display: flex;
  align-items: center;
  gap: 2mm;
}

.title-bar {
  width: 3mm;
  height: 4.5mm;
  border-radius: 0.5mm;
  flex-shrink: 0;
}

.creative-summary {
  font-size: 9pt;
  line-height: 1.65;
  color: #444;
  margin: 0;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 4mm;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.8mm;
  top: 1mm;
  bottom: 1mm;
  width: 0.4mm;
  background: #e0e0e0;
}

.timeline-item {
  position: relative;
  margin-bottom: 4mm;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -3.5mm;
  top: 1.2mm;
  width: 2mm;
  height: 2mm;
  border-radius: 50%;
}

.timeline-content {
  padding-left: 1mm;
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tc-title {
  font-size: 10pt;
  font-weight: 600;
  color: #1a1a1a;
}

.tc-sub {
  font-size: 8.5pt;
  color: #666;
  margin-top: 0.5mm;
}

.tc-date {
  font-size: 8pt;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 3mm;
}

.creative-bullets {
  margin: 1.5mm 0 0 0;
  padding: 0;
  list-style: none;
}

.creative-bullets li {
  font-size: 8.5pt;
  line-height: 1.55;
  margin-bottom: 0.8mm;
  color: #444;
  display: flex;
  align-items: flex-start;
  gap: 1.5mm;
}

.bullet-marker {
  flex-shrink: 0;
  font-size: 7pt;
  line-height: 1.9;
}
</style>
