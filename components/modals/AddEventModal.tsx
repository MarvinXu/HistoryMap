
import React, { useState } from 'react';
import { Plus, ListChecks, X, AlertCircle, Loader2, Sparkles, Check, MapPin } from 'lucide-react';
import { HistoricalEvent } from '../../types';
import { fetchEventDetailsBatch } from '../../services/geminiService';
import { getYearFromDate } from '../../utils';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvents: (events: HistoricalEvent[]) => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onAddEvents }) => {
  const [batchInput, setBatchInput] = useState('');
  const [reviewEvents, setReviewEvents] = useState<HistoricalEvent[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBatchAnalyze = async () => {
    const names = batchInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (names.length === 0) {
      setError("请输入至少一个事件名称");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await fetchEventDetailsBatch(names);
      if (results.length === 0) {
        setError("AI 未能识别任何事件，请尝试更具体的名称");
        setLoading(false);
        return;
      }
      
      const resultsWithIds = results.map(e => ({
        ...e,
        id: e.id || crypto.randomUUID()
      }));

      setReviewEvents(resultsWithIds);
      setSelectedReviewIds(new Set(resultsWithIds.map(e => e.id)));
      setStep('review');
    } catch (err) {
      setError("AI 分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewSelection = (id: string) => {
    const newSet = new Set(selectedReviewIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReviewIds(newSet);
  };

  const confirmBatchAdd = () => {
    const eventsToAdd = reviewEvents.filter(e => selectedReviewIds.has(e.id));
    onAddEvents(eventsToAdd);
    // Reset state after add
    setBatchInput('');
    setReviewEvents([]);
    setStep('input');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-[2.5rem] p-8 w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col ${step === 'review' ? 'max-w-2xl h-[80vh]' : 'max-w-md'}`}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {step === 'input' ? <Plus className="w-7 h-7 text-indigo-600" /> : <ListChecks className="w-7 h-7 text-green-600" />}
            {step === 'input' ? '批量添加事件' : '确认添加'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm border border-red-100 mb-4 flex-shrink-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-bold">{error}</div>
          </div>
        )}

        {step === 'input' ? (
          <div className="space-y-6">
             <p className="text-sm text-gray-500 font-bold">
              请输入历史事件名称（每行一个）。<br/>AI 将自动补充年份、地点和详细描述。
            </p>
            <textarea
              className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-gray-900 resize-none leading-relaxed"
              placeholder={`例如：\n赤壁之战\n凡尔赛条约签订\n阿波罗11号登月`}
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
            />
            <button 
              onClick={handleBatchAnalyze}
              disabled={loading || !batchInput.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> AI 正在解析历史数据...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> 开始分析
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scroll mb-6">
              {reviewEvents.map(event => {
                const isSelected = selectedReviewIds.has(event.id);
                const year = getYearFromDate(event.dateStr);
                return (
                  <div 
                    key={event.id}
                    onClick={() => toggleReviewSelection(event.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-1 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                         <h4 className={`font-black text-lg ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{event.title}</h4>
                         <span className="text-[10px] font-black bg-white/50 px-2 py-1 rounded-md text-gray-500 border border-gray-100">
                           {year}
                         </span>
                      </div>
                      <p className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 flex-shrink-0 border-t border-gray-100 pt-6">
               <button 
                onClick={() => setStep('input')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition-all"
              >
                返回修改
              </button>
              <button 
                onClick={confirmBatchAdd}
                disabled={selectedReviewIds.size === 0}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                确认添加 ({selectedReviewIds.size})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddEventModal;
