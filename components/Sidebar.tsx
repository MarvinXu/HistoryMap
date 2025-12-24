
import React, { useMemo } from 'react';
import { RefreshCw, CloudUpload, CheckCircle2, Settings, ChevronLeft, Filter, Plus, AlertCircle, X } from 'lucide-react';
import { HistoricalEvent, UserProfile } from '../types';
import { getYearFromDate } from '../utils';

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
  
  // Filtered events logic
  const filteredEvents = useMemo(() => savedEvents.filter(event => 
    event.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
    event.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
    getYearFromDate(event.dateStr).toString().includes(filterQuery)
  ), [savedEvents, filterQuery]);

  // Group events by year for the timeline
  const eventsByYear = useMemo(() => filteredEvents.reduce((acc, event) => {
    const year = getYearFromDate(event.dateStr);
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<number, HistoricalEvent[]>), [filteredEvents]);

  const sortedYears = useMemo(() => Object.keys(eventsByYear).map(Number).sort((a, b) => a - b), [eventsByYear]);

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

        <div className="animate-in fade-in slide-in-from-bottom-4 relative pl-2">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            时间轴
          </h3>
          
          {/* Timeline Vertical Line */}
          <div className="absolute left-6 top-12 bottom-4 w-0.5 bg-indigo-100/50 rounded-full"></div>

          <div className="space-y-8 relative">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-bold text-sm">
                {savedEvents.length === 0 ? "暂无历史足迹，点击右上角 + 添加" : "没有找到匹配的事件"}
              </div>
            ) : (
              sortedYears.map(year => (
                <div key={year} className="relative pl-14">
                   {/* Year Dot Marker */}
                   <div className="absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-indigo-300 bg-white z-10 shadow-sm"></div>
                   
                   {/* Year Header */}
                   <div className="mb-3 flex items-center -ml-1">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                          {year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}
                      </span>
                   </div>

                   {/* Events List for this Year */}
                   <div className="space-y-1.5">
                      {eventsByYear[year].map(event => {
                          const isSelected = selectedEvent?.id === event.id;
                          return (
                              <button
                                  key={event.id}
                                  onClick={() => onSelectEvent(event)}
                                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border relative overflow-hidden group/card ${
                                      isSelected
                                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                                      : 'bg-white/40 border-transparent hover:bg-white hover:shadow-sm hover:border-gray-100'
                                  }`}
                              >
                                  <div className="flex justify-between items-baseline gap-2">
                                       <h4 className={`font-bold text-[13px] leading-snug transition-colors ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                          {event.title}
                                       </h4>
                                       {event.dateStr && event.dateStr.length > 4 && (
                                          <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">
                                              {event.dateStr.slice(5)}
                                          </span>
                                       )}
                                  </div>
                              </button>
                          )
                      })}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
