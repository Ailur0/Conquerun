import React from 'react';
import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../../utils/validation';

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

// Live checklist of password requirements; each rule turns green once satisfied
export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password, className = '' }) => (
  <ul className={`grid gap-1 text-xs ${className}`} aria-label="Password requirements">
    {PASSWORD_RULES.map((rule) => {
      const met = password.length > 0 && rule.test(password);
      return (
        <li key={rule.label} className={`flex items-center gap-2 ${met ? 'text-green-700' : 'text-gray-500'}`}>
          {met ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Circle className="w-3 h-3" aria-hidden />}
          <span>{rule.label}</span>
          <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
        </li>
      );
    })}
  </ul>
);
