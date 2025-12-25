
import React, { useState } from 'react';
import { Plus, ListChecks, X, AlertCircle, Loader2, Sparkles, Check, MapPin, Copy } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseManualEvents = (input: string): { events: HistoricalEvent[], error: string | null } => {
    const events: HistoricalEvent[] = [];
    const eventBlocks = input.split('--').map(block => block.trim()).filter(block => block.length > 0);

    if (eventBlocks.length === 0) {
      return { events: [], error: '请输入至少一个事件信息' };
    }

    for (let i = 0; i < eventBlocks.length; i++) {
      const block = eventBlocks[i];
      const event: any = { id: crypto.randomUUID() };
      const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const fieldSet = new Set<string>();

      for (const line of lines) {
        const [field, value] = line.split('::').map(part => part.trim());
        if (!field || !value) {
          return { events: [], error: `第 ${i + 1} 个事件格式错误：请使用 "字段::值" 格式` };
        }
        
        const fieldKey = field.toLowerCase();
        if (fieldSet.has(fieldKey)) {
          return { events: [], error: `第 ${i + 1} 个事件格式错误：重复的字段 "${field}"` };
        }
        fieldSet.add(fieldKey);

        switch (fieldKey) {
          case '标题':
          case 'title':
            event.title = value;
            break;
          case '日期':
          case 'date':
            if (!/^\d/.test(value)) {
              return { events: [], error: `第 ${i + 1} 个事件格式错误：日期格式不正确，应为数字开头` };
            }
            event.dateStr = value;
            break;
          case '地点':
          case 'location':
            if (!event.location) {
              event.location = { name: value, lat: 0, lng: 0 };
            } else {
              event.location.name = value;
            }
            break;
          case '纬度':
          case 'lat': {
            const lat = parseFloat(value);
            if (isNaN(lat)) {
              return { events: [], error: `第 ${i + 1} 个事件格式错误：纬度必须是有效数字` };
            }
            if (lat < -90 || lat > 90) {
              return { events: [], error: `第 ${i + 1} 个事件格式错误：纬度必须在 -90 到 90 之间` };
            }
            if (!event.location) {
              event.location = { name: '', lat, lng: 0 };
            } else {
              event.location.lat = lat;
            }
            break;
          }
          case '经度':
          case 'lng':
          case 'lon': {
            const lng = parseFloat(value);
            if (isNaN(lng)) {
              return { events: [], error: `第 ${i + 1} 个事件格式错误：经度必须是有效数字` };
            }
            if (lng < -180 || lng > 180) {
              return { events: [], error: `第 ${i + 1} 个事件格式错误：经度必须在 -180 到 180 之间` };
            }
            if (!event.location) {
              event.location = { name: '', lat: 0, lng };
            } else {
              event.location.lng = lng;
            }
            break;
          }
          case '描述':
          case 'description':
            event.description = value;
            break;
          default:
            return { events: [], error: `第 ${i + 1} 个事件格式错误：未知字段 "${field}"` };
        }
      }

      if (!event.title) {
        return { events: [], error: `第 ${i + 1} 个事件缺少必填字段：标题` };
      }
      if (!event.dateStr) {
        return { events: [], error: `第 ${i + 1} 个事件缺少必填字段：日期` };
      }

      events.push({
        ...event,
        location: event.location || { name: '', lat: 0, lng: 0 },
        description: event.description || ''
      });
    }

    return { events, error: null };
  };

  const handleBatchAnalyze = async () => {
    if (activeTab === 'ai') {
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
    } else {
      // Manual input parsing
      const { events, error } = parseManualEvents(batchInput);
      if (error) {
        setError(error);
        return;
      }

      setReviewEvents(events);
      setSelectedReviewIds(new Set(events.map(e => e.id)));
      setStep('review');
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
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {step === 'input' ? <Plus className="w-7 h-7 text-indigo-600" /> : <ListChecks className="w-7 h-7 text-green-600" />}
            {step === 'input' ? '批量添加事件' : '确认添加'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {step === 'input' && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'ai' ? 'bg-white text-indigo-900 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className={`w-4 h-4 ${activeTab === 'ai' ? 'text-indigo-600' : 'text-gray-400'}`} />
                AI 辅助
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'manual' ? 'bg-white text-indigo-900 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <ListChecks className={`w-4 h-4 ${activeTab === 'manual' ? 'text-indigo-600' : 'text-gray-400'}`} />
                手动输入
              </div>
            </button>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm border transition-all mb-4 shrink-0 ${error.includes('复制') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <div className={`w-5 h-5 shrink-0 mt-0.5 ${error.includes('复制') ? 'text-green-500' : 'text-red-500'}`}>
              {error.includes('复制') ? (
                <Check className="w-full h-full" />
              ) : (
                <AlertCircle className="w-full h-full" />
              )}
            </div>
            <div className="font-bold">{error}</div>
          </div>
        )}

        {step === 'input' ? (
          <div className="space-y-6">
            {activeTab === 'ai' ? (
              <p className="text-sm text-gray-500 font-bold">
                请输入历史事件名称（每行一个）。<br/>AI 将自动补充年份、地点和详细描述。
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-bold">
                  请按照以下格式输入事件信息（支持中文或英文字段名）：<br/>
                  <span className="text-indigo-600">标题::事件名称</span><br/>
                  <span className="text-indigo-600">日期::YYYY-MM-DD</span><br/>
                  <span className="text-indigo-600">地点::事件地点</span><br/>
                  <span className="text-indigo-600">纬度::30.1234</span><br/>
                  <span className="text-indigo-600">经度::120.5678</span><br/>
                  <span className="text-indigo-600">描述::事件描述</span><br/>
                  <span className="text-indigo-600">--</span>（分隔不同事件）
                </p>
                <button
                  onClick={async () => {
                    const prompt = "你是一个历史专家，我将会给你一些历史事件名称，请你根据我提供的格式补全信息。格式如下：\n 标题::事件名称\n 日期::YYYY-MM-DD\n 地点::事件地点\n 纬度::30.1234\n 经度::120.5678\n 描述::事件描述\n --（分隔不同事件）\n 稍后我将给出多个事件名称，请你补全信息后以代码块格式输出\n ";
                    await navigator.clipboard.writeText(prompt);
                    setError("提示文本已复制到剪贴板！");
                    setTimeout(() => setError(null), 2000);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  复制AI提示词
                </button>
              </div>
            )}
            <textarea
              className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-gray-900 resize-none leading-relaxed"
              placeholder={activeTab === 'ai' ? 
                `例如：\n赤壁之战\n凡尔赛条约签订\n阿波罗11号登月` : 
                `例如：\n标题::赤壁之战\n日期::208-09\n地点::赤壁\n纬度::29.8394\n经度::113.9872\n描述::三国时期重要战役\n--\n标题::凡尔赛条约签订\n日期::1919-06-28\n地点::巴黎凡尔赛宫\n纬度::48.8020\n经度::2.1374\n描述::一战后和平条约`
              }
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
                  <Loader2 className="w-5 h-5 animate-spin" /> {activeTab === 'ai' ? 'AI 正在解析历史数据...' : '正在处理事件信息...'}
                </>
              ) : (
                <>
                  {activeTab === 'ai' ? <Sparkles className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />} {activeTab === 'ai' ? '开始分析' : '生成预览'}
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="grow overflow-y-auto space-y-3 pr-2 custom-scroll mb-6">
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
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors mt-1 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="grow">
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
            <div className="flex gap-3 shrink-0 border-t border-gray-100 pt-6">
               <button 
                onClick={() => setStep('input')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition-all"
              >
                返回修改
              </button>
              <button 
                onClick={confirmBatchAdd}
                disabled={selectedReviewIds.size === 0}
                className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
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