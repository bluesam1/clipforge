import React from 'react';
import { formatTime } from '../utils/timelineUtils';

interface TimeMarkerProps {
  time: number;
  x: number;
  isMajor: boolean;
  height: number;
  showLabels: boolean;
  labelOffset?: number;
}

const TimeMarker: React.FC<TimeMarkerProps> = ({
  time,
  x,
  isMajor,
  height,
  showLabels,
  labelOffset = 0,
}) => {
  const getMarkerHeight = () => {
    return isMajor ? height : height * 0.6;
  };

  const getMarkerColor = () => {
    return isMajor ? 'bg-gray-400' : 'bg-gray-300';
  };

  const getLabelSize = () => {
    return isMajor ? 'text-xs' : 'text-xs';
  };

  const getLabelWeight = () => {
    return isMajor ? 'font-semibold' : 'font-normal';
  };

  return (
    <div
      className="absolute top-0 flex flex-col items-center"
      style={{ left: `${x}px` }}
    >
      {/* Marker Line */}
      <div
        className={`w-px ${getMarkerColor()}`}
        style={{ height: `${getMarkerHeight()}px` }}
      />
      
      {/* Time Label */}
      {showLabels && (
        <div
          className={`${getLabelSize()} ${getLabelWeight()} text-gray-500 mt-1 select-none`}
          style={{ marginTop: `${labelOffset}px` }}
        >
          {formatTime(time)}
        </div>
      )}
    </div>
  );
};

interface TimeMarkersProps {
  startTime: number;
  endTime: number;
  interval: number;
  pixelsPerSecond: number;
  height: number;
  showLabels?: boolean;
  majorInterval?: number;
  labelOffset?: number;
}

const TimeMarkers: React.FC<TimeMarkersProps> = ({
  startTime,
  endTime,
  interval,
  pixelsPerSecond,
  height,
  showLabels = true,
  majorInterval = 5,
  labelOffset = 0,
}) => {
  const markers = [];
  const start = Math.floor(startTime / interval) * interval;
  
  for (let time = start; time <= endTime; time += interval) {
    if (time >= startTime) {
      const x = time * pixelsPerSecond;
      const isMajor = time % majorInterval === 0;
      
      markers.push(
        <TimeMarker
          key={time}
          time={time}
          x={x}
          isMajor={isMajor}
          height={height}
          showLabels={showLabels}
          labelOffset={labelOffset}
        />
      );
    }
  }
  
  return <>{markers}</>;
};

export default TimeMarkers;
export { TimeMarker };
