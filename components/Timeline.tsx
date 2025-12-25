import React, { useMemo } from 'react';
import { HistoricalEvent } from '../types';
import { getYearFromDate, compareDateStrings } from '../utils';

interface TimelineProps {
  events: HistoricalEvent[];
  selectedEvent: HistoricalEvent | null;
  onSelectEvent: (event: HistoricalEvent) => void;
  filterQuery: string;
  savedEvents: HistoricalEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ 
  events, 
  selectedEvent, 
  onSelectEvent, 
  filterQuery,
  savedEvents
}) => {
  // Filtered events logic
  const filteredEvents = useMemo(() => events.filter(event => 
    event.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
    event.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
    getYearFromDate(event.dateStr).toString().includes(filterQuery)
  ), [events, filterQuery]);

  // Group events by year for the timeline
  const eventsByYear = useMemo(() => filteredEvents.reduce((acc, event) => {
    const year = getYearFromDate(event.dateStr);
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<number, HistoricalEvent[]>), [filteredEvents]);

  const sortedYears = useMemo(() => Object.keys(eventsByYear).map(Number).sort((a, b) => a - b), [eventsByYear]);

  // 确保同一年份内的事件按日期排序
  const sortedEventsByYear = useMemo(() => {
    const result = { ...eventsByYear };
    Object.keys(result).forEach(year => {
      result[parseInt(year)].sort((a, b) => compareDateStrings(a.dateStr, b.dateStr));
    });
    return result;
  }, [eventsByYear]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative">
      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
        时间轴
      </h3>
      
      {/* Timeline Vertical Line */}
      <div className="absolute left-4 top-12 bottom-4 w-0.5 bg-indigo-100/50 rounded-full"></div>

      <div className="space-y-8 relative">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-bold text-sm">
            {savedEvents.length === 0 ? "暂无历史足迹，点击右上角 + 添加" : "没有找到匹配的事件"}
          </div>
        ) : (
          sortedYears.map(year => (
            <div key={year} className="relative pl-10">
               {/* Year Dot Marker */}
               <div className="absolute left-2.5 top-1.5 w-4 h-4 rounded-full border-2 border-indigo-300 bg-white z-10 shadow-sm"></div>
               
               {/* Year Header */}
               <div className="mb-3 flex items-center ">
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                      {year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}
                  </span>
               </div>

               {/* Events List for this Year */}
               <div className="space-y-1.5">
                  {sortedEventsByYear[year].map(event => {
                      const isSelected = selectedEvent?.id === event.id;
                      return (
                          <button
                              key={event.id}
                              onClick={() => onSelectEvent(event)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border relative overflow-hidden group/card ${isSelected
                                  ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                                  : 'bg-white/40 border-transparent hover:bg-white hover:shadow-sm hover:border-gray-100'}`}
                          >
                              <div className="flex justify-between items-baseline gap-2">
                                   <h4 className={`font-bold text-[13px] leading-snug transition-colors ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                      {event.title}
                                   </h4>
                                   {event.dateStr && event.dateStr.length > 4 && (
                                      <span className="text-[10px] font-medium text-gray-400 shrink-0">
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
  );
};

export default Timeline;





