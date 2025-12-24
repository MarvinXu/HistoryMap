
import React from 'react';
import { Github, X, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile, GitHubConfig } from '../../types';

interface GithubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  config: GitHubConfig;
  error: string | null;
  syncing: boolean;
  onLogin: (token: string) => void;
  onLogout: () => void;
}

const GithubConfigModal: React.FC<GithubConfigModalProps> = ({
  isOpen, onClose, userProfile, config, error, syncing, onLogin, onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Github className="w-8 h-8 text-indigo-600" /> {userProfile ? '我的账号' : '连接 GitHub'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        {userProfile ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100">
              <img src={userProfile.avatar_url} alt="avatar" className="w-16 h-16 rounded-2xl shadow-sm border-2 border-white" />
              <div>
                <h3 className="font-black text-gray-900 text-lg">{userProfile.name || userProfile.login}</h3>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">已连接</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> 退出登录
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              使用 GitHub Token 登录后，系统会自动在您的私有 Gist 中保存并同步所有历史足迹数据。
            </p>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="font-bold">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Personal Access Token</label>
              <input
                type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder-gray-300 font-bold"
                placeholder="ghp_xxxxxxxxxxxx"
                onKeyDown={(e) => { if (e.key === 'Enter') onLogin((e.target as HTMLInputElement).value) }}
                defaultValue={config.token}
              />
            </div>
            <button 
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling?.querySelector('input') as HTMLInputElement);
                onLogin(input.value);
              }}
              disabled={syncing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : '开始同步'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubConfigModal;
