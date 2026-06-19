import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FloatingNav } from './FloatingNav'
import { Sidebar } from './Sidebar'
import { BackupModal } from '../../features/settings/BackupModal'

export function AppShell() {
  const [backupOpen, setBackupOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-surface-50">
      <Sidebar onBackup={() => setBackupOpen(true)} />

      <main className="flex-1 min-w-0 flex flex-col">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
        {/* Mobile bottom spacing */}
        <div className="h-20 lg:hidden" />
      </main>

      <FloatingNav />
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  )
}
