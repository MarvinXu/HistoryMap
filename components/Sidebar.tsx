
import React from 'react';
import { RefreshCw, CloudUpload, CheckCircle2, Settings, ChevronLeft, Filter, Plus, AlertCircle, X } from 'lucide-react';
import { HistoricalEvent, UserProfile } from '../types';
import Timeline from './Timeline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedEvents: HistoricalEvent[];
  selectedEvent: HistoricalEvent | null;
  onSelectEvent: (event: HistoricalEvent) => void;
  onAddClick: () => void;
  onConfigClick: () => void;
  onSync: () => void;
  userProfile: UserProfile | null;
  syncing: boolean;
  hasUnsavedChanges: boolean;
  filterQuery: string;
  setFilterQuery: (query: string) => void;
  error: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, savedEvents, selectedEvent, onSelectEvent, 
  onAddClick, onConfigClick, onSync, userProfile, syncing, 
  hasUnsavedChanges, filterQuery, setFilterQuery, error
}) => {

  return (
    <div 
      className={`bg-white/90 backdrop-blur-3xl border-r border-gray-200/60 flex flex-col z-30 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-full relative flex-shrink-0 overflow-hidden ${
        isOpen ? 'w-[25rem] translate-x-0' : 'w-0 -translate-x-4'
      }`}
    >
      <div className="p-7 border-b border-gray-100/80 min-w-[25rem] flex-shrink-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
            <span className="w-4 h-4 bg-indigo-600 rounded-full shadow-sm"></span>
            历迹
          </h1>
          <div className="flex gap-2 items-center">
            {/* Sync Button */}
            {userProfile && (
              <button
                onClick={onSync}
                disabled={syncing || !hasUnsavedChanges}
                className={`relative p-2.5 rounded-2xl transition-all border ${
                  syncing 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                    : hasUnsavedChanges 
                      ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:border-amber-200' 
                      : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                }`}
                title={syncing ? '正在同步...' : hasUnsavedChanges ? '有未保存的更改 (点击同步)' : '已同步'}
              >
                {syncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : hasUnsavedChanges ? (
                  <>
                     <CloudUpload className="w-5 h-5" />
                     <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-amber-50"></span>
                  </>
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </button>
            )}

            <button 
              onClick={onConfigClick}
              className="group relative flex items-center justify-center transition-all active:scale-90"
            >
              {userProfile ? (
                <div className="relative">
                  <img src={userProfile.avatar_url} className="w-10 h-10 rounded-2xl border-2 border-white shadow-md group-hover:ring-4 ring-indigo-500/10 transition-all object-cover" alt="profile" />
                  {hasUnsavedChanges && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>}
                </div>
              ) : (
                <div className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95 border border-transparent hover:border-gray-200"
              title="折叠面板"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
           <div className="relative group flex-grow">
            <input
              type="text"
              className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl py-3 pl-10 pr-10 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-gray-900 placeholder-gray-400 font-bold text-sm"
              placeholder="筛选我的足迹..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Filter className="w-4 h-4 text-gray-300 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                title="清空筛选"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            onClick={onAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 flex items-center justify-center transition-all shadow-lg shadow-indigo-200 active:scale-95"
            title="添加新事件"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 hide-scrollbar min-w-[25rem] relative">
        {error && (
          <div className="bg-red-50 text-red-600 p-5 rounded-3xl flex items-start gap-3 text-sm border border-red-100 animate-in fade-in slide-in-from-top-4 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-bold leading-relaxed">{error}</div>
          </div>
        )}

        <Timeline 
          events={savedEvents} 
          selectedEvent={selectedEvent} 
          onSelectEvent={onSelectEvent} 
          filterQuery={filterQuery} 
          savedEvents={savedEvents} 
        />
      </div>
    </div>
  );
};

export default Sidebar;
