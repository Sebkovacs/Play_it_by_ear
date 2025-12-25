import React from 'react';
import { Card } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
);

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-darkBlue/80 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto relative bg-white flex flex-col !p-0 !rounded-xl !shadow-hard-lg">
         <div className="flex items-center justify-between border-b-2 border-brand-darkBlue p-4 bg-brand-background">
            {title && <h2 className="text-xl font-black uppercase text-brand-darkBlue tracking-tight">{title}</h2>}
            <button onClick={onClose} className="p-2 hover:bg-brand-darkBlue hover:text-white rounded-lg border-2 border-transparent hover:border-brand-darkBlue transition-all text-brand-darkBlue ml-auto">
                <CloseIcon />
            </button>
         </div>
         
         <div className="p-6 space-y-4">
            {children}
         </div>
      </Card>
    </div>
  );
};