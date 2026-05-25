import { useCallback, useEffect, useState } from 'react'
import type {
  GeneratedReport,
  ReportGenerateInput,
  ReportsSnapshot,
} from '../lib/reports/contracts'
import {
  exportReport,
  generateReport,
  getReportsSnapshot,
  getSavedReport,
  onSessionState,
} from '../platform/ipc'

export function useReports() {
  const [snapshot, setSnapshot] = useState<ReportsSnapshot | null>(null)
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(null)

  const refreshReports = useCallback(async () => {
    const nextSnapshot = await getReportsSnapshot()
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }, [])

  useEffect(() => {
    let active = true

    void getReportsSnapshot().then((result) => {
      if (active && result) {
        setSnapshot(result)
      }
    })

    const unsubscribe = onSessionState(() => {
      void refreshReports()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [refreshReports])

  return {
    snapshot,
    currentReport,
    refreshReports,
    generateReport: async (input: ReportGenerateInput) => {
      const report = await generateReport(input)
      if (report) {
        setCurrentReport(report)
        await refreshReports()
      }
      return report
    },
    openSavedReport: async (reportId: string) => {
      const report = await getSavedReport(reportId)
      if (report) {
        setCurrentReport(report)
      }
      return report
    },
    exportReport: async (reportId: string, format: 'html' | 'pdf') =>
      exportReport(reportId, format),
  }
}
