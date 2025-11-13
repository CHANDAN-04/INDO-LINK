import React from 'react';

const Logo = ({ 
  size = 40, 
  className = "", 
  showText = false, 
  textSize = "text-xl",
  textColor = "text-foreground"
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          {/* Earth/Nature gradient */}
          <linearGradient id="earthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#10B981", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#059669", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#047857", stopOpacity:1}} />
          </linearGradient>
          
          {/* Growth/Leaf gradient */}
          <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#D1FAE5", stopOpacity:0.9}} />
            <stop offset="100%" style={{stopColor:"#A7F3D0", stopOpacity:0.7}} />
          </linearGradient>
          
          {/* Connection/Network gradient */}
          <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#FEF3C7", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#FDE68A", stopOpacity:0.9}} />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer ring - Global reach */}
        <circle cx="20" cy="20" r="19" fill="none" stroke="url(#earthGradient)" strokeWidth="0.8" opacity="0.4"/>
        
        {/* Main circle - Earth/Foundation */}
        <circle cx="20" cy="20" r="17" fill="url(#earthGradient)" filter="url(#glow)"/>
        
        {/* Inner growth zone */}
        <circle cx="20" cy="20" r="13" fill="url(#growthGradient)" opacity="0.3"/>
        
        {/* Central marketplace hub */}
        <circle cx="20" cy="20" r="4" fill="white" stroke="url(#earthGradient)" strokeWidth="1.5"/>
        
        {/* Four cardinal connection points - Major markets */}
        <circle cx="20" cy="8" r="2.5" fill="url(#networkGradient)" stroke="white" strokeWidth="1"/>
        <circle cx="32" cy="20" r="2.5" fill="url(#networkGradient)" stroke="white" strokeWidth="1"/>
        <circle cx="20" cy="32" r="2.5" fill="url(#networkGradient)" stroke="white" strokeWidth="1"/>
        <circle cx="8" cy="20" r="2.5" fill="url(#networkGradient)" stroke="white" strokeWidth="1"/>
        
        {/* Diagonal connection points - Secondary markets */}
        <circle cx="26" cy="14" r="1.8" fill="white" opacity="0.7"/>
        <circle cx="26" cy="26" r="1.8" fill="white" opacity="0.7"/>
        <circle cx="14" cy="26" r="1.8" fill="white" opacity="0.7"/>
        <circle cx="14" cy="14" r="1.8" fill="white" opacity="0.7"/>
        
        {/* Main connection lines - Primary trade routes */}
        <path d="M20 8L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M32 20L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M20 32L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
        <path d="M8 20L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
        
        {/* Diagonal connections - Secondary routes */}
        <path d="M26 14L20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        <path d="M26 26L20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        <path d="M14 26L20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        <path d="M14 14L20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        
        {/* Leaf symbol - Agriculture/Nature */}
        <path d="M20 6C18 4 15 5 15 7C15 9 18 8 20 10C22 8 25 9 25 7C25 5 22 4 20 6Z" 
              fill="url(#growthGradient)" opacity="0.8"/>
        
        {/* Center core */}
        <circle cx="20" cy="20" r="1.2" fill="url(#earthGradient)"/>
        
        {/* Network accent dots */}
        <circle cx="20" cy="5" r="0.8" fill="url(#networkGradient)" opacity="0.8"/>
        <circle cx="35" cy="20" r="0.8" fill="url(#networkGradient)" opacity="0.8"/>
        <circle cx="20" cy="35" r="0.8" fill="url(#networkGradient)" opacity="0.8"/>
        <circle cx="5" cy="20" r="0.8" fill="url(#networkGradient)" opacity="0.8"/>
      </svg>
      
      {showText && (
        <span className={`font-bold ${textSize} ${textColor}`}>
          IndoLink
        </span>
      )}
    </div>
  );
};

export default Logo;
