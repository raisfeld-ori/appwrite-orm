"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Database, Zap, Shield, Code2, GitBranch, CheckCircle2, ArrowRight, Github, BookOpen, Star, ALargeSmallIcon, CircleSmall, MoveDownIcon, ToolCase, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CursorEffect } from "./components/cursor-effect";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const features = [
    {
      icon: Database,
      title: "Type-Safe ORM",
      description: "Full TypeScript support with automatic type inference for your Appwrite collections",
    },
    {
      icon: Zap,
      title: "Auto Migrations",
      description: "Automatic schema synchronization and index creation without manual intervention",
    },
    {
      icon: Shield,
      title: "Caching",
      description: "Built in caching system for web and servers",
    },
    {
      icon: MoveDownIcon,
      title: "Custom MCP server",
      description: "A custom MCP server, so your AI model doesn't make stuff up about Appwrite-ORM",
    },
    {
      icon: GitBranch,
      title: "Development Mode",
      description: "Use the ORM in web clients with cookie-based storage for easy local development",
    },
    {
      icon: CheckCircle2,
      title: "Export database",
      description: "Built in functions to export your database to SQL, firebase rules, etc",
    },
  ];

  const futurePlans = [
    "No more future plans! Project is complete."
  ];

  const codeExample = `import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 }
  },
  indexes: [
    { key: 'email_idx', type: 'unique', 
      attributes: ['email'] }
  ]
}]);

const user = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});`;

  return (
    <div className="relative min-h-screen overflow-hidden md:cursor-none">
      <CursorEffect />
      {/* Hexagonal Background */}
      <div className="absolute inset-0 bg-white dark:bg-gray-950">
        <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.15]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path 
                  d="M25 0 L50 14.4 L50 38.4 L25 51.8 L0 38.4 L0 14.4 Z" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                  className="text-[--color-primary-400]/40 dark:text-[--color-primary-400]/30"
                />
                <path 
                  d="M25 0 L50 14.4 L50 38.4 L25 51.8 L0 38.4 L0 14.4 Z" 
                  transform="translate(50, 25.9)" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                  className="text-[--color-primary-500]/40 dark:text-[--color-primary-500]/30"
                />
              </pattern>
              
              <linearGradient id="hex-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fd366e" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#f02e65" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#e01e5a" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#hexagons)" />
            <rect width="100%" height="100%" fill="url(#hex-gradient)" />
          </svg>
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(253,54,110,0.15),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(253,54,110,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(240,46,101,0.15),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,rgba(240,46,101,0.1),transparent_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-6 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo-icon.png" 
                alt="Appwrite ORM Logo" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[--color-primary-500] to-[--color-primary-600] bg-clip-text text-transparent">
                Appwrite ORM
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <a 
                href="https://appwrite-orm.readthedocs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </a>
              <a 
                href="https://github.com/raisfeld-ori/appwrite-orm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a 
                href="/tools"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                <ToolCase className="h-4 w-4" />
                Tools
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-4 pb-2">
                  <a 
                    href="https://appwrite-orm.readthedocs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    Docs
                  </a>
                  <a 
                    href="https://github.com/raisfeld-ori/appwrite-orm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <a 
                    href="/tools"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ToolCase className="h-4 w-4" />
                    Tools
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-4 lg:py-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full bg-[--color-primary-100]/50 dark:bg-[--color-primary-600]/20 backdrop-blur-sm border border-[--color-primary-200]/50 dark:border-[--color-primary-600]/50"
              >
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type-safe Appwrite ORM
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-3 leading-tight">
                <span className="text-gray-900 dark:text-white">
                  Build with
                </span>
                <br />
                <span className="bg-gradient-to-r from-red-500 via-pink-600 to-pink-700 bg-clip-text text-transparent">
                  Type Safety
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                A powerful TypeScript ORM for Appwrite with automatic migrations, schema validation, 
                and join support. Works seamlessly in both server and client environments.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://appwrite-orm.readthedocs.io/en/latest/getting-started/quickstart/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                    "bg-gradient-to-r from-[--color-primary-500] to-[--color-primary-600] text-white",
                    "hover:shadow-lg hover:shadow-[--color-primary-500]/50 dark:hover:shadow-[--color-primary-500]/30",
                    "transition-all duration-300"
                  )}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="/demo"
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                    "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
                    "border border-gray-300 dark:border-gray-700",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-white dark:hover:bg-gray-900",
                    "transition-all duration-300"
                  )}
                >
                  <Code2 className="h-4 w-4" />
                  View Demo
                </a>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
                <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  npm install appwrite-orm node-appwrite
                </code>
              </div>
            </motion.div>

            {/* Code Preview */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={cn(
                "relative p-6 rounded-2xl",
                "bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl",
                "border border-white/50 dark:border-gray-800/50",
                "shadow-2xl shadow-[--color-primary-500]/10 dark:shadow-[--color-primary-500]/5"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[--color-primary-500]/5 to-[--color-primary-600]/5 rounded-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    orm-setup.ts
                  </span>
                </div>
                <pre className="text-xs leading-relaxed overflow-x-auto">
                  <code className="text-gray-800 dark:text-gray-200 font-mono">
                    {codeExample}
                  </code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Powerful features for modern application development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={cn(
                  "group p-6 rounded-xl",
                  "bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl",
                  "border border-white/50 dark:border-gray-800/50",
                  "hover:shadow-xl hover:shadow-[--color-primary-500]/10 dark:hover:shadow-[--color-primary-500]/5",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    "bg-gradient-to-br from-[--color-primary-500] to-[--color-primary-600]",
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Future Plans Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 py-12"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Future Plans
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Exciting features coming soon
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className={cn(
              "p-8 rounded-xl",
              "bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl",
              "border border-white/50 dark:border-gray-800/50"
            )}>
              <ul className="space-y-4">
                {futurePlans.map((plan, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-6 w-6 text-[--color-primary-500] dark:text-[--color-primary-400] flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700 dark:text-gray-300">{plan}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 py-12 mb-12"
        >
          <div className={cn(
            "relative p-12 rounded-2xl text-center overflow-hidden",
            "bg-gradient-to-r from-[--color-primary-500] to-[--color-primary-600]"
          )}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to build something amazing?
              </h2>
              <p className="text-lg text-pink-100 mb-6 max-w-2xl mx-auto">
                Get started with Appwrite ORM today and experience the power of type-safe database operations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://appwrite-orm.readthedocs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-lg font-medium",
                    "bg-red-500 text-[--color-primary-500]",
                    "hover:bg-[--color-primary-100] transition-all duration-300",
                    "shadow-lg hover:shadow-xl"
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                  Read the Docs
                </a>
                <a
                  href="https://github.com/raisfeld-ori/appwrite-orm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-lg font-medium",
                    "bg-white/10 text-white backdrop-blur-sm",
                    "border border-white/20",
                    "hover:bg-white/20 transition-all duration-300"
                  )}
                >
                  <Github className="h-5 w-5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[--color-primary-500] dark:text-[--color-primary-400]" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Appwrite ORM © {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://www.npmjs.com/package/appwrite-orm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                npm
              </a>
              <a 
                href="https://github.com/raisfeld-ori/appwrite-orm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://appwrite-orm.readthedocs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[--color-primary-500] dark:hover:text-[--color-primary-400] transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
