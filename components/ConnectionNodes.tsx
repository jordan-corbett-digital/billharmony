import React from 'react';
import { Icon } from './Icon';
import { IconName } from '../constants';

interface Node {
  id: string;
  label: string;
  icon: IconName;
  description?: string;
}

interface ConnectionNodesProps {
  nodes: Node[];
  activeNodeId?: string;
  className?: string;
}

/**
 * ConnectionNodes - Visual nodes showing how systems connect
 * Shows: EOB → Profile → Estimate → Assistance
 */
const ConnectionNodes: React.FC<ConnectionNodesProps> = ({
  nodes,
  activeNodeId,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {nodes.map((node, index) => {
        const isActive = node.id === activeNodeId;
        const isCompleted = activeNodeId && nodes.findIndex(n => n.id === activeNodeId) > index;
        const isUpcoming = activeNodeId && nodes.findIndex(n => n.id === activeNodeId) < index;

        return (
          <React.Fragment key={node.id}>
            {/* Node */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent-green text-white shadow-lg'
                    : isActive
                    ? 'bg-primary-blue text-white ring-4 ring-primary-blue/20 shadow-lg scale-110'
                    : 'bg-gray-200 text-silver-gray'
                }`}
              >
                <Icon name={node.icon} className="w-6 h-6" />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-teal rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <div className="mt-2 text-center max-w-[100px]">
                <p
                  className={`text-xs font-semibold ${
                    isActive || isCompleted ? 'text-ink-black' : 'text-silver-gray'
                  }`}
                >
                  {node.label}
                </p>
                {node.description && (
                  <p className="text-xs text-silver-gray mt-1">{node.description}</p>
                )}
              </div>
            </div>

            {/* Connector line (except for last node) */}
            {index < nodes.length - 1 && (
              <div className="flex-1 mx-2 relative">
                <div
                  className={`h-0.5 transition-all duration-500 ${
                    isCompleted ? 'bg-accent-green' : 'bg-gray-200'
                  }`}
                />
                {isCompleted && (
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent-green transform -translate-y-1/2" />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ConnectionNodes;

