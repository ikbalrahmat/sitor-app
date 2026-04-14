export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto transition-colors duration-300">
      <div className="px-6 py-4">
        {/* Diubah jadi justify-center agar teks copyright berada di tengah karena link di kanan sudah dihapus */}
        <div className="flex justify-center items-center text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 Si-Tor. Sistem Kompetensi Auditor.
          </p>
        </div>
      </div>
    </footer>
  );
}