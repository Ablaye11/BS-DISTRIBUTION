import React from 'react';

interface OfficialStampProps {
  date?: string;
  signataire?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OfficialStamp: React.FC<OfficialStampProps> = ({ 
  date = new Date().toLocaleDateString('fr-FR'),
  signataire = 'M. Ndiaye Saliou (Gérant)',
  size = 'md'
}) => {
  const dimensions = size === 'sm' ? 'w-28 h-28' : size === 'lg' ? 'w-44 h-44' : 'w-36 h-36';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${dimensions} p-1 text-center`}>
      <svg className="w-full h-full text-amber-500 opacity-95 drop-shadow-md rotate-[-5deg]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Stamp Rings */}
        <circle cx="100" cy="100" r="94" stroke="#5C3A21" strokeWidth="4" strokeDasharray="6 3" />
        <circle cx="100" cy="100" r="86" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="62" stroke="#5C3A21" strokeWidth="1.5" strokeDasharray="3 3" />
        
        {/* Curved Text Top & Bottom */}
        <path id="curve-top" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
        <text className="text-[11px] font-extrabold fill-amber-500 uppercase tracking-wider">
          <textPath href="#curve-top" startOffset="50%" textAnchor="middle">
            BS DISTRIBUTION D'ŒUFS SUARL
          </textPath>
        </text>

        <path id="curve-bottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />
        <text className="text-[9px] font-bold fill-amber-400 uppercase tracking-widest">
          <textPath href="#curve-bottom" startOffset="50%" textAnchor="middle">
            ★ KEUR MASSAR — SÉNÉGAL ★
          </textPath>
        </text>

        {/* Center Logo Emblem */}
        <g transform="translate(82, 58) scale(1.5)">
          <path d="M12 2C8 2 5 8 5 13C5 17.4183 8.13401 21 12 21C15.866 21 19 17.4183 19 13C19 8 16 2 12 2Z" fill="#f59e0b" opacity="0.3" stroke="#5C3A21" strokeWidth="1.5"/>
        </g>

        {/* Official Seal Content Text */}
        <text x="100" y="108" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 uppercase">
          TÉL: 76 622 59 79
        </text>
        <text x="100" y="122" textAnchor="middle" className="text-[9px] font-semibold fill-amber-300">
          VALIDÉ LE {date}
        </text>

        {/* Signature Overlay */}
        <path d="M 50,140 Q 90,110 120,135 T 165,120" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span className="text-[10px] font-extrabold text-amber-400 mt-1 uppercase tracking-tight">
        {signataire}
      </span>
    </div>
  );
};
