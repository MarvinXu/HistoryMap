
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">确认删除?</h3>
            <p className="text-gray-500 font-bold text-sm mt-2 leading-relaxed">
              此操作将永久删除该历史足迹，且无法恢复。
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-3.5 rounded-2xl transition-all"
            >
              取消
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-red-200"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
