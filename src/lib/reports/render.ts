import type {
  ReportDocumentPayload,
  ReportSection,
} from './contracts'

export function renderReportHtml(payload: ReportDocumentPayload): string {
  const summaryHtml = payload.summaryItems
    .map(
      (item) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(item.label)}</div>
          <div class="metric-value">${escapeHtml(item.value)}</div>
          ${item.detail ? `<div class="metric-detail">${escapeHtml(item.detail)}</div>` : ''}
        </div>
      `,
    )
    .join('')

  const sectionHtml = payload.sections.map(renderSection).join('')

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(payload.title)}</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #f2efe9;
            --paper: #fbfaf7;
            --ink: #1a1c1f;
            --muted: #5f666d;
            --line: #c9c2b7;
            --accent: #7b5c2a;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          }
          .page {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px;
          }
          .sheet {
            background: var(--paper);
            border: 1px solid var(--line);
            padding: 32px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid var(--ink);
            padding-bottom: 16px;
          }
          .eyebrow {
            font-size: 11px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: var(--accent);
          }
          h1 {
            margin: 8px 0 6px;
            font-size: 30px;
            line-height: 1.1;
          }
          .subject, .timestamp {
            color: var(--muted);
            font-size: 14px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
            gap: 12px;
            margin: 22px 0 8px;
          }
          .metric-card {
            border: 1px solid var(--line);
            padding: 12px 14px;
            background: #f7f4ee;
          }
          .metric-label {
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .metric-value {
            margin-top: 8px;
            font-size: 18px;
            font-weight: 600;
          }
          .metric-detail {
            margin-top: 6px;
            font-size: 12px;
            color: var(--muted);
          }
          section {
            margin-top: 26px;
          }
          h2 {
            margin: 0 0 12px;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            border: 1px solid var(--line);
            padding: 8px 10px;
            vertical-align: top;
            text-align: left;
          }
          th {
            background: #ece6dc;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li + li {
            margin-top: 8px;
          }
          @media print {
            body {
              background: white;
            }
            .page {
              max-width: none;
              padding: 0;
            }
            .sheet {
              border: none;
              box-shadow: none;
              padding: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <article class="sheet">
            <header class="header">
              <div>
                <div class="eyebrow">FleetOps Report</div>
                <h1>${escapeHtml(payload.title)}</h1>
                <div class="subject">${escapeHtml(payload.subjectLabel)}</div>
              </div>
              <div class="timestamp">Generated ${escapeHtml(formatTimestamp(payload.generatedAt))}</div>
            </header>
            <section class="summary-grid">${summaryHtml}</section>
            ${sectionHtml}
          </article>
        </div>
      </body>
    </html>
  `
}

export function parseStoredReport(record: {
  payloadJson: string
}): ReportDocumentPayload {
  return JSON.parse(record.payloadJson) as ReportDocumentPayload
}

function renderSection(section: ReportSection): string {
  if (section.kind === 'metrics') {
    return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <div class="summary-grid">
          ${section.items
            .map(
              (item) => `
                <div class="metric-card">
                  <div class="metric-label">${escapeHtml(item.label)}</div>
                  <div class="metric-value">${escapeHtml(item.value)}</div>
                  ${item.detail ? `<div class="metric-detail">${escapeHtml(item.detail)}</div>` : ''}
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
    `
  }

  if (section.kind === 'table') {
    return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <table>
          <thead>
            <tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${section.rows
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </section>
    `
  }

  return `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <ul>
        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
