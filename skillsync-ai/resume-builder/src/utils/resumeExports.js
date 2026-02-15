import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { downloadResumePDF as downloadPDFFromPdfGenerator } from './pdfGenerator'

const fileName = (resume, ext) => {
  const name = (resume.personal?.name || 'resume').replace(/\s+/g, '-')
  return `${name}-resume.${ext}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Build plain text from resume data */
function resumeToText(resume) {
  const { personal = {}, experience = [], education = [], skills = [], summary = '' } = resume
  const skillsList = Array.isArray(skills) ? skills : (skills ? [skills] : [])
  const lines = []

  lines.push(personal.name || 'Your Name')
  const contact = [personal.email, personal.phone, personal.location].filter(Boolean).join('  |  ')
  if (contact) lines.push(contact)
  lines.push('')

  if (summary) {
    lines.push('SUMMARY')
    lines.push(summary)
    lines.push('')
  }

  if (experience?.length) {
    lines.push('EXPERIENCE')
    for (const exp of experience) {
      lines.push(`${exp.title || ''}${exp.company ? ` | ${exp.company}` : ''}`)
      if (exp.start || exp.end) lines.push(`${exp.start || ''} – ${exp.end || ''}`)
      if (exp.description) lines.push(exp.description)
      lines.push('')
    }
  }

  if (education?.length) {
    lines.push('EDUCATION')
    for (const edu of education) {
      lines.push(`${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}`)
      if (edu.school) lines.push(edu.school)
      if (edu.start || edu.end) lines.push(`${edu.start || ''} – ${edu.end || ''}`)
      lines.push('')
    }
  }

  if (skillsList.length) {
    lines.push('SKILLS')
    lines.push(skillsList.join(', '))
  }

  return lines.join('\n')
}

/** Build HTML string from resume data */
function resumeToHTML(resume) {
  const { personal = {}, experience = [], education = [], skills = [], summary = '' } = resume
  const skillsList = Array.isArray(skills) ? skills : (skills ? [skills] : [])

  let html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${(personal.name || 'Resume').replace(/</g, '&lt;')}</title>
<style>
body{font-family:Georgia,serif;max-width:700px;margin:2rem auto;padding:0 1rem;color:#222;line-height:1.5;}
h1{font-size:1.75rem;margin-bottom:0.25rem;}
.contact{color:#555;font-size:0.9rem;margin-bottom:1.5rem;}
h2{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#666;margin-top:1.5rem;margin-bottom:0.5rem;border-bottom:1px solid #ddd;}
p,ul{margin:0.25rem 0;}
.job{margin-bottom:1rem;}
.job-title{font-weight:600;}
.job-meta{color:#555;font-size:0.9rem;}
</style>
</head>
<body>
<h1>${(personal.name || 'Your Name').replace(/</g, '&lt;')}</h1>
<div class="contact">${[personal.email, personal.phone, personal.location].filter(Boolean).map(s => String(s).replace(/</g, '&lt;')).join(' &bull; ')}</div>
`
  if (summary) {
    html += `<h2>Summary</h2><p>${String(summary).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>\n`
  }
  if (experience?.length) {
    html += '<h2>Experience</h2>\n'
    for (const exp of experience) {
      const title = (exp.title || '').replace(/</g, '&lt;')
      const company = (exp.company || '').replace(/</g, '&lt;')
      const meta = [exp.start, exp.end].filter(Boolean).join(' – ')
      const desc = (exp.description || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')
      html += `<div class="job"><div class="job-title">${title}${company ? ` &middot; ${company}` : ''}</div>`
      if (meta) html += `<div class="job-meta">${meta}</div>`
      if (desc) html += `<p>${desc}</p>`
      html += '</div>\n'
    }
  }
  if (education?.length) {
    html += '<h2>Education</h2>\n'
    for (const edu of education) {
      const degree = (edu.degree || '').replace(/</g, '&lt;')
      const field = (edu.field || '').replace(/</g, '&lt;')
      const school = (edu.school || '').replace(/</g, '&lt;')
      const meta = [edu.start, edu.end].filter(Boolean).join(' – ')
      html += `<div class="job"><div class="job-title">${degree}${field ? ` in ${field}` : ''}</div><div class="job-meta">${school}${meta ? ` &middot; ${meta}` : ''}</div></div>\n`
    }
  }
  if (skillsList.length) {
    html += '<h2>Skills</h2><p>' + skillsList.map(s => String(s).replace(/</g, '&lt;')).join(', ') + '</p>\n'
  }
  html += '</body>\n</html>'
  return html
}

export function downloadResumePDF(resume) {
  downloadPDFFromPdfGenerator(resume)
}

export function downloadResumeTXT(resume) {
  const text = resumeToText(resume)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, fileName(resume, 'txt'))
}

export function downloadResumeHTML(resume) {
  const html = resumeToHTML(resume)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  downloadBlob(blob, fileName(resume, 'html'))
}

/** Build and download DOCX (Word) */
export async function downloadResumeDOCX(resume) {
  const { personal = {}, experience = [], education = [], skills = [], summary = '' } = resume
  const skillsList = Array.isArray(skills) ? skills : (skills ? [skills] : [])

  const children = []

  children.push(new Paragraph({ text: personal.name || 'Your Name', heading: HeadingLevel.TITLE }))
  const contact = [personal.email, personal.phone, personal.location].filter(Boolean).join('  •  ')
  if (contact) children.push(new Paragraph(contact))

  if (summary) {
    children.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2 }))
    children.push(new Paragraph(summary))
  }

  if (experience?.length) {
    children.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2 }))
    for (const exp of experience) {
      const titleLine = [exp.title, exp.company].filter(Boolean).join(' | ') || 'Experience'
      children.push(new Paragraph({ children: [new TextRun({ text: titleLine, bold: true })] }))
      if (exp.start || exp.end) children.push(new Paragraph(`${exp.start || ''} – ${exp.end || ''}`))
      if (exp.description) children.push(new Paragraph(exp.description))
    }
  }

  if (education?.length) {
    children.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }))
    for (const edu of education) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, bold: true })] }))
      if (edu.school) children.push(new Paragraph(edu.school))
      if (edu.start || edu.end) children.push(new Paragraph(`${edu.start || ''} – ${edu.end || ''}`))
    }
  }

  if (skillsList.length) {
    children.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }))
    children.push(new Paragraph(skillsList.join(', ')))
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, fileName(resume, 'docx'))
}
