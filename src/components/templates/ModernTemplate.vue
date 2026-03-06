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
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const idx = parseInt(month, 10) - 1
  return `${year}.${months[idx] || month}`
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

// Determine which sections go in left column vs right column
const leftSections: SectionType[] = ['personalInfo', 'skills', 'languages', 'certifications']
const rightSections: SectionType[] = ['summary', 'workExperience', 'education', 'projects']

function orderedLeft(): SectionType[] {
  return props.resume.sections
    .filter((s) => leftSections.includes(s.type) && s.visible)
    .map((s) => s.type)
    .filter((t) => hasContent(t))
}

function orderedRight(): SectionType[] {
  return props.resume.sections
    .filter((s) => rightSections.includes(s.type) && s.visible)
    .map((s) => s.type)
    .filter((t) => hasContent(t))
}
</script>

<template>
  <div
    class="modern-template"
    :style="{
      fontFamily: resume.theme.fontFamily,
      '--primary': resume.theme.primaryColor,
    }"
  >
    <!-- Header -->
    <div class="modern-header" :style="{ backgroundColor: resume.theme.primaryColor }">
      <div class="header-name">{{ resume.personalInfo.fullName }}</div>
      <div v-if="resume.personalInfo.jobTitle" class="header-title">
        {{ resume.personalInfo.jobTitle }}
      </div>
    </div>

    <!-- Body: two columns -->
    <div class="modern-body">
      <!-- Left column -->
      <div class="modern-left" :style="{ borderRightColor: resume.theme.primaryColor + '20' }">
        <template v-for="section in orderedLeft()" :key="section">
          <!-- Personal Info -->
          <div v-if="section === 'personalInfo'" class="left-section">
            <div
              class="left-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['personalInfo'] }}
            </div>
            <div class="contact-list">
              <div v-if="resume.personalInfo.email" class="contact-item">
                <span class="contact-icon">&#9993;</span>
                <span>{{ resume.personalInfo.email }}</span>
              </div>
              <div v-if="resume.personalInfo.phone" class="contact-item">
                <span class="contact-icon">&#9742;</span>
                <span>{{ resume.personalInfo.phone }}</span>
              </div>
              <div v-if="resume.personalInfo.location" class="contact-item">
                <span class="contact-icon">&#9906;</span>
                <span>{{ resume.personalInfo.location }}</span>
              </div>
              <div v-if="resume.personalInfo.linkedin" class="contact-item">
                <span class="contact-icon">&#9741;</span>
                <span>{{ resume.personalInfo.linkedin }}</span>
              </div>
              <div v-if="resume.personalInfo.website" class="contact-item">
                <span class="contact-icon">&#9729;</span>
                <span>{{ resume.personalInfo.website }}</span>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="section === 'skills'" class="left-section">
            <div
              class="left-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['skills'] }}
            </div>
            <div class="skills-list">
              <div v-for="skill in resume.skills" :key="skill.id" class="skill-item">
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-bar-bg">
                  <div
                    class="skill-bar-fill"
                    :style="{
                      width: (skill.level / 5) * 100 + '%',
                      backgroundColor: resume.theme.primaryColor,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Languages -->
          <div v-if="section === 'languages'" class="left-section">
            <div
              class="left-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['languages'] }}
            </div>
            <div class="lang-list">
              <div v-for="lang in resume.languages" :key="lang.id" class="lang-item">
                <span class="lang-name">{{ lang.name }}</span>
                <span class="lang-level">{{ proficiencyLabel(lang.proficiency) }}</span>
              </div>
            </div>
          </div>

          <!-- Certifications -->
          <div v-if="section === 'certifications'" class="left-section">
            <div
              class="left-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['certifications'] }}
            </div>
            <div class="cert-list">
              <div v-for="cert in resume.certifications" :key="cert.id" class="cert-item">
                <div class="cert-name">{{ cert.name }}</div>
                <div class="cert-meta">
                  {{ cert.issuer }}<span v-if="cert.date"> | {{ formatDate(cert.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Right column -->
      <div class="modern-right">
        <template v-for="section in orderedRight()" :key="section">
          <!-- Summary -->
          <div v-if="section === 'summary'" class="right-section">
            <div
              class="right-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['summary'] }}
            </div>
            <p class="summary-text">{{ resume.summary }}</p>
          </div>

          <!-- Work Experience -->
          <div v-if="section === 'workExperience'" class="right-section">
            <div
              class="right-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['workExperience'] }}
            </div>
            <div
              v-for="exp in resume.workExperience"
              :key="exp.id"
              class="experience-item"
            >
              <div class="exp-header">
                <div>
                  <div class="exp-company">{{ exp.position }}</div>
                  <div class="exp-position">
                    {{ exp.company }}<span v-if="exp.location"> | {{ exp.location }}</span>
                  </div>
                </div>
                <div class="exp-date">{{ dateRange(exp.startDate, exp.endDate, exp.current) }}</div>
              </div>
              <ul v-if="exp.bullets.some((b) => b)" class="bullet-list">
                <li v-for="(bullet, idx) in exp.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Education -->
          <div v-if="section === 'education'" class="right-section">
            <div
              class="right-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['education'] }}
            </div>
            <div
              v-for="edu in resume.education"
              :key="edu.id"
              class="experience-item"
            >
              <div class="exp-header">
                <div>
                  <div class="exp-company">{{ edu.school }}</div>
                  <div class="exp-position">
                    {{ edu.degree }}<span v-if="edu.field"> - {{ edu.field }}</span>
                    <span v-if="edu.gpa"> | GPA: {{ edu.gpa }}</span>
                  </div>
                </div>
                <div class="exp-date">{{ dateRange(edu.startDate, edu.endDate) }}</div>
              </div>
              <ul v-if="edu.bullets.some((b) => b)" class="bullet-list">
                <li v-for="(bullet, idx) in edu.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Projects -->
          <div v-if="section === 'projects'" class="right-section">
            <div
              class="right-section-title"
              :style="{ color: resume.theme.primaryColor }"
            >
              {{ labels['projects'] }}
            </div>
            <div
              v-for="proj in resume.projects"
              :key="proj.id"
              class="experience-item"
            >
              <div class="exp-header">
                <div>
                  <div class="exp-company">{{ proj.name }}</div>
                  <div class="exp-position">
                    {{ proj.role }}<span v-if="proj.url"> | {{ proj.url }}</span>
                  </div>
                </div>
                <div class="exp-date">{{ dateRange(proj.startDate, proj.endDate) }}</div>
              </div>
              <ul v-if="proj.bullets.some((b) => b)" class="bullet-list">
                <li v-for="(bullet, idx) in proj.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modern-template {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 9pt;
  line-height: 1.5;
  box-sizing: border-box;
}

.modern-header {
  padding: 10mm 8mm 8mm;
  color: #ffffff;
}

.header-name {
  font-size: 20pt;
  font-weight: 700;
  letter-spacing: 0.5mm;
  margin-bottom: 1.5mm;
}

.header-title {
  font-size: 11pt;
  font-weight: 400;
  opacity: 0.9;
}

.modern-body {
  display: flex;
  min-height: calc(297mm - 32mm);
}

.modern-left {
  width: 35%;
  padding: 6mm 5mm 8mm 8mm;
  background-color: #f8f9fa;
  border-right: 1px solid;
  box-sizing: border-box;
}

.modern-right {
  width: 65%;
  padding: 6mm 8mm 8mm 6mm;
  box-sizing: border-box;
}

.left-section {
  margin-bottom: 5mm;
}

.left-section-title {
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3mm;
  margin-bottom: 3mm;
  padding-bottom: 1.5mm;
  border-bottom: 0.5pt solid #ddd;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 2mm;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 2mm;
  font-size: 8pt;
  word-break: break-all;
}

.contact-icon {
  flex-shrink: 0;
  width: 3.5mm;
  text-align: center;
  font-size: 8pt;
  opacity: 0.7;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 2.5mm;
}

.skill-item {
  display: flex;
  flex-direction: column;
  gap: 0.8mm;
}

.skill-name {
  font-size: 8pt;
  font-weight: 500;
}

.skill-bar-bg {
  height: 1.8mm;
  background-color: #e5e7eb;
  border-radius: 1mm;
  overflow: hidden;
}

.skill-bar-fill {
  height: 100%;
  border-radius: 1mm;
  transition: width 0.3s;
}

.lang-list {
  display: flex;
  flex-direction: column;
  gap: 2mm;
}

.lang-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8pt;
}

.lang-name {
  font-weight: 500;
}

.lang-level {
  font-size: 7.5pt;
  opacity: 0.7;
}

.cert-list {
  display: flex;
  flex-direction: column;
  gap: 2.5mm;
}

.cert-item {
  font-size: 8pt;
}

.cert-name {
  font-weight: 600;
  margin-bottom: 0.5mm;
}

.cert-meta {
  font-size: 7.5pt;
  opacity: 0.7;
}

.right-section {
  margin-bottom: 5mm;
}

.right-section-title {
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 0.3mm;
  margin-bottom: 3mm;
  padding-bottom: 1.5mm;
  border-bottom: 0.5pt solid #ddd;
}

.summary-text {
  font-size: 9pt;
  line-height: 1.65;
  color: #333;
  margin: 0;
}

.experience-item {
  margin-bottom: 4mm;
}

.experience-item:last-child {
  margin-bottom: 0;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5mm;
}

.exp-company {
  font-size: 10pt;
  font-weight: 600;
}

.exp-position {
  font-size: 8.5pt;
  color: #555;
  margin-top: 0.5mm;
}

.exp-date {
  font-size: 8pt;
  color: #777;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 3mm;
}

.bullet-list {
  margin: 1mm 0 0 0;
  padding-left: 4mm;
  list-style: disc;
}

.bullet-list li {
  font-size: 8.5pt;
  line-height: 1.55;
  margin-bottom: 0.8mm;
  color: #333;
}
</style>
