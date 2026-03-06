<script setup lang="ts">
import { computed } from 'vue'
import type { Resume, SectionType } from '../../types/resume'
import { sectionLabels as getSectionLabels, proficiencyLabels, currentLabel } from '../../utils/resumeLabels'
import { useResumeStore } from '../../stores/resumeStore'

const props = defineProps<{
  resume: Resume
}>()

const store = useResumeStore()
const lang = computed(() => store.language)
const labels = computed(() => getSectionLabels(lang.value))
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

function orderedSections(): SectionType[] {
  return props.resume.sections
    .filter((s) => s.visible && hasContent(s.type))
    .map((s) => s.type)
}
</script>

<template>
  <div
    class="classic-template"
    :style="{ fontFamily: resume.theme.fontFamily }"
  >
    <!-- Header: Name & Contact -->
    <div class="classic-header">
      <h1 class="classic-name">{{ resume.personalInfo.fullName }}</h1>
      <div v-if="resume.personalInfo.jobTitle" class="classic-job-title">
        {{ resume.personalInfo.jobTitle }}
      </div>
      <div class="classic-contact">
        <span v-if="resume.personalInfo.email">{{ resume.personalInfo.email }}</span>
        <span v-if="resume.personalInfo.phone" class="contact-sep">{{ resume.personalInfo.phone }}</span>
        <span v-if="resume.personalInfo.location" class="contact-sep">{{ resume.personalInfo.location }}</span>
        <span v-if="resume.personalInfo.linkedin" class="contact-sep">{{ resume.personalInfo.linkedin }}</span>
        <span v-if="resume.personalInfo.website" class="contact-sep">{{ resume.personalInfo.website }}</span>
      </div>
    </div>

    <hr class="classic-divider" />

    <!-- Sections -->
    <template v-for="section in orderedSections()" :key="section">
      <!-- Skip personalInfo as it's in the header -->
      <template v-if="section !== 'personalInfo'">
        <!-- Section Title -->
        <div class="classic-section">
          <h2 class="classic-section-title">
            <span
              :style="{ borderBottomColor: resume.theme.primaryColor }"
              class="section-title-text"
            >{{ labels[section] || section }}</span>
          </h2>

          <!-- Summary -->
          <p v-if="section === 'summary'" class="classic-summary">
            {{ resume.summary }}
          </p>

          <!-- Work Experience -->
          <template v-if="section === 'workExperience'">
            <div
              v-for="exp in resume.workExperience"
              :key="exp.id"
              class="classic-entry"
            >
              <div class="entry-row">
                <div class="entry-main">
                  <span class="entry-title">{{ exp.company }}</span>
                  <span v-if="exp.location" class="entry-location">, {{ exp.location }}</span>
                </div>
                <div class="entry-date">{{ dateRange(exp.startDate, exp.endDate, exp.current) }}</div>
              </div>
              <div class="entry-subtitle">{{ exp.position }}</div>
              <ul v-if="exp.bullets.some((b) => b)" class="classic-bullets">
                <li v-for="(bullet, idx) in exp.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </template>

          <!-- Education -->
          <template v-if="section === 'education'">
            <div
              v-for="edu in resume.education"
              :key="edu.id"
              class="classic-entry"
            >
              <div class="entry-row">
                <div class="entry-main">
                  <span class="entry-title">{{ edu.school }}</span>
                </div>
                <div class="entry-date">{{ dateRange(edu.startDate, edu.endDate) }}</div>
              </div>
              <div class="entry-subtitle">
                {{ edu.degree }}<span v-if="edu.field"> - {{ edu.field }}</span>
                <span v-if="edu.gpa"> | GPA: {{ edu.gpa }}</span>
              </div>
              <ul v-if="edu.bullets.some((b) => b)" class="classic-bullets">
                <li v-for="(bullet, idx) in edu.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </template>

          <!-- Skills -->
          <template v-if="section === 'skills'">
            <div class="classic-skills">
              <span
                v-for="skill in resume.skills"
                :key="skill.id"
                class="classic-skill-item"
              >
                {{ skill.name }}<span class="skill-dots">{{ '●'.repeat(skill.level) }}{{ '○'.repeat(5 - skill.level) }}</span>
              </span>
            </div>
          </template>

          <!-- Projects -->
          <template v-if="section === 'projects'">
            <div
              v-for="proj in resume.projects"
              :key="proj.id"
              class="classic-entry"
            >
              <div class="entry-row">
                <div class="entry-main">
                  <span class="entry-title">{{ proj.name }}</span>
                  <span v-if="proj.role" class="entry-location"> | {{ proj.role }}</span>
                </div>
                <div class="entry-date">{{ dateRange(proj.startDate, proj.endDate) }}</div>
              </div>
              <div v-if="proj.url" class="entry-subtitle">{{ proj.url }}</div>
              <ul v-if="proj.bullets.some((b) => b)" class="classic-bullets">
                <li v-for="(bullet, idx) in proj.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </template>

          <!-- Certifications -->
          <template v-if="section === 'certifications'">
            <div class="classic-certs">
              <div
                v-for="cert in resume.certifications"
                :key="cert.id"
                class="classic-cert-item"
              >
                <span class="entry-title">{{ cert.name }}</span>
                <span class="cert-detail">
                  - {{ cert.issuer }}<span v-if="cert.date">, {{ formatDate(cert.date) }}</span>
                </span>
              </div>
            </div>
          </template>

          <!-- Languages -->
          <template v-if="section === 'languages'">
            <div class="classic-langs">
              <span
                v-for="(lang, idx) in resume.languages"
                :key="lang.id"
              >
                {{ lang.name }} ({{ proficiencyLabel(lang.proficiency) }})<span v-if="idx < resume.languages.length - 1"> &nbsp;|&nbsp; </span>
              </span>
            </div>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.classic-template {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  color: #1a1a1a;
  font-size: 9pt;
  line-height: 1.5;
  padding: 12mm 14mm;
  box-sizing: border-box;
}

.classic-header {
  text-align: center;
  margin-bottom: 2mm;
}

.classic-name {
  font-size: 22pt;
  font-weight: 700;
  margin: 0;
  letter-spacing: 1mm;
}

.classic-job-title {
  font-size: 11pt;
  color: #555;
  margin-top: 1.5mm;
}

.classic-contact {
  font-size: 8.5pt;
  color: #555;
  margin-top: 2.5mm;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1mm;
}

.contact-sep::before {
  content: '|';
  margin: 0 2mm;
  color: #ccc;
}

.classic-divider {
  border: none;
  border-top: 1pt solid #333;
  margin: 4mm 0;
}

.classic-section {
  margin-bottom: 4mm;
}

.classic-section-title {
  font-size: 10.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8mm;
  margin: 0 0 2.5mm;
  color: #1a1a1a;
}

.section-title-text {
  border-bottom: 1.5pt solid;
  padding-bottom: 1mm;
}

.classic-summary {
  font-size: 9pt;
  line-height: 1.65;
  color: #333;
  margin: 0;
}

.classic-entry {
  margin-bottom: 3.5mm;
}

.classic-entry:last-child {
  margin-bottom: 0;
}

.entry-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.entry-main {
  font-size: 9.5pt;
}

.entry-title {
  font-weight: 700;
}

.entry-location {
  color: #555;
  font-size: 8.5pt;
}

.entry-date {
  font-size: 8.5pt;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 3mm;
}

.entry-subtitle {
  font-size: 8.5pt;
  color: #555;
  margin-top: 0.5mm;
  font-style: italic;
}

.classic-bullets {
  margin: 1mm 0 0 0;
  padding-left: 5mm;
  list-style: disc;
}

.classic-bullets li {
  font-size: 8.5pt;
  line-height: 1.55;
  margin-bottom: 0.5mm;
  color: #333;
}

.classic-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 2mm 6mm;
}

.classic-skill-item {
  font-size: 8.5pt;
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
}

.skill-dots {
  font-size: 6pt;
  letter-spacing: 0.3mm;
  color: #888;
}

.classic-certs {
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
}

.classic-cert-item {
  font-size: 8.5pt;
}

.cert-detail {
  color: #555;
}

.classic-langs {
  font-size: 8.5pt;
  line-height: 1.7;
}
</style>
