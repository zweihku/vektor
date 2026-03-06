<script setup lang="ts">
import { computed } from 'vue'
import type { Resume, SectionType } from '../../types/resume'
import { sectionLabelsShort, proficiencyLabels, currentLabel } from '../../utils/resumeLabels'
import { useResumeStore } from '../../stores/resumeStore'

const props = defineProps<{
  resume: Resume
}>()

const store = useResumeStore()
const lang = computed(() => store.language)
const labels = computed(() => sectionLabelsShort(lang.value))
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
    class="minimal-template"
    :style="{ fontFamily: resume.theme.fontFamily }"
  >
    <!-- Header -->
    <div class="minimal-header">
      <h1 class="minimal-name">{{ resume.personalInfo.fullName }}</h1>
      <div v-if="resume.personalInfo.jobTitle" class="minimal-title">
        {{ resume.personalInfo.jobTitle }}
      </div>
      <div class="minimal-contact">
        <span v-if="resume.personalInfo.email">{{ resume.personalInfo.email }}</span>
        <span v-if="resume.personalInfo.phone">{{ resume.personalInfo.phone }}</span>
        <span v-if="resume.personalInfo.location">{{ resume.personalInfo.location }}</span>
        <span v-if="resume.personalInfo.linkedin">{{ resume.personalInfo.linkedin }}</span>
        <span v-if="resume.personalInfo.website">{{ resume.personalInfo.website }}</span>
      </div>
    </div>

    <!-- Sections -->
    <template v-for="section in orderedSections()" :key="section">
      <template v-if="section !== 'personalInfo'">
        <div class="minimal-section">
          <div class="section-head">
            <span
              class="section-label"
              :style="{ color: resume.theme.primaryColor }"
            >{{ labels[section] || section }}</span>
            <span class="section-line" :style="{ backgroundColor: resume.theme.primaryColor + '30' }"></span>
          </div>

          <!-- Summary -->
          <p v-if="section === 'summary'" class="minimal-summary">
            {{ resume.summary }}
          </p>

          <!-- Work Experience -->
          <template v-if="section === 'workExperience'">
            <div
              v-for="exp in resume.workExperience"
              :key="exp.id"
              class="minimal-entry"
            >
              <div class="entry-top">
                <span class="entry-name">{{ exp.position }}</span>
                <span class="entry-date">{{ dateRange(exp.startDate, exp.endDate, exp.current) }}</span>
              </div>
              <div class="entry-sub">
                {{ exp.company }}<span v-if="exp.location">, {{ exp.location }}</span>
              </div>
              <ul v-if="exp.bullets.some((b) => b)" class="minimal-bullets">
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
              class="minimal-entry"
            >
              <div class="entry-top">
                <span class="entry-name">{{ edu.school }}</span>
                <span class="entry-date">{{ dateRange(edu.startDate, edu.endDate) }}</span>
              </div>
              <div class="entry-sub">
                {{ edu.degree }}<span v-if="edu.field"> - {{ edu.field }}</span>
                <span v-if="edu.gpa"> | GPA: {{ edu.gpa }}</span>
              </div>
              <ul v-if="edu.bullets.some((b) => b)" class="minimal-bullets">
                <li v-for="(bullet, idx) in edu.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </template>

          <!-- Skills as tags -->
          <template v-if="section === 'skills'">
            <div class="minimal-tags">
              <span
                v-for="skill in resume.skills"
                :key="skill.id"
                class="minimal-tag"
                :style="{
                  borderColor: resume.theme.primaryColor + '40',
                  color: resume.theme.primaryColor,
                }"
              >
                {{ skill.name }}
              </span>
            </div>
          </template>

          <!-- Projects -->
          <template v-if="section === 'projects'">
            <div
              v-for="proj in resume.projects"
              :key="proj.id"
              class="minimal-entry"
            >
              <div class="entry-top">
                <span class="entry-name">{{ proj.name }}</span>
                <span class="entry-date">{{ dateRange(proj.startDate, proj.endDate) }}</span>
              </div>
              <div class="entry-sub">
                {{ proj.role }}<span v-if="proj.url"> | {{ proj.url }}</span>
              </div>
              <ul v-if="proj.bullets.some((b) => b)" class="minimal-bullets">
                <li v-for="(bullet, idx) in proj.bullets.filter((b) => b)" :key="idx">
                  {{ bullet }}
                </li>
              </ul>
            </div>
          </template>

          <!-- Certifications -->
          <template v-if="section === 'certifications'">
            <div class="minimal-certs">
              <div
                v-for="cert in resume.certifications"
                :key="cert.id"
                class="minimal-cert"
              >
                <span class="cert-name">{{ cert.name }}</span>
                <span class="cert-meta"> -- {{ cert.issuer }}<span v-if="cert.date">, {{ formatDate(cert.date) }}</span></span>
              </div>
            </div>
          </template>

          <!-- Languages -->
          <template v-if="section === 'languages'">
            <div class="minimal-tags">
              <span
                v-for="lang in resume.languages"
                :key="lang.id"
                class="minimal-tag"
                :style="{
                  borderColor: resume.theme.primaryColor + '40',
                  color: resume.theme.primaryColor,
                }"
              >
                {{ lang.name }} -- {{ proficiencyLabel(lang.proficiency) }}
              </span>
            </div>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.minimal-template {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  color: #2c2c2c;
  font-size: 9pt;
  line-height: 1.6;
  padding: 14mm 16mm;
  box-sizing: border-box;
}

.minimal-header {
  margin-bottom: 6mm;
}

.minimal-name {
  font-size: 24pt;
  font-weight: 300;
  margin: 0;
  letter-spacing: 0.5mm;
  color: #1a1a1a;
}

.minimal-title {
  font-size: 10pt;
  font-weight: 400;
  color: #777;
  margin-top: 1.5mm;
  letter-spacing: 0.3mm;
}

.minimal-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 4mm;
  margin-top: 3mm;
  font-size: 8pt;
  color: #888;
}

.minimal-section {
  margin-bottom: 5mm;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 3mm;
}

.section-label {
  font-size: 8.5pt;
  font-weight: 600;
  letter-spacing: 1mm;
  text-transform: uppercase;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 0.5pt;
}

.minimal-summary {
  font-size: 9pt;
  line-height: 1.7;
  color: #444;
  margin: 0;
}

.minimal-entry {
  margin-bottom: 3.5mm;
}

.minimal-entry:last-child {
  margin-bottom: 0;
}

.entry-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.entry-name {
  font-size: 9.5pt;
  font-weight: 600;
  color: #1a1a1a;
}

.entry-date {
  font-size: 8pt;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 3mm;
}

.entry-sub {
  font-size: 8.5pt;
  color: #666;
  margin-top: 0.5mm;
}

.minimal-bullets {
  margin: 1.5mm 0 0 0;
  padding-left: 4mm;
  list-style: none;
}

.minimal-bullets li {
  font-size: 8.5pt;
  line-height: 1.6;
  margin-bottom: 0.5mm;
  color: #444;
  position: relative;
  padding-left: 2.5mm;
}

.minimal-bullets li::before {
  content: '--';
  position: absolute;
  left: -3mm;
  color: #bbb;
  font-size: 7pt;
}

.minimal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2mm;
}

.minimal-tag {
  font-size: 8pt;
  padding: 0.8mm 3mm;
  border: 0.5pt solid;
  border-radius: 0.5mm;
  white-space: nowrap;
}

.minimal-certs {
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
}

.minimal-cert {
  font-size: 8.5pt;
}

.cert-name {
  font-weight: 600;
}

.cert-meta {
  color: #888;
  font-size: 8pt;
}
</style>
