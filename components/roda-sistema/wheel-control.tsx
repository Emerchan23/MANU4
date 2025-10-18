'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCw, RotateCcw, Activity } from 'lucide-react';
import { WheelState, RotationDirection, RotationSpeed } from '@/types/roda-sistema';
import { formatDateTimeBR, formatTimeBR } from '@/lib/date-utils';

interface WheelControlProps {
  wheelId?: string;
  onStateChange?: (state: WheelState) => void;
}

export default function WheelControl({ wheelId = 'wheel-1', onStateChange }: WheelControlProps) {
  const [wheelState, setWheelState] = useState<WheelState>({
    id: wheelId,
    name: 'Sistema de Rotação Principal',
    direction: 'stopped',
    speed: 'medium',
    customSpeed: 60,
    angle: 0,
    isActive: false,
    lastUpdated: new Date(),
  });

  const [currentRPM, setCurrentRPM] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Speed presets in RPM
  const speedPresets: Record<'slow' | 'medium' | 'fast', number> = {
    slow: 30,
    medium: 60,
    fast: 120,
  };

  // Calculate target RPM based on speed setting
  const getTargetRPM = () => {
    if (wheelState.speed === 'custom') {
      return wheelState.customSpeed || 60;
    }
    return speedPresets[wheelState.speed as keyof typeof speedPresets] || 60;
  };

  // Animation loop for wheel rotation
  useEffect(() => {
    if (!wheelState.isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      // Smooth acceleration/deceleration
      const target = getTargetRPM();
      const acceleration = 30; // RPM per second
      let newRPM = currentRPM;

      if (Math.abs(target - currentRPM) > 0.1) {
        if (currentRPM < target) {
          newRPM = Math.min(currentRPM + acceleration * deltaTime, target);
        } else {
          newRPM = Math.max(currentRPM - acceleration * deltaTime, target);
        }
        setCurrentRPM(newRPM);
      }

      // Calculate rotation angle
      const degreesPerSecond = (newRPM * 360) / 60;
      const angleDelta = degreesPerSecond * deltaTime;
      
      setWheelState((prev: WheelState) => {
        const newAngle = wheelState.direction === 'clockwise' 
          ? (prev.angle + angleDelta) % 360
          : (prev.angle - angleDelta + 360) % 360;
        
        const newState = {
          ...prev,
          angle: newAngle,
          lastUpdated: new Date(),
        };
        
        if (onStateChange) {
          onStateChange(newState);
        }
        
        return newState;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wheelState.isActive, wheelState.direction, currentRPM, wheelState.speed, wheelState.customSpeed, onStateChange]);

  const handleStart = () => {
    setWheelState((prev: WheelState) => ({
      ...prev,
      isActive: true,
      direction: prev.direction === 'stopped' ? 'clockwise' : prev.direction,
      lastUpdated: new Date(),
    }));
    lastTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setWheelState((prev: WheelState) => ({
      ...prev,
      isActive: false,
      lastUpdated: new Date(),
    }));
    setCurrentRPM(0);
  };

  const handleDirectionChange = (direction: RotationDirection) => {
    if (direction === 'stopped') {
      handleStop();
    } else {
      setWheelState((prev: WheelState) => ({
        ...prev,
        direction,
        lastUpdated: new Date(),
      }));
    }
  };

  const handleSpeedChange = (speed: RotationSpeed) => {
    setWheelState((prev: WheelState) => ({
      ...prev,
      speed,
      lastUpdated: new Date(),
    }));
  };

  const handleCustomSpeedChange = (value: string) => {
    const speed = parseInt(value) || 0;
    setWheelState((prev: WheelState) => ({
      ...prev,
      customSpeed: Math.max(0, Math.min(speed, 300)),
      speed: 'custom',
      lastUpdated: new Date(),
    }));
  };

  const getStatusColor = () => {
    if (!wheelState.isActive) return 'bg-gray-500';
    if (currentRPM < 30) return 'bg-green-500';
    if (currentRPM < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDirectionIcon = () => {
    if (wheelState.direction === 'clockwise') return <RotateCw className="h-4 w-4" />;
    if (wheelState.direction === 'counterclockwise') return <RotateCcw className="h-4 w-4" />;
    return <Pause className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Wheel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{wheelState.name}</span>
            <Badge variant={wheelState.isActive ? 'default' : 'secondary'}>
              {wheelState.isActive ? 'ATIVO' : 'PARADO'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {/* Wheel Visual */}
            <div className="relative w-64 h-64">
              <svg
                width="256"
                height="256"
                viewBox="0 0 256 256"
                className="drop-shadow-lg"
              >
                {/* Outer circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                />
                
                {/* Inner circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="20"
                  fill="#3b82f6"
                />
                
                {/* Rotating spokes */}
                <g transform={`rotate(${wheelState.angle} 128 128)`}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <line
                      key={i}
                      x1="128"
                      y1="128"
                      x2={128 + 100 * Math.cos((angle * Math.PI) / 180)}
                      y2={128 + 100 * Math.sin((angle * Math.PI) / 180)}
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ))}
                  
                  {/* Direction indicator */}
                  <circle
                    cx={128 + 90 * Math.cos(0)}
                    cy={128 + 90 * Math.sin(0)}
                    r="8"
                    fill="#ef4444"
                  />
                </g>
              </svg>
              
              {/* Status indicator */}
              <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
            </div>

            {/* RPM Display */}
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {currentRPM.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                RPM (Rotações por Minuto)
              </div>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-3 gap-4 w-full text-center">
              <div>
                <div className="text-xs text-gray-500">Direção</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getDirectionIcon()}
                  <span className="text-sm font-medium capitalize">
                    {wheelState.direction === 'clockwise' ? 'Horário' : 
                     wheelState.direction === 'counterclockwise' ? 'Anti-horário' : 'Parado'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Velocidade</div>
                <div className="text-sm font-medium mt-1 capitalize">
                  {wheelState.speed === 'custom' ? `${wheelState.customSpeed} RPM` : wheelState.speed}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ângulo</div>
                <div className="text-sm font-medium mt-1">
                  {wheelState.angle.toFixed(1)}°
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start/Stop Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={wheelState.isActive}
              className="flex-1"
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
            <Button
              onClick={handleStop}
              disabled={!wheelState.isActive}
              className="flex-1"
              variant="destructive"
            >
              <Pause className="h-4 w-4 mr-2" />
              Parar
            </Button>
          </div>

          {/* Direction Controls */}
          <div>
            <Label>Direção de Rotação</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                onClick={() => handleDirectionChange('clockwise')}
                variant={wheelState.direction === 'clockwise' ? 'default' : 'outline'}
                disabled={!wheelState.isActive}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Horário
              </Button>
              <Button
                onClick={() => handleDirectionChange('counterclockwise')}
                variant={wheelState.direction === 'counterclockwise' ? 'default' : 'outline'}
                disabled={!wheelState.isActive}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Anti-horário
              </Button>
            </div>
          </div>

          {/* Speed Controls */}
          <div>
            <Label>Velocidade</Label>
            <Select
              value={wheelState.speed}
              onValueChange={(value) => handleSpeedChange(value as RotationSpeed)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Lenta (30 RPM)</SelectItem>
                <SelectItem value="medium">Média (60 RPM)</SelectItem>
                <SelectItem value="fast">Rápida (120 RPM)</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Speed Input */}
          {wheelState.speed === 'custom' && (
            <div>
              <Label>RPM Personalizado (0-300)</Label>
              <Input
                type="number"
                min="0"
                max="300"
                value={wheelState.customSpeed}
                onChange={(e) => handleCustomSpeedChange(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Info Alert - FORMATO BRASILEIRO */}
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Sistema de rotação operando {wheelState.isActive ? 'normalmente' : 'em standby'}. 
              Última atualização: {formatTimeBR(wheelState.lastUpdated)} - {formatDateTimeBR(wheelState.lastUpdated)}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
