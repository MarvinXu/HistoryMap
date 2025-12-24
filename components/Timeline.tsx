
import React from 'react';
import { HistoricalEvent } from '../types';
import { ChevronRight, Calendar } from 'lucide-react';
import { getYearFromDate } from '../utils';

interface TimelineProps {
  events: HistoricalEvent[];
  selectedEvent: HistoricalEvent | null;
  onSelectEvent: (event: HistoricalEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, selectedEvent, onSelectEvent, isOpen, onClose }) => {
  const sortedEvents = [...events].sort((a, b) => getYearFromDate(a.dateStr) - getYearFromDate(b.dateStr));

  if (events.length === 0) return null;

  return (
    <div 
      className={`h-full bg-white/90 backdrop-blur-3xl border-l border-white/40 shadow-2xl z-20 transition-all duration-500 ease-in-out relative flex flex-col ${
        isOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
      }`}
    >
      <div className="p-8 border-b border-gray-100/50 flex items-center justify-between min-w-[320px]">
        <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          历史编年
        </h3>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar p-6 relative min-w-[320px]">
        {/* Timeline Path Line */}
        <div className="absolute left-[47px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-indigo-50 via-indigo-200 to-indigo-50" />

        <div className="space-y-12 relative">
          {sortedEvents.map((event) => {
            const isSelected = selectedEvent?.id === event.id;
            const year = getYearFromDate(event.dateStr);
            return (
              <div 
                key={event.id}
                className={`group flex items-start gap-6 transition-all duration-300 ${isSelected ? 'scale-105' : 'hover:translate-x-1'}`}
              >
                {/* Year Badge & Dot */}
                <div className="flex flex-col items-center pt-1 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-[5px] shadow-lg transition-all duration-500 z-10 ${
                    isSelected 
                      ? 'bg-indigo-600 border-white ring-[8px] ring-indigo-500/15' 
                      : 'bg-white border-gray-200 group-hover:border-indigo-300'
                  }`} />
                </div>

                {/* Content */}
                <button
                  onClick={() => onSelectEvent(event)}
                  className={`flex-grow text-left p-4 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-900/5' 
                      : 'bg-white/50 border-transparent hover:border-gray-100 hover:bg-white'
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                    isSelected ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`}
                  </p>
                  <h4 className={`text-sm font-black leading-snug ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {event.title}
                  </h4>
                  {isSelected && (
                    <div className="mt-2 text-[11px] text-gray-500 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                      {event.location.name}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Bottom decorative fade */}
      <div className="h-20 absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
    </div>
  );
};

export default Timeline;
