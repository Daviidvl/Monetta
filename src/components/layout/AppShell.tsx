import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FloatingNav } from './FloatingNav'
import { Sidebar } from './Sidebar'
import { MobileTopBar } from './MobileTopBar'
import { MobileMenu } from './MobileMenu'
import { QuickAddMenu } from './QuickAddMenu'
import { BackupModal } from '../../features/settings/BackupModal'

export function AppShell() {
  const [backupOpen, setBackupOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-surface-50">
      <Sidebar onBackup={() => setBackupOpen(true)} onQuickAdd={() => setQuickAddOpen(true)} />

      <main className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
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
      <QuickAddMenu open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onBackup={() => setBackupOpen(true)}
      />
    </div>
  )
}
