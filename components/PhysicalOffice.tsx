import React, { useState, useRef, useEffect } from 'react';
import { Building2, Activity } from 'lucide-react';
import { Agent } from '../types';
import { ROOMS } from '../constants';

// --- CONSTANTS ---
const ISO_ANGLE = 30; // Standard Isometric Angle
const TILE_WIDTH = 60; // Width of a single tile in pixels
const TILE_HEIGHT = 30; // Height of a single tile in pixels

interface PhysicalOfficeProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

// --- SVG HELPERS ---

// Convert Grid (x,y) to Screen (px, py) for Isometric SVG
const toIso = (x: number, y: number) => {
  return {
    x: (x - y) * TILE_WIDTH,
    y: (x + y) * TILE_HEIGHT
  };
};

// Generate SVG Path for a Floor Tile (Diamond Shape)
const getTilePath = (x: number, y: number) => {
  const { x: px, y: py } = toIso(x, y);
  return `M${px} ${py} L${px + TILE_WIDTH} ${py + TILE_HEIGHT} L${px} ${py + TILE_HEIGHT * 2} L${px - TILE_WIDTH} ${py + TILE_HEIGHT} Z`;
};

// Generate SVG Path for a Wall Block (Left or Right Face)
const getWallPath = (x: number, y: number, height: number, face: 'left' | 'right') => {
  const { x: px, y: py } = toIso(x, y);
  if (face === 'left') {
     // Left Face (Vertical along Y axis)
     return `M${px - TILE_WIDTH} ${py + TILE_HEIGHT} L${px} ${py + TILE_HEIGHT * 2} L${px} ${py + TILE_HEIGHT * 2 - height} L${px - TILE_WIDTH} ${py + TILE_HEIGHT - height} Z`;
  } else {
     // Right Face (Vertical along X axis)
     return `M${px} ${py + TILE_HEIGHT * 2} L${px + TILE_WIDTH} ${py + TILE_HEIGHT} L${px + TILE_WIDTH} ${py + TILE_HEIGHT - height} L${px} ${py + TILE_HEIGHT * 2 - height} Z`;
  }
};

// Generate SVG Path for a Wall Top (Cap)
const getWallTopPath = (x: number, y: number, height: number) => {
  const { x: px, y: py } = toIso(x, y);
  const topY = py - height;
  return `M${px} ${topY} L${px + TILE_WIDTH} ${topY + TILE_HEIGHT} L${px} ${topY + TILE_HEIGHT * 2} L${px - TILE_WIDTH} ${topY + TILE_HEIGHT} Z`;
};


export const PhysicalOffice: React.FC<PhysicalOfficeProps> = ({ agents: initialAgents, selectedAgentId, onSelectAgent }) => {
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: -4000, y: -3000, w: 8000, h: 6000 });
  const [localAgents, setLocalAgents] = useState(initialAgents);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [activeMenuAgentId, setActiveMenuAgentId] = useState<string | null>(null);
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);

  const handleRoomFocus = (roomId: string | null) => {
    setFocusedRoomId(roomId);
    if (roomId) {
      const room = ROOMS.find(r => r.id === roomId);
      if (room) {
        // Calculate room center in grid units (0-100 range)
        const gridCenterX = room.x + room.w / 2;
        const gridCenterY = room.y + room.h / 2;
        
        // Convert to isometric coordinates (mapping to our 50x50 grid)
        const isoX = (gridCenterX / 100) * 50;
        const isoY = (gridCenterY / 100) * 50;
        const pos = toIso(isoX, isoY);
        
        // Target zoom level - tighter for focus
        const targetZoom = 2.8;
        
        // Smoothly transition zoom and pan
        setZoom(targetZoom);
        setPan({ 
          x: -pos.x, 
          y: -pos.y + 150 // Offset slightly for HUD
        });

        // Adjust viewBox for tactical focus
        setViewBox({
          x: pos.x - 1500,
          y: pos.y - 1200,
          w: 3000,
          h: 2400
        });
      }
    } else {
      setZoom(0.6);
      setPan({ x: 0, y: 0 });
      setViewBox({ x: -4000, y: -3000, w: 8000, h: 6000 });
    }
  };

  // Update localAgents when initialAgents prop changes (e.g., from external data source)
  useEffect(() => {
    setLocalAgents(initialAgents);
  }, [initialAgents]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef<number>(0);

  // --- AGENT MOVEMENT LOGIC ---
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastUpdateTime.current) {
        lastUpdateTime.current = currentTime;
      }
      const deltaTime = (currentTime - lastUpdateTime.current) / 1000; // seconds

      setLocalAgents(prevAgents => prevAgents.map(agent => {
        if (agent.targetPosition && agent.speed) {
          const current = agent.currentPosition;
          const target = agent.targetPosition;
          const distanceX = target.x - current.x;
          const distanceY = target.y - current.y;
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

          if (distance < agent.speed * deltaTime) {
            // Agent has reached or overshot the target
            return { ...agent, currentPosition: target, targetPosition: undefined, status: 'IDLE' };
          } else {
            // Move towards the target
            const directionX = distanceX / distance;
            const directionY = distanceY / distance;
            const newX = current.x + directionX * agent.speed * deltaTime;
            const newY = current.y + directionY * agent.speed * deltaTime;
            return { ...agent, currentPosition: { x: newX, y: newY } };
          }
        }
        return agent;
      }));

      lastUpdateTime.current = currentTime;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // No dependency on agents prop, as localAgents is managed internally

  // Depend on localAgents to re-run if agent data changes
  useEffect(() => {
    // This useEffect is just to trigger re-render when localAgents change
    // The actual animation loop doesn't need to re-run for every position update
  }, [localAgents]);

  // --- INTERACTION ---
  const handleMouseDown = (e: React.MouseEvent) => {
     isDragging.current = true;
     hasDragged.current = false;
     lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
     if (!isDragging.current) return;
     hasDragged.current = true;
     // Adjust drag speed based on zoom level for "sticky" feel
     const dx = (e.clientX - lastMousePos.current.x) / zoom;
     const dy = (e.clientY - lastMousePos.current.y) / zoom;
     setPan(p => ({ x: p.x + dx, y: p.y + dy }));
     lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
     if (!hasDragged.current) {
         setSelectedFurnitureId(null);
         setActiveMenuAgentId(null);
         onSelectAgent(''); // Also deselect agent if clicking background
     }
     isDragging.current = false;
     hasDragged.current = false;
  };

  const handleMoveAgent = () => {
    if (!selectedAgentId) return;

    const agentToMove = localAgents.find(a => a.id === selectedAgentId);
    if (!agentToMove) return;

    // Pick a random room
    const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];

    // Generate a random position within that room (in percentage)
    const targetX = randomRoom.x + Math.random() * randomRoom.w;
    const targetY = randomRoom.y + Math.random() * randomRoom.h;

    setLocalAgents(prevAgents => prevAgents.map(agent => 
      agent.id === selectedAgentId 
        ? { ...agent, targetPosition: { x: targetX, y: targetY }, speed: 10 } // Set a default speed
        : agent
    ));
  };

  // --- RENDERERS ---

  const renderRoom = (room: typeof ROOMS[0]) => {
     // Convert % to Grid (50x50)
     const startX = Math.floor((room.x / 100) * 50);
     const startY = Math.floor((room.y / 100) * 50);
     const w = Math.floor((room.w / 100) * 50);
     const h = Math.floor((room.h / 100) * 50);

     const elements = [];

     // 1. FLOOR (Base Layer)
     // Instead of drawing individual tiles (expensive), draw one big polygon for the room floor
     const p1 = toIso(startX, startY); // Top
     const p2 = toIso(startX + w, startY); // Right
     const p3 = toIso(startX + w, startY + h); // Bottom
     const p4 = toIso(startX, startY + h); // Left

     const floorPath = `M${p1.x} ${p1.y} L${p2.x + TILE_WIDTH} ${p2.y + TILE_HEIGHT} L${p3.x} ${p3.y + TILE_HEIGHT * 2} L${p4.x - TILE_WIDTH} ${p4.y + TILE_HEIGHT} Z`;
     
     let floorFill = 'url(#tilePattern)';
     let floorStroke = '#27272a';
     
     if (room.id === 'CEO_OFFICE') { floorFill = 'url(#woodPattern)'; floorStroke = '#44403c'; }
     if (room.id === 'WAR_ROOM') { floorFill = 'url(#carpetPattern)'; floorStroke = '#312e81'; }
     if (room.id === 'LOUNGE') { floorFill = 'url(#concretePattern)'; floorStroke = '#3f3f46'; }

     let lightGradient = '';
     if (room.id === 'CEO_OFFICE') lightGradient = 'url(#ceoLight)';
     else if (room.id === 'WAR_ROOM') lightGradient = 'url(#warRoomLight)';
     else if (room.id === 'LOUNGE') lightGradient = 'url(#loungeLight)';
     else if (room.id === 'WORKING_AREA') lightGradient = 'url(#workingAreaLight)';

     const activeAgentsInRoom = localAgents.filter(agent => {
        const agentRoom = ROOMS.find(r => 
           agent.currentPosition.x >= r.x && 
           agent.currentPosition.x <= r.x + r.w &&
           agent.currentPosition.y >= r.y && 
           agent.currentPosition.y <= r.y + r.h
        );
        return agentRoom?.id === room.id && (agent.status === 'WORKING' || agent.status === 'THINKING');
     });

     const lightOpacity = activeAgentsInRoom.length > 0 ? 0.8 : 0.3;

     const isDimmed = focusedRoomId && focusedRoomId !== room.id;
     
     // Room-specific glow intensity
     const glowOpacity = focusedRoomId === room.id ? 0.6 : 0.15;
     const glowColor = room.id === 'WAR_ROOM' ? '#a855f7' : room.id === 'CEO_OFFICE' ? '#eab308' : room.id === 'LOUNGE' ? '#22c55e' : '#3b82f6';

     elements.push(
        <g 
          key={`room-group-${room.id}`} 
          style={{ 
            opacity: isDimmed ? 0.08 : 1, 
            filter: isDimmed ? 'blur(12px)' : 'none',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
           <path key={`floor-${room.id}`} d={floorPath} fill={floorFill} stroke={floorStroke} strokeWidth="2" />
           <path 
             key={`floor-light-${room.id}`} 
             d={floorPath} 
             fill={lightGradient} 
             style={{ pointerEvents: 'none', opacity: lightOpacity * (focusedRoomId === room.id ? 1.5 : 1), transition: 'opacity 0.5s ease-in-out' }} 
           />
           
           {/* Room Glow Aura */}
           <path 
             d={floorPath} 
             fill={glowColor}
             opacity={glowOpacity}
             style={{ filter: 'blur(40px)', pointerEvents: 'none', transition: 'opacity 0.5s ease-in-out' }}
           />
        </g>
     );

     // 2. WALLS (Back Walls Only - to not block view)
     const wallHeight = 120;
     
     // Left Wall (along Y axis)
     const leftWallPath = `
        M${p1.x - TILE_WIDTH} ${p1.y + TILE_HEIGHT} 
        L${p4.x - TILE_WIDTH} ${p4.y + TILE_HEIGHT} 
        L${p4.x - TILE_WIDTH} ${p4.y + TILE_HEIGHT - wallHeight} 
        L${p1.x - TILE_WIDTH} ${p1.y + TILE_HEIGHT - wallHeight} Z`;

     // Right Wall (along X axis)
     const rightWallPath = `
        M${p1.x} ${p1.y} 
        L${p2.x + TILE_WIDTH} ${p2.y + TILE_HEIGHT} 
        L${p2.x + TILE_WIDTH} ${p2.y + TILE_HEIGHT - wallHeight} 
        L${p1.x} ${p1.y - wallHeight} Z`;

     elements.push(
        <g key={`walls-${room.id}`} style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.5s ease-in-out' }}>
           {/* Wall Thickness / Outer Layer */}
           <path d={leftWallPath} fill="#18181b" transform="translate(-4, 2)" opacity="0.5" />
           <path d={rightWallPath} fill="#18181b" transform="translate(4, 2)" opacity="0.5" />

           <path d={leftWallPath} fill={room.id === 'LOUNGE' ? 'url(#concretePattern)' : '#27272a'} stroke="#3f3f46" strokeWidth="1.5" />
           <path d={rightWallPath} fill={room.id === 'LOUNGE' ? 'url(#concretePattern)' : '#202022'} stroke="#3f3f46" strokeWidth="1.5" />
           
           {/* Ambient Occlusion / Corner Shadows */}
           <path d={`M${p1.x - TILE_WIDTH} ${p1.y + TILE_HEIGHT} L${p1.x - TILE_WIDTH} ${p1.y + TILE_HEIGHT - wallHeight} L${p1.x - TILE_WIDTH + 10} ${p1.y + TILE_HEIGHT - wallHeight + 5} L${p1.x - TILE_WIDTH + 10} ${p1.y + TILE_HEIGHT + 5} Z`} fill="black" opacity="0.2" />
           <path d={`M${p1.x} ${p1.y} L${p1.x} ${p1.y - wallHeight} L${p1.x + 10} ${p1.y - wallHeight + 5} L${p1.x + 10} ${p1.y + 5} Z`} fill="black" opacity="0.2" />

           {/* Ceiling Beams / Wall Tops */}
           <path d={`M${p1.x - TILE_WIDTH} ${p1.y + TILE_HEIGHT - wallHeight} L${p4.x - TILE_WIDTH} ${p4.y + TILE_HEIGHT - wallHeight} L${p4.x - TILE_WIDTH + 5} ${p4.y + TILE_HEIGHT - wallHeight - 5} L${p1.x - TILE_WIDTH + 5} ${p1.y + TILE_HEIGHT - wallHeight - 5} Z`} fill="#3f3f46" />
           <path d={`M${p1.x} ${p1.y - wallHeight} L${p2.x + TILE_WIDTH} ${p2.y + TILE_HEIGHT - wallHeight} L${p2.x + TILE_WIDTH - 5} ${p2.y + TILE_HEIGHT - wallHeight - 5} L${p1.x - 5} ${p1.y - wallHeight - 5} Z`} fill="#3f3f46" />

           {/* Glass Effect Overlay */}
           {(room.id === 'CEO_OFFICE' || room.id === 'WAR_ROOM' || room.id === 'WORKING_AREA') && (
              <>
                 <path d={leftWallPath} fill="url(#glassGradient)" opacity="0.3" />
                 <path d={rightWallPath} fill="url(#glassGradient)" opacity="0.3" />
                 {/* Window panes / frames for glass walls */}
                 <rect x={p1.x - TILE_WIDTH + 15} y={p1.y + TILE_HEIGHT - wallHeight + 30} width={TILE_WIDTH - 30} height={wallHeight - 60} fill="none" stroke="#3f3f46" strokeWidth="2" opacity="0.5" />
                 <rect x={p1.x + 15} y={p1.y - wallHeight + 30} width={w * TILE_WIDTH - 30} height={wallHeight - 60} fill="none" stroke="#3f3f46" strokeWidth="2" transform={`skewX(30)`} opacity="0.5" />
              </>
           )}
        </g>
     );

     elements.push(...renderFurnitureSVG(room, selectedFurnitureId, setSelectedFurnitureId));

     return elements;
  };

  const renderFurnitureSVG = (room: typeof ROOMS[0], selectedFurnitureId: string | null, setSelectedFurnitureId: (id: string | null) => void) => {
    const startX = Math.floor((room.x / 100) * 50);
    const startY = Math.floor((room.y / 100) * 50);
    const w = Math.floor((room.w / 100) * 50);
    const h = Math.floor((room.h / 100) * 50);

    const items = [];

    // Helper for Z-Index sorting in SVG context (larger y, then larger x, then z offset)
    const getSVGZIndex = (x: number, y: number, z: number = 0) => {
        const isoY = (x + y) * TILE_HEIGHT;
        return isoY + z; // Simple z-index based on isometric Y position
    };

    if (room.id === 'WAR_ROOM') {
        // Big Conference Table (Enhanced)
        const tableGridX = startX + Math.floor(w / 2);
        const tableGridY = startY + Math.floor(h / 2);
        const { x: tablePx, y: tablePy } = toIso(tableGridX, tableGridY);
        const tableWidth = TILE_WIDTH * 4;
        const tableHeight = TILE_HEIGHT * 2;
        const isSelected = selectedFurnitureId === 'war-table';

        items.push(
            <g 
                key="war-table" 
                transform={`translate(${tablePx - tableWidth / 2}, ${tablePy - tableHeight / 2})`} 
                style={{ zIndex: getSVGZIndex(tableGridX, tableGridY, 10), cursor: 'pointer', filter: isSelected ? 'url(#glow)' : 'none' }}
                onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId('war-table'); }}
            >
                {/* Table Base */}
                <path d={`M${tableWidth/2 - 20} ${tableHeight/2 + 20} L${tableWidth/2 + 20} ${tableHeight/2 + 20} L${tableWidth/2 + 30} ${tableHeight/2 + 60} L${tableWidth/2 - 30} ${tableHeight/2 + 60} Z`} fill="#09090b" />
                
                {/* Table Top */}
                <ellipse cx={tableWidth / 2} cy={tableHeight / 2} rx={tableWidth / 2} ry={tableHeight / 2} fill="#18181b" stroke={isSelected ? '#a855f7' : '#27272a'} strokeWidth="3" />
                <ellipse cx={tableWidth / 2} cy={tableHeight / 2} rx={tableWidth / 2 - 4} ry={tableHeight / 2 - 4} fill="none" stroke="#3f3f46" strokeWidth="1" opacity="0.5" />
                
                {/* Holographic Display Area */}
                <ellipse cx={tableWidth / 2} cy={tableHeight / 2} rx={tableWidth / 3} ry={tableHeight / 3} fill="#a855f7" opacity="0.1" />
                <ellipse cx={tableWidth / 2} cy={tableHeight / 2} rx={tableWidth / 3} ry={tableHeight / 3} fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                
                {/* Hologram Projector Core */}
                <circle cx={tableWidth / 2} cy={tableHeight / 2} r="12" fill="#09090b" stroke="#a855f7" strokeWidth="2" />
                <circle cx={tableWidth / 2} cy={tableHeight / 2} r="6" fill="#a855f7" className="animate-pulse" />
            </g>
        );

        // Chairs around table
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const cx = tableWidth / 2 + Math.cos(angle) * (tableWidth / 2 + 15);
            const cy = tableHeight / 2 + Math.sin(angle) * (tableHeight / 2 + 10);
            items.push(
                <g key={`war-chair-${i}`} transform={`translate(${tablePx - tableWidth / 2 + cx}, ${tablePy - tableHeight / 2 + cy})`}>
                    <circle cx="0" cy="0" r="10" fill="#18181b" stroke="#3f3f46" />
                    <path d="M-6 -4 Q0 -12 6 -4 L5 4 Q0 8 -5 4 Z" fill="#27272a" />
                </g>
            );
        }

        // Wall Screens
        items.push(
            <g key="war-screens" transform={`translate(${toIso(startX + 2, startY + 5).x}, ${toIso(startX + 2, startY + 5).y - 120})`}>
                <rect x="0" y="0" width="100" height="60" fill="#09090b" stroke="#3f3f46" strokeWidth="2" transform="skewY(-20)" />
                <rect x="5" y="5" width="90" height="50" fill="#a855f7" opacity="0.1" transform="skewY(-20)" />
                
                {/* Animated Data Lines */}
                <g transform="skewY(-20)">
                    {[...Array(5)].map((_, i) => (
                        <rect 
                            key={i} 
                            x="10" y={15 + i * 8} 
                            width={20 + Math.random() * 50} height="2" 
                            fill="#a855f7" 
                            opacity="0.4"
                        >
                            <animate attributeName="width" values="20;70;20" dur={`${2 + i}s`} repeatCount="indefinite" />
                        </rect>
                    ))}
                </g>
                
                <text x="50" y="35" textAnchor="middle" fill="#a855f7" fontSize="8" transform="skewY(-20)" opacity="0.5">STRATEGIC DATA</text>
            </g>
        );
    }

    if (room.id === 'WORKING_AREA') {
        // Floor grid lines
        for (let x = startX; x < startX + w; x += 4) {
            for (let y = startY; y < startY + h; y += 4) {
                const { x: px, y: py } = toIso(x, y);
                items.push(
                    <line key={`grid-h-${x}-${y}`} x1={px} y1={py + TILE_HEIGHT} x2={px + TILE_WIDTH} y2={py + TILE_HEIGHT * 2} stroke="#3f3f46" strokeWidth="0.5" opacity="0.1" />,
                    <line key={`grid-v-${x}-${y}`} x1={px} y1={py + TILE_HEIGHT} x2={px - TILE_WIDTH} y2={py + TILE_HEIGHT} stroke="#3f3f46" strokeWidth="0.5" opacity="0.1" />
                );
            }
        }

        // Workstations (Desks)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const deskGridX = startX + 4 + (col * 10);
                const deskGridY = startY + 4 + (row * 12);
                const { x: deskPx, y: deskPy } = toIso(deskGridX, deskGridY);
                const deskId = `desk-${row}-${col}`;
                const isSelected = selectedFurnitureId === deskId;
                
                // Find if an agent is at this desk
                const agentAtDesk = localAgents.find(a => {
                    const gx = Math.floor((a.currentPosition.x / 100) * 50);
                    const gy = Math.floor((a.currentPosition.y / 100) * 50);
                    return Math.abs(gx - deskGridX) < 3 && Math.abs(gy - deskGridY) < 3;
                });
                const isDeskActive = agentAtDesk?.status === 'WORKING';

                items.push(
                    <g 
                        key={deskId} 
                        transform={`translate(${deskPx}, ${deskPy})`} 
                        style={{ zIndex: getSVGZIndex(deskGridX, deskGridY, 5), cursor: 'pointer', filter: isSelected ? 'url(#glow)' : 'none' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(deskId); }}
                    >
                        {/* Activity Aura */}
                        {isDeskActive && (
                            <ellipse cx="0" cy="0" rx="60" ry="30" fill="#3b82f6" opacity="0.15">
                                <animate attributeName="opacity" values="0.05;0.2;0.05" dur="2s" repeatCount="indefinite" />
                            </ellipse>
                        )}
                        
                        {/* Desk Surface (Thicker) */}
                        <path d={getTilePath(0, 0)} fill="#18181b" stroke={isSelected ? '#3b82f6' : '#3f3f46'} strokeWidth="1" transform={`scale(0.8) translate(-${TILE_WIDTH * 0.4}, -${TILE_HEIGHT * 0.4})`} />
                        <path d={getTilePath(0, 0)} fill="#27272a" transform={`scale(0.8) translate(-${TILE_WIDTH * 0.4}, -${TILE_HEIGHT * 0.4 + 4})`} />
                        
                        {/* Dual Monitors */}
                        {/* Left Monitor */}
                        <g transform="translate(-15, -10)">
                           <rect x="-2" y="-15" width="4" height="15" fill="#3f3f46" transform="skewX(20)" />
                           <path d={`M-15 -25 L15 -25 L10 -5 L-20 -5 Z`} fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
                           <rect x="-12" y="-20" width="24" height="12" fill="#3b82f6" opacity="0.3" />
                        </g>
                        {/* Right Monitor */}
                        <g transform="translate(15, -5)">
                           <rect x="-2" y="-15" width="4" height="15" fill="#3f3f46" transform="skewX(-20)" />
                           <path d={`M-15 -25 L15 -25 L20 -5 L-10 -5 Z`} fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
                           <rect x="-10" y="-20" width="24" height="12" fill="#3b82f6" opacity="0.2" />
                        </g>
                        
                        {/* Ergonomic Chair */}
                        <g transform="translate(0, 25)">
                           <circle cx="0" cy="0" r="12" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                           <path d="M-8 -5 Q0 -15 8 -5 L6 5 Q0 10 -6 5 Z" fill="#27272a" />
                        </g>
                    </g>
                );
            }
        }

        // Printer / Copier
        items.push(
            <g key="printer" transform={`translate(${toIso(startX + 2, startY + h - 5).x}, ${toIso(startX + 2, startY + h - 5).y})`}>
                <rect x="-20" y="-30" width="40" height="30" fill="#27272a" stroke="#3f3f46" />
                <rect x="-15" y="-35" width="30" height="5" fill="#3f3f46" />
                <rect x="-12" y="-15" width="24" height="2" fill="#18181b" />
                <circle cx="12" cy="-25" r="2" fill="#22c55e" />
            </g>
        );

        // Plants
        for (let i = 0; i < 3; i++) {
            const px = startX + 2 + i * 20;
            const py = startY + 2;
            const pos = toIso(px, py);
            items.push(
                <g key={`plant-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <rect x="-5" y="-10" width="10" height="10" fill="#44403c" />
                    <path d="M-8 -20 Q0 -35 8 -20 Q0 -10 -8 -20" fill="#16a34a" opacity="0.8" />
                </g>
            );
        }

        // Server Racks
        const isWorkingInArea = localAgents.some(a => {
            const agentRoom = ROOMS.find(r => 
                a.currentPosition.x >= r.x && 
                a.currentPosition.x <= r.x + r.w &&
                a.currentPosition.y >= r.y && 
                a.currentPosition.y <= r.y + r.h
            );
            return agentRoom?.id === 'WORKING_AREA' && a.status === 'WORKING';
        });

        for (let i = 0; i < 4; i++) {
            const serverGridX = startX + w - 4;
            const serverGridY = startY + 4 + (i * 6);
            const { x: serverPx, y: serverPy } = toIso(serverGridX, serverGridY);
            const serverId = `server-${i}`;
            const isSelected = selectedFurnitureId === serverId;

            items.push(
                <g 
                    key={serverId} 
                    transform={`translate(${serverPx}, ${serverPy})`} 
                    style={{ zIndex: getSVGZIndex(serverGridX, serverGridY, 15), cursor: 'pointer', filter: isSelected ? 'url(#glow)' : 'none' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(serverId); }}
                >
                    {/* Base */}
                    <path d={getTilePath(0, 0)} fill="#18181b" stroke={isSelected ? '#3b82f6' : '#27272a'} strokeWidth="1" transform="scale(0.6) translate(-20, 0)" />
                    {/* Body */}
                    <rect x="-20" y="-80" width="40" height="80" fill="#0a0a0a" stroke={isSelected ? '#3b82f6' : '#27272a'} strokeWidth="1" />
                    {/* Lights */}
                    <circle cx="-15" cy="-70" r="3" fill="#22c55e" style={{ animation: `pulse ${isWorkingInArea ? '0.2s' : '1s'} infinite` }} />
                    <circle cx="-15" cy="-60" r="3" fill="#ef4444" style={{ animation: `pulse ${isWorkingInArea ? '0.3s' : '1.5s'} infinite reverse` }} />
                    <circle cx="-15" cy="-50" r="3" fill="#3b82f6" style={{ animation: `pulse ${isWorkingInArea ? '0.4s' : '2s'} infinite` }} />
                </g>
            );
        }
    }

    if (room.id === 'CEO_OFFICE') {
        // Executive Desk (Enhanced)
        const deskGridX = startX + Math.floor(w / 2);
        const deskGridY = startY + Math.floor(h / 2);
        const { x: deskPx, y: deskPy } = toIso(deskGridX, deskGridY);
        const deskId = 'ceo-desk';
        const isSelectedDesk = selectedFurnitureId === deskId;

        items.push(
            <g 
                key={deskId} 
                transform={`translate(${deskPx}, ${deskPy})`} 
                style={{ zIndex: getSVGZIndex(deskGridX, deskGridY, 10), cursor: 'pointer', filter: isSelectedDesk ? 'url(#glow)' : 'none' }}
                onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(deskId); }}
            >
                {/* Rug */}
                <ellipse cx="0" cy="20" rx="100" ry="50" fill="#7c2d12" opacity="0.1" />
                
                {/* Desk Base */}
                <path d={`M-30 20 L30 20 L30 50 L-30 50 Z`} fill="#18181b" />
                
                {/* Desk Surface (Wood) */}
                <path d={getTilePath(0, 0)} fill="#44403c" stroke={isSelectedDesk ? '#eab308' : '#52525b'} strokeWidth="2" transform="scale(1.4) translate(-30, -10)" />
                <path d={getTilePath(0, 0)} fill="#292524" transform="scale(1.4) translate(-30, -6)" />
                
                {/* Subtle reflection */}
                <path d={getTilePath(0, 0)} fill="white" opacity="0.05" transform="scale(1) translate(-20, -20)" />
                
                {/* Executive Monitor (Curved) */}
                <path d={`M-40 -45 Q0 -55 40 -45 L35 -15 Q0 -25 -35 -15 Z`} fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
                <path d={`M-35 -40 Q0 -50 35 -40 L30 -20 Q0 -30 -30 -20 Z`} fill="#eab308" opacity="0.15" />
                
                {/* Executive Chair */}
                <g transform="translate(0, 35)">
                   <circle cx="0" cy="0" r="16" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
                   <path d="M-12 -8 Q0 -25 12 -8 L10 8 Q0 15 -10 8 Z" fill="#18181b" />
                   {/* Armrests */}
                   <rect x="-16" y="-5" width="6" height="15" rx="3" fill="#27272a" transform="rotate(-15)" />
                   <rect x="10" y="-5" width="6" height="15" rx="3" fill="#27272a" transform="rotate(15)" />
                </g>
            </g>
        );

        // Bookshelf (CEO Office)
        items.push(
            <g key="ceo-bookshelf" transform={`translate(${toIso(startX + 5, startY + h - 5).x}, ${toIso(startX + 5, startY + h - 5).y})`}>
                <rect x="-40" y="-100" width="80" height="100" fill="#1c1917" stroke="#44403c" />
                {[...Array(4)].map((_, i) => (
                    <line key={i} x1="-40" y1={-20 - i * 20} x2="40" y2={-20 - i * 20} stroke="#44403c" strokeWidth="2" />
                ))}
                {/* Some books */}
                <rect x="-30" y="-18" width="8" height="15" fill="#7c2d12" />
                <rect x="-20" y="-18" width="6" height="15" fill="#1e3a8a" />
                <rect x="10" y="-38" width="10" height="15" fill="#065f46" />
            </g>
        );

        // Plant (Enhanced)
        const plantGridX = startX + w - 3;
        const plantGridY = startY + 3;
        const { x: plantPx, y: plantPy } = toIso(plantGridX, plantGridY);
        const plantId = 'ceo-plant';
        const isSelectedPlant = selectedFurnitureId === plantId;

        items.push(
            <g 
                key={plantId} 
                transform={`translate(${plantPx}, ${plantPy})`} 
                style={{ zIndex: getSVGZIndex(plantGridX, plantGridY, 15), cursor: 'pointer', filter: isSelectedPlant ? 'url(#glow)' : 'none' }}
                onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(plantId); }}
            >
                {/* Pot */}
                <ellipse cx="0" cy="15" rx="18" ry="10" fill="#292524" stroke={isSelectedPlant ? '#eab308' : '#44403c'} strokeWidth="2" />
                <rect x="-18" y="-10" width="36" height="25" fill="#292524" />
                <ellipse cx="0" cy="-10" rx="18" ry="10" fill="#1c1917" />
                
                {/* Leaves (More complex) */}
                <path d="M-10 -10 Q-40 -50 -5 -80 Q25 -50 10 -10 Z" fill="#15803d" />
                <path d="M10 -10 Q40 -50 5 -80 Q-25 -50 -10 -10 Z" fill="#16a34a" transform="rotate(45)" />
                <path d="M0 -10 Q-30 -40 -20 -60 Q0 -40 5 -10 Z" fill="#22c55e" transform="rotate(-30)" />
                <path d="M0 -10 Q30 -40 20 -60 Q0 -40 -5 -10 Z" fill="#15803d" transform="rotate(60)" />
            </g>
        );
    }

    if (room.id === 'LOUNGE') {
        // Modern Sofa
        const sofaGridX = startX + Math.floor(w / 2) - 2;
        const sofaGridY = startY + Math.floor(h / 2);
        const { x: sofaPx, y: sofaPy } = toIso(sofaGridX, sofaGridY);
        const sofaId = 'lounge-sofa';
        const isSelectedSofa = selectedFurnitureId === sofaId;

        items.push(
            <g 
                key={sofaId} 
                transform={`translate(${sofaPx}, ${sofaPy})`} 
                style={{ zIndex: getSVGZIndex(sofaGridX, sofaGridY, 10), cursor: 'pointer', filter: isSelectedSofa ? 'url(#glow)' : 'none' }}
                onClick={(e) => { e.stopPropagation(); setSelectedFurnitureId(sofaId); }}
            >
                {/* Sofa Base */}
                <path d={`M-60 0 L60 0 L40 30 L-40 30 Z`} fill="#27272a" stroke={isSelectedSofa ? '#22c55e' : '#3f3f46'} strokeWidth="2" />
                {/* Backrest */}
                <path d={`M-60 0 L60 0 L50 -30 L-50 -30 Z`} fill="#18181b" />
                {/* Cushions */}
                <rect x="-35" y="5" width="30" height="20" rx="5" fill="#3f3f46" transform="skewX(-20)" />
                <rect x="5" y="5" width="30" height="20" rx="5" fill="#3f3f46" transform="skewX(-20)" />
            </g>
        );

        // Coffee Table
        items.push(
            <g 
                key="lounge-table" 
                transform={`translate(${sofaPx}, ${sofaPy + 40})`} 
                style={{ zIndex: getSVGZIndex(sofaGridX, sofaGridY + 2, 10) }}
            >
                <ellipse cx="0" cy="0" rx="25" ry="12" fill="#09090b" stroke="#27272a" strokeWidth="2" />
                <ellipse cx="0" cy="-5" rx="25" ry="12" fill="url(#glassGradient)" opacity="0.6" />
                {/* Small plant on table */}
                <circle cx="0" cy="-10" r="4" fill="#16a34a" />
            </g>
        );

        // Water Cooler (Lounge)
        items.push(
            <g key="water-cooler" transform={`translate(${toIso(startX + w - 5, startY + 5).x}, ${toIso(startX + w - 5, startY + 5).y})`}>
                <rect x="-15" y="-40" width="30" height="40" fill="#27272a" stroke="#3f3f46" />
                <path d="M-12 -40 Q0 -80 12 -40 Z" fill="#3b82f6" opacity="0.4" />
                <rect x="-5" y="-20" width="10" height="5" fill="#3f3f46" />
                {/* Cup dispenser */}
                <rect x="10" y="-35" width="4" height="20" fill="#3f3f46" />
            </g>
        );
    }

    return items;
  };

  return (
    <div 
      className="w-full h-full bg-[#050505] overflow-hidden relative cursor-move select-none"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* TOP HUD INFO */}
      <div className="absolute top-8 left-8 z-50 flex items-center gap-6 pointer-events-none">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Operational HQ</span>
          </div>
          <h1 className="text-white text-4xl font-light tracking-tighter">
            Physical<span className="text-blue-500">.</span>
          </h1>
        </div>
        <div className="h-12 w-[1px] bg-white/10 mx-2"></div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">System Latency</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-mono text-xs">12ms</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-emerald-500/40' : 'bg-zinc-800'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-50 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-700">
         <button 
            onClick={() => handleRoomFocus(null)}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${!focusedRoomId ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
         >
            <Building2 size={14} />
            מבט גלובלי
         </button>
         <div className="w-[1px] h-8 bg-white/10 self-center"></div>
         {ROOMS.map(room => (
            <button 
               key={room.id}
               onClick={() => handleRoomFocus(room.id)}
               className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${focusedRoomId === room.id ? 'bg-zinc-100 text-black shadow-xl scale-105' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
               {room.name}
            </button>
         ))}
      </div>

      {/* ROOM HUD OVERLAY */}
      {focusedRoomId && (
        <div className="absolute top-8 right-8 z-50 pointer-events-none animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 p-6 rounded-2xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] min-w-[320px] relative overflow-hidden">
            {/* Decorative tech lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-mono text-blue-400 uppercase tracking-[0.3em]">Sector Active</span>
                </div>
                <h2 className="text-white text-2xl font-light tracking-tight">
                  {ROOMS.find(r => r.id === focusedRoomId)?.name}
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 relative">
                <Activity size={18} className="animate-pulse" />
                <div className="absolute inset-0 border border-blue-500/30 rounded-xl animate-ping opacity-20"></div>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Personnel</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-mono text-3xl font-light">
                    {localAgents.filter(a => {
                      const r = ROOMS.find(room => 
                        a.currentPosition.x >= room.x && 
                        a.currentPosition.x <= room.x + room.w &&
                        a.currentPosition.y >= room.y && 
                        a.currentPosition.y <= room.y + room.h
                      );
                      return r?.id === focusedRoomId;
                    }).length}
                  </span>
                  <span className="text-zinc-600 text-[9px] uppercase font-mono">Units</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Status</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest">Optimized</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">System Load</span>
                  <span className="text-[9px] font-mono text-blue-400">{(Math.random() * 40 + 20).toFixed(1)}%</span>
               </div>
               <div className="flex gap-1 h-1.5">
                  {[...Array(16)].map((_, i) => (
                     <div key={i} className={`flex-1 rounded-sm ${i < 10 ? 'bg-blue-500/60 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-zinc-800'}`}></div>
                  ))}
               </div>
            </div>

            {/* Active Personnel List */}
            <div className="flex flex-col gap-3 mt-2">
               <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Active Personnel</span>
               <div className="flex flex-col gap-2">
                  {localAgents.filter(a => {
                    const r = ROOMS.find(room => 
                      a.currentPosition.x >= room.x && 
                      a.currentPosition.x <= room.x + room.w &&
                      a.currentPosition.y >= room.y && 
                      a.currentPosition.y <= room.y + room.h
                    );
                    return r?.id === focusedRoomId;
                  }).map(agent => (
                    <div key={agent.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <img src={agent.avatar} className="w-6 h-6 rounded-md border border-white/10" alt="" />
                        <div className="flex flex-col">
                          <span className="text-white text-[10px] font-bold">{agent.name}</span>
                          <span className="text-zinc-500 text-[8px] uppercase">{agent.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${agent.status === 'WORKING' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        <span className="text-[8px] font-mono text-zinc-400 uppercase">{agent.status}</span>
                      </div>
                    </div>
                  ))}
                  {localAgents.filter(a => {
                    const r = ROOMS.find(room => 
                      a.currentPosition.x >= room.x && 
                      a.currentPosition.x <= room.x + room.w &&
                      a.currentPosition.y >= room.y && 
                      a.currentPosition.y <= room.y + room.h
                    );
                    return r?.id === focusedRoomId;
                  }).length === 0 && (
                    <div className="text-center py-4 border border-dashed border-white/5 rounded-lg">
                      <span className="text-[9px] font-mono text-zinc-600 uppercase">No agents present</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG CANVAS */}
      <svg 
         className="absolute top-0 left-0 w-full h-full bg-[#050505]"
         viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
         preserveAspectRatio="xMidYMid slice"
         style={{ transition: 'viewBox 1.2s cubic-bezier(0.2, 0, 0.2, 1)' }}
      >
         <g 
            style={{
               transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
               transformOrigin: '0 0',
               transition: isDragging.current ? 'none' : 'transform 1.2s cubic-bezier(0.2, 0, 0.2, 1)',
            }}
         >
            <defs>
            {/* Technical Grid Pattern */}
            <pattern id="globalGrid" patternUnits="userSpaceOnUse" width="120" height="60">
               <path d="M 120 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" opacity="0.03" />
            </pattern>
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
               <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <filter id="blurShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                <feOffset in="blur" dx="0" dy="5" result="offsetBlur" />
                <feMerge>
                    <feMergeNode in="offsetBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            {/* Room-specific radial gradients for floor lighting */}
            <radialGradient id="ceoLight" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="rgba(255,255,200,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,200,0)" />
            </radialGradient>
            <radialGradient id="warRoomLight" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="rgba(100,100,255,0.1)" />
                <stop offset="100%" stopColor="rgba(100,100,255,0)" />
            </radialGradient>
            <radialGradient id="loungeLight" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="rgba(200,255,200,0.08)" />
                <stop offset="100%" stopColor="rgba(200,255,200,0)" />
            </radialGradient>
            <radialGradient id="workingAreaLight" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Wood Pattern for CEO Office */}
            <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="20" height="40" patternTransform="matrix(1, 0.5, -1, 0.5, 0, 0)">
                <rect width="20" height="40" fill="#292524" />
                <path d="M0 0 L0 40" stroke="#44403c" strokeWidth="2" />
                <path d="M0 20 L20 20" stroke="#44403c" strokeWidth="1" opacity="0.5" />
            </pattern>
            {/* Carpet Pattern for War Room */}
            <pattern id="carpetPattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="matrix(1, 0.5, -1, 0.5, 0, 0)">
                <rect width="20" height="20" fill="#1e1b4b" />
                <path d="M0 0 L20 0 L20 20 L0 20 Z" stroke="#312e81" strokeWidth="1" opacity="0.3" fill="none" />
            </pattern>
            {/* Concrete Pattern for Lounge Walls */}
            <pattern id="concretePattern" patternUnits="userSpaceOnUse" width="30" height="30" patternTransform="matrix(1, 0.5, -1, 0.5, 0, 0)">
                <rect width="30" height="30" fill="#18181b" />
                <path d="M0 0 L30 0 L30 30 L0 30 Z" stroke="#27272a" strokeWidth="1" fill="none" />
                <circle cx="5" cy="5" r="1" fill="#3f3f46" opacity="0.5" />
                <circle cx="25" cy="20" r="1.5" fill="#3f3f46" opacity="0.3" />
            </pattern>
            {/* Tile Pattern for Working Area */}
            <pattern id="tilePattern" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="matrix(1, 0.5, -1, 0.5, 0, 0)">
                <rect width="40" height="40" fill="#09090b" />
                <path d="M0 0 L40 0 L40 40 L0 40 Z" stroke="#18181b" strokeWidth="2" fill="none" />
                <path d="M20 0 L20 40 M0 20 L40 20" stroke="#18181b" strokeWidth="1" fill="none" />
            </pattern>
            {/* Glow Filter for Selected Elements */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.23  0 0 0 0 0.51  0 0 0 0 0.96  0 0 0 1 0" result="glow" />
                <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            {/* Vignette Filter */}
            <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
            </radialGradient>
            {/* Scanline Pattern */}
            <pattern id="scanline" patternUnits="userSpaceOnUse" width="100%" height="4">
                <rect width="100%" height="1" fill="white" opacity="0.02" />
            </pattern>
            {/* Thought Bubble for Agent Status */}
            <symbol id="thoughtBubble" viewBox="0 0 100 50">
                <path d="M10 20 Q0 0 20 0 H80 Q100 0 100 20 V30 Q100 50 80 50 H30 L10 45 Z" fill="white" stroke="#3f3f46" strokeWidth="2" />
                <circle cx="15" cy="45" r="5" fill="white" stroke="#3f3f46" strokeWidth="2" />
                <circle cx="5" cy="50" r="2" fill="white" stroke="#3f3f46" strokeWidth="1" />
            </symbol>
         </defs>

         {/* Background Grid */}
         <rect x="-5000" y="-3000" width="10000" height="6000" fill="url(#globalGrid)" />
         
         {/* DIGITAL SKYLINE (Background depth) */}
         <g opacity="0.12" style={{ pointerEvents: 'none' }}>
            {[...Array(25)].map((_, i) => {
               const h = 800 + Math.random() * 800;
               const w = 120 + Math.random() * 100;
               const x = -4000 + i * 350;
               const y = -1500 - (h - 1000);
               return (
                  <g key={`building-${i}`}>
                     <rect 
                        x={x} y={y} 
                        width={w} height={h} 
                        fill="#0f172a" 
                        stroke="#1e293b"
                        strokeWidth="1"
                     />
                     {/* Building Windows */}
                     {[...Array(8)].map((_, row) => (
                        <g key={row} transform={`translate(${x + 10}, ${y + 50 + row * 80})`}>
                           {[...Array(4)].map((_, col) => (
                              <rect 
                                 key={col} 
                                 x={col * (w/5)} y="0" 
                                 width="4" height="4" 
                                 fill="#3b82f6" 
                                 opacity={Math.random() > 0.7 ? 0.4 : 0.05} 
                              />
                           ))}
                        </g>
                     ))}
                     <animate attributeName="opacity" values="0.1;0.2;0.1" dur={`${6 + i * 0.3}s`} repeatCount="indefinite" />
                  </g>
               );
            })}
            <rect x="-4000" y="-2000" width="8000" height="1500" fill="url(#vignetteGradient)" opacity="0.6" />
         </g>
         
         {/* Scanline Overlay */}
         <rect x="-5000" y="-3000" width="10000" height="6000" fill="url(#scanline)" style={{ pointerEvents: 'none', opacity: 0.4 }} />

         {/* OFFICE OUTER SHELL (Extended Foundation) */}
         <g transform="translate(0, 30)">
            <path 
                d={`M${toIso(-12,-12).x} ${toIso(-12,-12).y} L${toIso(62,-12).x + TILE_WIDTH} ${toIso(62,-12).y + TILE_HEIGHT} L${toIso(62,62).x} ${toIso(62,62).y + TILE_HEIGHT * 2} L${toIso(-12,62).x - TILE_WIDTH} ${toIso(-12,62).y + TILE_HEIGHT} Z`} 
                fill="#020203" 
                stroke="#0f172a" 
                strokeWidth="4"
            />
            <path 
                d={`M${toIso(-10,-10).x} ${toIso(-10,-10).y} L${toIso(60,-10).x + TILE_WIDTH} ${toIso(60,-10).y + TILE_HEIGHT} L${toIso(60,60).x} ${toIso(60,60).y + TILE_HEIGHT * 2} L${toIso(-10,60).x - TILE_WIDTH} ${toIso(-10,60).y + TILE_HEIGHT} Z`} 
                fill="#050507" 
                stroke="#111114" 
                strokeWidth="2"
            />
         </g>
         
         {/* MAIN OFFICE BASE */}
         <path 
            d={`M${toIso(0,0).x} ${toIso(0,0).y} L${toIso(50,0).x + TILE_WIDTH} ${toIso(50,0).y + TILE_HEIGHT} L${toIso(50,50).x} ${toIso(50,50).y + TILE_HEIGHT * 2} L${toIso(0,50).x - TILE_WIDTH} ${toIso(0,50).y + TILE_HEIGHT} Z`} 
            fill="#0a0a0c" 
            stroke="#18181b" 
            strokeWidth="2"
            transform="translate(0, 5)"
         />

         {/* OUTER GLASS PERIMETER (The "Building" walls) */}
         <g opacity="0.2" style={{ pointerEvents: 'none' }}>
            {/* Back Left Outer Wall */}
            <path 
               d={`M${toIso(0,0).x} ${toIso(0,0).y} L${toIso(0,50).x} ${toIso(0,50).y} L${toIso(0,50).x} ${toIso(0,50).y - 600} L${toIso(0,0).x} ${toIso(0,0).y - 600} Z`} 
               fill="url(#glassGradient)" 
               stroke="#3f3f46" 
               strokeWidth="2"
            />
            {/* Back Right Outer Wall */}
            <path 
               d={`M${toIso(0,0).x} ${toIso(0,0).y} L${toIso(50,0).x} ${toIso(50,0).y} L${toIso(50,0).x} ${toIso(50,0).y - 600} L${toIso(0,0).x} ${toIso(0,0).y - 600} Z`} 
               fill="url(#glassGradient)" 
               stroke="#3f3f46" 
               strokeWidth="2"
            />
            {/* Window Frames */}
            {[...Array(10)].map((_, i) => (
               <line 
                  key={`v-frame-${i}`}
                  x1={toIso(i * 5, 0).x} y1={toIso(i * 5, 0).y}
                  x2={toIso(i * 5, 0).x} y2={toIso(i * 5, 0).y - 600}
                  stroke="#27272a" strokeWidth="1"
               />
            ))}
         </g>

         {/* STRUCTURAL PILLARS (Adding architectural depth) */}
         {[
            { x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 },
            { x: 25, y: 0 }, { x: 50, y: 25 }, { x: 25, y: 50 }, { x: 0, y: 25 }
         ].map((p, i) => {
            const pos = toIso(p.x, p.y);
            return (
               <g key={`pillar-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect x="-4" y="-200" width="8" height="200" fill="#18181b" stroke="#27272a" strokeWidth="1" opacity="0.6" />
                  <rect x="-2" y="-200" width="4" height="200" fill="#3f3f46" opacity="0.2" />
               </g>
            );
         })}

         {/* 1. ROOMS (Floors & Walls) */}
         {ROOMS.map(renderRoom)}

         {/* ATMOSPHERIC PARTICLES (Dust/Data floating in air) */}
         {[...Array(40)].map((_, i) => (
            <circle 
               key={`particle-${i}`} 
               cx={Math.random() * 4000 - 2000} 
               cy={Math.random() * 3000 - 1500} 
               r={Math.random() * 1.5} 
               fill="white" 
               opacity={Math.random() * 0.3}
            >
               <animate attributeName="opacity" values="0;0.3;0" dur={`${3 + Math.random() * 5}s`} repeatCount="indefinite" />
               <animate attributeName="cy" values={`${Math.random() * 3000 - 1500};${Math.random() * 3000 - 1600}`} dur={`${10 + Math.random() * 20}s`} repeatCount="indefinite" />
            </circle>
         ))}

         {/* WORLD-SPACE ROOM LABELS (Visible in Global View) */}
         {ROOMS.map(room => {
            const isoX = (room.x + room.w / 2) / 100 * 50;
            const isoY = (room.y + room.h / 2) / 100 * 50;
            const pos = toIso(isoX, isoY);
            return (
               <g 
                 key={`label-${room.id}`} 
                 transform={`translate(${pos.x}, ${pos.y - 120})`} 
                 className="pointer-events-none"
                 style={{ 
                   opacity: focusedRoomId ? 0 : 1,
                   transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                 }}
               >
                  <rect x="-80" y="-25" width="160" height="40" rx="20" fill="black" opacity="0.6" />
                  <text 
                     textAnchor="middle" 
                     className="fill-white font-black uppercase tracking-[0.3em] text-[14px]"
                     style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
                  >
                     {room.name}
                  </text>
                  <line x1="0" y1="15" x2="0" y2="40" stroke="white" strokeWidth="0.5" opacity="0.3" />
               </g>
            );
         })}

         {/* 2. AGENTS */}
         {localAgents.map(agent => {
            const gridX = Math.floor((agent.currentPosition.x / 100) * 50);
            const gridY = Math.floor((agent.currentPosition.y / 100) * 50);
            let { x, y } = toIso(gridX, gridY);
            
            // Adjust Y position if agent is working to simulate sitting
            if (agent.status === 'WORKING') {
                y += TILE_HEIGHT * 0.5; // Move down to 'sit' behind a desk
            }

            const agentRoom = ROOMS.find(r => 
               agent.currentPosition.x >= r.x && 
               agent.currentPosition.x <= r.x + r.w &&
               agent.currentPosition.y >= r.y && 
               agent.currentPosition.y <= r.y + r.h
            );
            const isAgentDimmed = focusedRoomId && agentRoom?.id !== focusedRoomId;

            return (
               <g 
                  key={agent.id} 
                  transform={`translate(${x}, ${y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAgent(agent.id);
                    setActiveMenuAgentId(agent.id);
                  }}
                  style={{
                     cursor: 'pointer',
                     zIndex: (gridX + gridY) * 10 + 50, 
                     filter: selectedAgentId === agent.id ? 'url(#glow)' : 'none',
                     opacity: isAgentDimmed ? 0.1 : 1,
                     transition: 'filter 0.2s ease-out, opacity 0.5s ease-in-out',
                     animation: agent.targetPosition ? 'walkCycle 1s infinite alternate ease-in-out' : 'none'
                  }} 
                  className="group"
               >
                  {/* Agent Base Halo */}
                  <ellipse 
                    cx="0" cy={TILE_HEIGHT * 0.8} 
                    rx={TILE_WIDTH * 0.8} ry={TILE_HEIGHT * 0.4} 
                    fill={agent.status === 'WORKING' ? '#22c55e' : '#3b82f6'} 
                    opacity="0.2" 
                    className="animate-pulse"
                  />
                  
                  {/* Shadow */}
                  <ellipse 
                    cx="0" cy={TILE_HEIGHT * 0.8} 
                    rx={TILE_WIDTH * 0.4} ry={TILE_HEIGHT * 0.2} 
                    fill="black" 
                    opacity="0.6" 
                    filter="blur(4px)" 
                  />
                  
                  {/* Agent Body */}
                  <rect x="-15" y="-10" width="30" height="30" rx="5" ry="5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />

                  {/* Avatar Head */}
                  <g style={{ animation: agent.status === 'IDLE' ? 'idleBob 3s infinite ease-in-out' : 'none' }}>
                    <circle cx="0" cy={-20} r="20" fill="#18181b" stroke={agent.status === 'WORKING' ? '#22c55e' : '#a855f7'} strokeWidth="3" />
                    <image href={agent.avatar} x="-20" y="-40" width="40" height="40" clipPath="circle(20px at 20px 20px)" />
                    
                    {/* Status Mini-Icon */}
                    {agent.status === 'WORKING' && (
                        <g transform="translate(15, -35)">
                            <circle r="8" fill="#22c55e" stroke="#050505" strokeWidth="2" />
                            <text y="3" textAnchor="middle" fontSize="8" fill="white">⚙️</text>
                        </g>
                    )}
                  </g>

                  {/* Status Indicator / Thought Bubble */}
                  {(agent.status === 'THINKING' || agent.status === 'WORKING') && (
                    <use 
                      href="#thoughtBubble" 
                      x="-50" y="-90" 
                      width="100" height="50" 
                      transform="scale(0.3)" 
                      style={{ transformOrigin: 'center', animation: 'bubblePop 0.5s ease-out forwards' }}
                    />
                  )}
                  {agent.status === 'THINKING' && (
                    <text x="0" y="-75" textAnchor="middle" fill="#3f3f46" fontSize="18" className="animate-pulse">
                        ...
                    </text>
                  )}
                  {agent.status === 'WORKING' && (
                    <text x="0" y="-75" textAnchor="middle" fill="#3f3f46" fontSize="18">
                        ⚙️
                    </text>
                  )}

                  {/* Name Tag (on hover) */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" transform="translate(0, -60)">
                      <rect x="-40" y="-15" width="80" height="30" rx="5" ry="5" fill="#18181b" stroke="#27272a" strokeWidth="1" />
                      <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{agent.name}</text>
                      <text x="0" y="12" textAnchor="middle" fill="#a1a1aa" fontSize="8">{agent.role}</text>
                  </g>
               </g>
            );
         })}

         {/* AGENT ACTION MENUS */}
         {activeMenuAgentId && localAgents.find(a => a.id === activeMenuAgentId) && (() => {
            const agent = localAgents.find(a => a.id === activeMenuAgentId)!;
            const gridX = Math.floor((agent.currentPosition.x / 100) * 50);
            const gridY = Math.floor((agent.currentPosition.y / 100) * 50);
            const { x, y } = toIso(gridX, gridY);

            return (
               <foreignObject 
                 key="agent-menu"
                 x={x - 60} y={y - 160} 
                 width="120" height="100"
                 style={{ zIndex: 1000 }}
               >
                  <div className="flex flex-col gap-1 bg-zinc-900/95 backdrop-blur border border-white/10 rounded-lg p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                     <button 
                       className="w-full text-right px-2 py-1.5 text-[10px] font-bold text-white hover:bg-blue-600 rounded transition-colors flex items-center justify-between"
                       onClick={(e) => { e.stopPropagation(); console.log('Show details for', agent.name); }}
                     >
                       <span>הצג פרטים</span>
                       <span className="opacity-50">👤</span>
                     </button>
                     <button 
                       className="w-full text-right px-2 py-1.5 text-[10px] font-bold text-white hover:bg-blue-600 rounded transition-colors flex items-center justify-between"
                       onClick={(e) => { e.stopPropagation(); console.log('Send message to', agent.name); }}
                     >
                       <span>שלח הודעה</span>
                       <span className="opacity-50">💬</span>
                     </button>
                     <div className="h-[1px] bg-white/5 my-0.5"></div>
                     <button 
                       className="w-full text-right px-2 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 rounded transition-colors flex items-center justify-between"
                       onClick={(e) => { e.stopPropagation(); setActiveMenuAgentId(null); }}
                     >
                       <span>סגור</span>
                       <span className="opacity-50">✕</span>
                     </button>
                  </div>
               </foreignObject>
            );
         })()}
         
         {/* VIGNETTE OVERLAY */}
         <rect x="-5000" y="-3000" width="10000" height="6000" fill="url(#vignetteGradient)" style={{ pointerEvents: 'none' }} />
         </g>
      </svg>

      {/* TACTICAL RADAR (Mini-map) */}
      <div className="absolute bottom-8 right-8 w-56 h-56 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden z-50 shadow-2xl group pointer-events-auto">
         <div className="p-3 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
               <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-black">Tactical Radar</span>
            </div>
            <span className="text-[8px] font-mono text-zinc-600">v4.2.0</span>
         </div>
         <svg viewBox="0 0 100 100" className="w-full h-full p-4 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Grid Lines for Radar */}
            {[...Array(5)].map((_, i) => (
               <line key={`grid-h-${i}`} x1="0" y1={i * 25} x2="100" y2={i * 25} stroke="white" strokeWidth="0.1" opacity="0.1" />
            ))}
            {[...Array(5)].map((_, i) => (
               <line key={`grid-v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="100" stroke="white" strokeWidth="0.1" opacity="0.1" />
            ))}
            <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.1" opacity="0.05" />
            
            {ROOMS.map(room => (
               <rect 
                  key={`mini-${room.id}`}
                  x={room.x} y={room.y} width={room.w} height={room.h}
                  fill={room.id === focusedRoomId ? 'rgba(59,130,246,0.2)' : 'transparent'}
                  stroke="white" strokeWidth="0.3" opacity={room.id === focusedRoomId ? 0.4 : 0.1}
                  style={{ transition: 'all 0.5s ease' }}
               />
            ))}
            
            {/* Agent Dots on Radar */}
            {localAgents.map(agent => (
               <circle 
                  key={`radar-agent-${agent.id}`}
                  cx={agent.currentPosition.x}
                  cy={agent.currentPosition.y}
                  r="1.8"
                  fill={agent.status === 'WORKING' ? '#22c55e' : agent.status === 'THINKING' ? '#a855f7' : '#3b82f6'}
                  className={agent.status !== 'IDLE' ? 'animate-pulse' : ''}
               />
            ))}

            {/* Viewport Indicator */}
            <rect 
               x={50 - (50 / zoom) / 2 + (pan.x / 120)} 
               y={50 - (50 / zoom) / 2 + (pan.y / 100)} 
               width={100 / zoom} height={100 / zoom}
               fill="none" stroke="#3b82f6" strokeWidth="0.8"
               strokeDasharray="2 2"
               style={{ transition: 'all 0.4s cubic-bezier(0.2, 0, 0.2, 1)' }}
            />
         </svg>
         {/* Radar Stats Overlay */}
         <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none">
            <div className="flex flex-col">
               <span className="text-[7px] text-zinc-600 uppercase font-mono">Zoom</span>
               <span className="text-[9px] text-zinc-400 font-mono">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[7px] text-zinc-600 uppercase font-mono">Active</span>
               <span className="text-[9px] text-zinc-400 font-mono">{localAgents.filter(a => a.status !== 'IDLE').length}</span>
            </div>
         </div>
      </div>

      {/* FURNITURE INFO PANEL */}
      {selectedFurnitureId && (
        <div className="absolute bottom-8 left-8 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl p-4 text-white w-64 z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">מידע על פריט</h3>
            <button onClick={() => setSelectedFurnitureId(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <p className="text-sm text-zinc-300">
            {selectedFurnitureId === 'war-table' && 'שולחן ישיבות ראשי. משמש לדיונים אסטרטגיים וסיעור מוחות.'}
            {selectedFurnitureId.startsWith('desk-') && 'עמדת עבודה אישית. מצוידת במחשב חזק ושני מסכים.'}
            {selectedFurnitureId.startsWith('server-') && 'ארון שרתים. מאחסן את מודלי השפה ונתוני הסוכנות.'}
            {selectedFurnitureId === 'ceo-desk' && 'שולחן מנכ"ל. עמדת הניהול הראשית של הסוכנות.'}
            {selectedFurnitureId === 'ceo-plant' && 'עציץ דקורטיבי. מוסיף קצת צבע וחיים למשרד.'}
          </p>
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-50">
         <div className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl p-2 flex flex-col gap-2">
            <button className="w-8 h-8 bg-zinc-800 rounded-lg text-white flex items-center justify-center hover:bg-zinc-700 transition-colors" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
            <button className="w-8 h-8 bg-zinc-800 rounded-lg text-white flex items-center justify-center hover:bg-zinc-700 transition-colors" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>-</button>
         </div>
         {selectedAgentId && (
            <button 
               className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
               onClick={handleMoveAgent}
            >
               הזז סוכן
            </button>
         )}
      </div>
    </div>
  );
};




