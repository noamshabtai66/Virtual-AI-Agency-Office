export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  currentPosition: { x: number; y: number; };
  targetPosition?: { x: number; y: number; }; // Optional target position for movement
  speed?: number; // Movement speed (e.g., pixels per second)
  status: 'THINKING' | 'WORKING' | 'IDLE';
}
