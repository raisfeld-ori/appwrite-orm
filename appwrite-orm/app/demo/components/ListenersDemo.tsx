"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Play, Square, Trash2, Plus, CheckCircle2, AlertCircle, Volume2 } from "lucide-react";
import { WebORM } from "appwrite-orm/web";
import { cn } from "@/lib/utils";

interface Message {
  $id: string;
  content: string;
  author: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

interface EventLog {
  id: string;
  event: string;
  payload: any;
  timestamp: string;
  type: 'create' | 'update' | 'delete';
}

export function ListenersDemo() {
  const [db, setDb] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newMessage, setNewMessage] = useState({ content: '', author: '', type: 'info' as const });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initOrm = async () => {
      try {
        const orm = new WebORM({
          endpoint: 'http://localhost',
          projectId: 'demo-project',
          databaseId: 'demo-database',
          development: true
        });

        const database = await orm.init([{
          name: 'messages',
          schema: {
            content: { type: 'string', required: true },
            author: { type: 'string', required: true },
            timestamp: { type: 'string', required: true },
            type: { type: ['info', 'success', 'warning'], enum: ['info', 'success', 'warning'], default: 'info' }
          }
        }]);

        setDb(database);

        const existingMessages = await database.table('messages').all() as Message[];
        if (existingMessages.length === 0) {
          await addMockData(database);
        }
        setMessages(existingMessages);
      } catch (error) {
        console.error('Failed to initialize ORM:', error);
        showMessage('error', 'Failed to initialize database');
      }
    };

    initOrm();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const addMockData = async (database: any) => {
    const mockMessages = [
      { content: 'Welcome to the realtime demo!', author: 'System', timestamp: new Date().toISOString(), type: 'info' },
      { content: 'Database initialized successfully', author: 'ORM', timestamp: new Date().toISOString(), type: 'success' },
      { content: 'Ready to listen for changes', author: 'Listener', timestamp: new Date().toISOString(), type: 'warning' }
    ];

    for (const msg of mockMessages) {
      await database.table('messages').create(msg);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const addEventLog = (event: string, payload: any, type: 'create' | 'update' | 'delete') => {
    const newLog: EventLog = {
      id: Date.now().toString(),
      event,
      payload,
      timestamp: new Date().toISOString(),
      type
    };
    setEventLogs(prev => [newLog, ...prev].slice(0, 10)); // Keep only last 10 events
  };

  const startListening = async () => {
    if (!db || isListening) return;
    
    try {
      setIsListening(true);
      showMessage('success', 'Started listening to database changes');
      
      // Listen to all document events in the messages collection
      const unsubscribe = db.table('messages').listenToDocuments((event: any) => {
        console.log('Realtime event received:', event);
        
        if (event.events.some((e: string) => e.includes('.create'))) {
          addEventLog('Document Created', event.payload, 'create');
          refreshMessages();
        } else if (event.events.some((e: string) => e.includes('.update'))) {
          addEventLog('Document Updated', event.payload, 'update');
          refreshMessages();
        } else if (event.events.some((e: string) => e.includes('.delete'))) {
          addEventLog('Document Deleted', event.payload, 'delete');
          refreshMessages();
        }
      });
      
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Failed to start listening:', error);
      showMessage('error', 'Failed to start listening');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsListening(false);
    showMessage('success', 'Stopped listening to database changes');
  };

  const refreshMessages = async () => {
    if (!db) return;
    try {
      const allMessages = await db.table('messages').all() as Message[];
      setMessages(allMessages);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const addMessage = async () => {
    if (!db || !newMessage.content.trim() || !newMessage.author.trim()) return;
    setLoading(true);
    try {
      await db.table('messages').create({
        ...newMessage,
        timestamp: new Date().toISOString()
      });
      setNewMessage({ content: '', author: '', type: 'info' });
      showMessage('success', 'Message added successfully');
    } catch (error) {
      showMessage('error', 'Failed to add message');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!db) return;
    setLoading(true);
    try {
      await db.table('messages').delete(messageId);
      showMessage('success', 'Message deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  const clearEventLogs = () => {
    setEventLogs([]);
    showMessage('success', 'Event logs cleared');
  };

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm flex items-center gap-2",
            message.type === 'success' 
              ? "bg-green-500/95 text-white border border-green-400/50" 
              : "bg-red-500/95 text-white border border-red-400/50"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </motion.div>
      )}

      {/* Realtime Setup Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500" />
          Realtime Listeners Configuration
        </h2>
        <div className="space-y-3 font-mono text-sm">
          <div className="bg-white/20 dark:bg-gray-900/20 p-4 rounded-lg backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
            <p className="text-gray-600 dark:text-gray-400 mb-2">// Listen to all document events in a collection</p>
            <code className="text-black dark:text-white">
              {`const unsubscribe = db.table('messages')
  .listenToDocuments((event) => {
    console.log('Event:', event);
    // Handle create, update, delete events
  });`}
            </code>
          </div>
          <div className="bg-white/20 dark:bg-gray-900/20 p-4 rounded-lg backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
            <p className="text-gray-600 dark:text-gray-400 mb-2">// Listen to specific document changes</p>
            <code className="text-black dark:text-white">
              {`const unsubscribe = db.table('messages')
  .listenToDocument('doc-id', (event) => {
    console.log('Document changed:', event.payload);
  });`}
            </code>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Listener Controls */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-red-500" />
            Listener Controls
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className="text-sm font-medium">
                Status: {isListening ? 'Listening' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={startListening}
                disabled={isListening || !db}
                className="flex-1 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Listening
              </button>
              <button
                onClick={stopListening}
                disabled={!isListening}
                className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Listening
              </button>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              // db.table('messages').listenToDocuments(callback)
            </p>
          </div>
        </motion.div>

        {/* Add New Message */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-500" />
            Add New Message
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Author *</label>
              <input
                type="text"
                value={newMessage.author}
                onChange={(e) => setNewMessage({ ...newMessage, author: e.target.value })}
                placeholder="Enter author name"
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                placeholder="Enter message content"
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newMessage.type}
                onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            <button
              onClick={addMessage}
              disabled={loading || !newMessage.content.trim() || !newMessage.author.trim()}
              className="w-full px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add Message
              </span>
            </button>
            <p className="text-xs text-gray-500 font-mono">
              // This will trigger a realtime event if listening
            </p>
          </div>
        </motion.div>
      </div>

      {/* Event Logs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Realtime Event Logs ({eventLogs.length})
          </h2>
          <button
            onClick={clearEventLogs}
            className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {eventLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No events logged yet. Start listening and perform some operations!
            </p>
          ) : (
            eventLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      log.type === 'create' && "bg-green-500",
                      log.type === 'update' && "bg-yellow-500",
                      log.type === 'delete' && "bg-red-500"
                    )} />
                    <span className="font-medium text-sm">{log.event}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.payload, null, 2)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
      >
        <h2 className="text-xl font-bold mb-4">
          Messages ({messages.length})
        </h2>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages found. Add one above!</p>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.$id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 flex items-start justify-between gap-4 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{msg.author}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      msg.type === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      msg.type === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      msg.type === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}>
                      {msg.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
                </div>
                <button
                  onClick={() => deleteMessage(msg.$id)}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}