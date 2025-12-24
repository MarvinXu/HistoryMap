"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Menu, Plus, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import EventDetailPanel from '../components/EventDetailPanel';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import GithubConfigModal from '../components/modals/GithubConfigModal';
import AddEventModal from '../components/modals/AddEventModal';
import { getGistData, saveGistData, getUserProfile, findOrCreateGist } from '../services/githubService';
import { HistoricalEvent, GitHubConfig, UserProfile } from '../types';
import { getYearFromDate, compareDateStrings } from '../utils';

// Dynamically import HistoryMap with SSR disabled
const HistoryMap = dynamic(() => import('../components/HistoryMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

const App = () => {
  // Data States
  const [savedEvents, setSavedEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // UI States
  const [filterQuery, setFilterQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // GitHub Config
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({ token: '', gistId: '' });

  useEffect(() => {
    setIsMounted(true);
    // Access localStorage only on client side
    const saved = localStorage.getItem('gh_config');
    if (saved) {
      setGhConfig(JSON.parse(saved));
    }
  }, []);

  // --- Effects ---

  // Load initial data
  useEffect(() => {
    if (ghConfig.token) {
      handleLogin(ghConfig.token);
    }
  }, [ghConfig.token]);

  // Save config to local storage
  useEffect(() => {
    if (ghConfig.token || ghConfig.gistId) {
      localStorage.setItem('gh_config', JSON.stringify(ghConfig));
    }
  }, [ghConfig]);

  // Auto-sync
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasUnsavedChanges && !syncing && ghConfig.token && ghConfig.gistId) {
      timer = setTimeout(() => handleSync(), 30000);
    }
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, savedEvents, syncing, ghConfig]);

  // --- Logic Handlers ---

  const handleLogin = async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token) return;
    if (/[^\x00-\x7F]/.test(token)) {
      setError("Token 包含非法字符，请使用有效的 GitHub Personal Access Token");
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const profile = await getUserProfile(token);
      setUserProfile(profile);
      const gistId = await findOrCreateGist(token);
      const config = { token, gistId };
      setGhConfig(config);
      const data = await getGistData(config);
      
      // 按日期排序从GitHub加载的事件
      const sortedData = data.map(e => ({ ...e, id: e.id || crypto.randomUUID(), isSaved: true }))
        .sort((a, b) => compareDateStrings(a.dateStr, b.dateStr));
      
      setSavedEvents(sortedData);
      setHasUnsavedChanges(false);
      setShowConfig(false);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查 Token');
      if (!ghConfig.token) setGhConfig({ token: '', gistId: '' });
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    setGhConfig({ token: '', gistId: '' });
    setSavedEvents([]);
    setHasUnsavedChanges(false);
    localStorage.removeItem('gh_config');
  };

  const handleSync = async () => {
    if (!ghConfig.token || !ghConfig.gistId) return;
    if (!hasUnsavedChanges && savedEvents.length > 0) return;
    setSyncing(true);
    try {
      await saveGistData(ghConfig, savedEvents);
      setHasUnsavedChanges(false);
      const now = new Date();
      console.log(`Synced at ${now.toLocaleTimeString()}`);
    } catch (err: any) {
      setError("同步失败: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddEvents = (newEvents: HistoricalEvent[]) => {
    const eventsWithIds = newEvents.map(e => ({ 
        ...e, 
        id: e.id || crypto.randomUUID(), 
        isSaved: true 
    }));
    
    // 合并并按日期排序事件
    const sortedEvents = [...savedEvents, ...eventsWithIds].sort((a, b) => 
      compareDateStrings(a.dateStr, b.dateStr)
    );
    
    setSavedEvents(sortedEvents);
    setHasUnsavedChanges(true);
    setIsAddModalOpen(false);
    // Select the first new event
    if (eventsWithIds.length > 0) {
        setSelectedEvent(eventsWithIds[0]);
    }
  };

  const requestDeleteEvent = (id: string) => {
      setDeleteConfirmationId(id);
  };

  const confirmDeleteEvent = () => {
      if (!deleteConfirmationId) return;
      const id = deleteConfirmationId;
      
      setSavedEvents(prev => prev.filter(e => e.id !== id));
      setHasUnsavedChanges(true);
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
      setDeleteConfirmationId(null);
  };

  const handleUpdateEvent = (updatedEvent: HistoricalEvent) => {
    // 先移除旧事件，再添加更新后的事件，最后重新排序
    const updatedEvents = savedEvents.filter(e => e.id !== updatedEvent.id);
    const newEvents = [...updatedEvents, { ...updatedEvent, isSaved: true }];
    
    // 按日期排序
    const sortedEvents = newEvents.sort((a, b) => compareDateStrings(a.dateStr, b.dateStr));
    
    setSavedEvents(sortedEvents);
    setHasUnsavedChanges(true);
    setSelectedEvent(updatedEvent);
  };

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen relative bg-[#f1f5f9] overflow-hidden font-sans">
        {/* Modals */}
        <DeleteConfirmModal 
            isOpen={!!deleteConfirmationId} 
            onClose={() => setDeleteConfirmationId(null)} 
            onConfirm={confirmDeleteEvent} 
        />
        
        <GithubConfigModal 
            isOpen={showConfig}
            onClose={() => setShowConfig(false)}
            userProfile={userProfile}
            config={ghConfig}
            error={error}
            syncing={syncing}
            onLogin={handleLogin}
            onLogout={handleLogout}
        />

        <AddEventModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddEvents={handleAddEvents}
        />

        {/* Sidebar */}
        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            savedEvents={savedEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            onAddClick={() => setIsAddModalOpen(true)}
            onConfigClick={() => setShowConfig(true)}
            onSync={handleSync}
            userProfile={userProfile}
            syncing={syncing}
            hasUnsavedChanges={hasUnsavedChanges}
            filterQuery={filterQuery}
            setFilterQuery={setFilterQuery}
            error={error}
        />

      {/* Floating Buttons (When Sidebar Hidden) */}
      {!isSidebarOpen && (
        <div className="absolute top-8 left-8 z-40 flex flex-col gap-4 animate-in fade-in slide-in-from-left-6 duration-300">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-14 h-14 bg-white/95 backdrop-blur-2xl border border-white/40 rounded-[1.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-indigo-600 hover:scale-105 transition-all active:scale-95"
            title="展开面板"
          >
            <Menu className="w-7 h-7" />
          </button>
          <button 
             onClick={() => setIsAddModalOpen(true)}
             className="w-14 h-14 bg-indigo-600 text-white rounded-[1.2rem] shadow-xl shadow-indigo-200 flex items-center justify-center hover:scale-105 transition-all active:scale-95"
             title="添加新事件"
          >
             <Plus className="w-7 h-7" />
          </button>
          <button 
            onClick={() => setShowConfig(true)}
            className="w-14 h-14 bg-white/95 backdrop-blur-2xl border border-white/40 rounded-[1.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center overflow-hidden hover:scale-105 transition-all active:scale-95"
            title={userProfile ? "账号设置" : "登录"}
          >
            {userProfile ? (
              <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="p" />
            ) : (
              <Settings className="w-6 h-6 text-gray-400" />
            )}
          </button>
        </div>
      )}

      {/* Main Map Area */}
      <div className={`grow relative overflow-hidden h-full flex transition-all duration-300`}>
        <div className="grow relative">
            <HistoryMap 
                savedEvents={savedEvents}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
            />

            {/* Event Detail Panel */}
            {selectedEvent && (
                <EventDetailPanel
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onUpdate={handleUpdateEvent}
                    onDelete={requestDeleteEvent} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;