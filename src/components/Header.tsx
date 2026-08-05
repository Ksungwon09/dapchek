"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 flex items-center justify-between px-6 flex-shrink-0">
      <Link href="/" className="text-xl font-black tracking-tight text-blue-600">
        답쳌<span className="text-gray-400 font-medium ml-1 text-base">Dapchek</span>
      </Link>
      
      {session?.user ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full shadow-sm" />
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{session.user.name}</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <Link 
          href="/login"
          className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
        >
          로그인
        </Link>
      )}
    </header>
  )
}
