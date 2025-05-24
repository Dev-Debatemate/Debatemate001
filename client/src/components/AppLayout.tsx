import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, PieChart, User, LogOut, Trophy, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserAvatar from "@/components/UserAvatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/providers/ThemeProvider";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { theme } = useTheme();
  
  const isActive = (path: string) => location === path;
  
  return (
    <div className="min-h-screen flex flex-col font-body bg-background text-foreground">
      {/* Header */}
      <header className="bg-card text-card-foreground shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer">
                <span className="text-primary">Debate</span>
                <span className="text-foreground">Mate</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="relative">
                <button className="flex items-center space-x-2">
                  <UserAvatar user={user} className="w-8 h-8" />
                  <span className="hidden md:block text-sm mr-2">{user?.username}</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Lvl {user?.level}
                  </span>
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs - Only show if authenticated */}
      {isAuthenticated && (
        <div className="bg-card text-card-foreground border-b border-border">
          <div className="container mx-auto px-4">
            <ul className="flex overflow-x-auto py-2">
              <li>
                <Link href="/dashboard">
                  <a className={`px-4 py-2 inline-block font-medium transition border-b-2 ${
                    isActive('/dashboard') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:text-primary'
                  }`}>
                    Dashboard
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/debates">
                  <a className={`px-4 py-2 inline-block font-medium transition border-b-2 ${
                    isActive('/debates') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:text-primary'
                  }`}>
                    Debates
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/leaderboard">
                  <a className={`px-4 py-2 inline-block font-medium transition border-b-2 ${
                    isActive('/leaderboard') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:text-primary'
                  }`}>
                    Leaderboard
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/profile">
                  <a className={`px-4 py-2 inline-block font-medium transition border-b-2 ${
                    isActive('/profile') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:text-primary'
                  }`}>
                    Profile
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Mobile Navigation - Only show if authenticated */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card text-muted-foreground z-10 border-t border-border shadow-md">
          <div className="flex justify-around py-2">
            <Link href="/dashboard">
              <a className={`p-2 flex flex-col items-center ${isActive('/dashboard') ? 'text-primary' : ''}`}>
                <PieChart className="h-5 w-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </a>
            </Link>
            <Link href="/debates">
              <a className={`p-2 flex flex-col items-center ${isActive('/debates') ? 'text-primary' : ''}`}>
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs mt-1">Debates</span>
              </a>
            </Link>
            <Link href="/leaderboard">
              <a className={`p-2 flex flex-col items-center ${isActive('/leaderboard') ? 'text-primary' : ''}`}>
                <Trophy className="h-5 w-5" />
                <span className="text-xs mt-1">Leaders</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`p-2 flex flex-col items-center ${isActive('/profile') ? 'text-primary' : ''}`}>
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </a>
            </Link>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-grow">
        {title && (
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
        )}
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-4 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© {new Date().getFullYear()} DebateMate. All rights reserved.</p>
            </div>
            <div className="flex space-x-4 text-sm">
              <Link href="/about"><a className="hover:text-primary">About</a></Link>
              <Link href="/terms"><a className="hover:text-primary">Terms</a></Link>
              <Link href="/privacy"><a className="hover:text-primary">Privacy</a></Link>
              <Link href="/contact"><a className="hover:text-primary">Contact</a></Link>
              
              {isAuthenticated && (
                <button 
                  onClick={logout}
                  className="text-muted-foreground hover:text-primary transition flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add padding at the bottom for mobile navigation */}
      {isAuthenticated && <div className="h-16 md:h-0 w-full"></div>}
    </div>
  );
}
