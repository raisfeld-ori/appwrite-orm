"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Database, BookOpen, Github, Radio } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CursorEffect } from "../components/cursor-effect";
import { CrudDemo } from "./components/CrudDemo";
import { MigrationsDemo } from "./components/MigrationsDemo";
import { ListenersDemo } from "./components/ListenersDemo";
import { cn } from "@/lib/utils";

type DemoCategory = 'crud' | 'migrations' | 'listeners';

export default function DemoPage() {
  const [activeCategory, setActiveCategory] = useState<DemoCategory>('crud');

  return (
    <div className="relative min-h-screen overflow-hidden cursor-none bg-white dark:bg-gray-950">
      <CursorEffect />

      {/* Wavy Gradient Background */}
      <div className="absolute inset-0 bg-white dark:bg-gray-950 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="0.5"
            d="M0,50 C20,60 40,40 60,50 C80,60 100,40 100,50 L100,100 L0,100 Z"
          />
          <path
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="0.5"
            d="M0,60 C30,70 70,30 100,60 L100,100 L0,100 Z"
          />
          <path
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth="0.5"
            d="M0,70 C20,80 80,20 100,70 L100,100 L0,100 Z"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/0 to-white dark:from-gray-950 dark:via-gray-950/0 dark:to-gray-950" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo-icon.png" 
              alt="Appwrite ORM Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Appwrite ORM Demo
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 transition-all"
            >
              ← Back
            </Link>
            <a 
              href="https://appwrite-orm.readthedocs.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Docs
            </a>
            <a 
              href="https://github.com/raisfeld-ori/appwrite-orm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Category Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 p-2 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30 w-fit mx-auto">
            <button
              onClick={() => setActiveCategory('crud')}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-300",
                activeCategory === 'crud'
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
              )}
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                CRUD Operations
              </span>
            </button>
            <button
              onClick={() => setActiveCategory('migrations')}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-300",
                activeCategory === 'migrations'
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
              )}
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Migrations
              </span>
            </button>
            <button
              onClick={() => setActiveCategory('listeners')}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-300",
                activeCategory === 'listeners'
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
              )}
            >
              <span className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Listeners
              </span>
            </button>
          </div>
        </motion.div>

        {/* Demo Content */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeCategory === 'crud' && <CrudDemo />}
          {activeCategory === 'migrations' && <MigrationsDemo />}
          {activeCategory === 'listeners' && <ListenersDemo />}
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg bg-[--color-primary-100]/50 dark:bg-[--color-primary-600]/20 border border-[--color-primary-200] dark:border-[--color-primary-600]/50"
        >
          <p className="text-sm text-[--color-primary-800] dark:text-[--color-primary-300]">
            <strong>Development Mode:</strong> This demo uses Appwrite ORM's development mode. All data is stored locally in browser cookies. 
            No real Appwrite server is needed, making it perfect for testing and prototyping!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
