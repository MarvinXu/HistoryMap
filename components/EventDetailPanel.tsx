
import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Save } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { getYearFromDate } from '../utils';

interface EventDetailPanelProps {
  event: HistoricalEvent | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedEvent: HistoricalEvent) => void;
}

const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event, onClose, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HistoricalEvent | null>(null);

  // Reset internal state when event changes
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [event]);

  if (!event) return null;

  const startEditing = () => {
    setEditForm({ ...event });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm) {
      onUpdate(editForm);
      setIsEditing(false);
    }
  };

  return (
    <div className="absolute top-8 right-8 z-20 w-[420px] max-w-[calc(100vw-4rem)] bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-700 ease-out transition-all">
      {!isEditing ? (
        // View Mode
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2">
              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border bg-indigo-50 text-indigo-600 border-indigo-100`}>
                {(() => {
                  const y = getYearFromDate(event.dateStr);
                  return y < 0 ? `公元前 ${Math.abs(y)}` : `公元 ${y}`;
                })()}
              </span>
              {event.dateStr && (
                <span className="text-xs font-black text-gray-400 tracking-wider">
                  {event.dateStr}
                </span>
              )}
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={startEditing}
                  className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-full transition-colors active:scale-90"
                  title="编辑"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onDelete(event.id)}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors active:scale-90"
                  title="删除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            {event.title}
          </h2>
          
          <div className="flex items-center gap-3 text-gray-400 text-[13px] mb-8 font-bold">
            <span className="text-gray-900 px-3 py-1 bg-gray-100 rounded-lg text-[10px] uppercase tracking-widest">地点</span>
            <span className="truncate text-gray-600">{event.location.name}</span>
          </div>

          <div className="prose prose-sm leading-relaxed text-gray-700 font-bold max-h-[40vh] overflow-y-auto pr-5 custom-scroll scroll-smooth text-[15px]">
            {event.description}
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
               <Pencil className="w-5 h-5 text-indigo-600" /> 编辑事件
            </h3>
            <button onClick={cancelEditing} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="space-y-5 flex-grow overflow-y-auto pr-2 hide-scrollbar">
            {editForm && (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">标题</label>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-900"
                  />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">日期/年份 (格式: YYYY-MM-DD 或 -YYYY)</label>
                    <input 
                      type="text" 
                      placeholder="例如: 1990-05-20 或 -221"
                      value={editForm.dateStr}
                      onChange={(e) => setEditForm({...editForm, dateStr: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-900"
                    />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">地点名称</label>
                  <input 
                    type="text" 
                    value={editForm.location.name}
                    onChange={(e) => setEditForm({...editForm, location: {...editForm.location, name: e.target.value}})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-900"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">描述</label>
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-900 h-40 resize-none leading-relaxed"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-6 mt-2 flex gap-3 border-t border-gray-100">
            <button 
              onClick={cancelEditing}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition-all"
            >
              取消
            </button>
            <button 
              onClick={saveEdit}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> 保存修改
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPanel;
