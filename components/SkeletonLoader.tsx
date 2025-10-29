
import React from 'react';

export const SkeletonLoader: React.FC = () => {
    return (
        <div className="border-2 border-avante-blue/20 shadow rounded-xl p-4 w-full mx-auto">
            <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-avante-blue/20 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                    <div className="h-2 bg-avante-blue/20 rounded"></div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-2 bg-avante-blue/20 rounded col-span-2"></div>
                            <div className="h-2 bg-avante-blue/20 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-avante-blue/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
