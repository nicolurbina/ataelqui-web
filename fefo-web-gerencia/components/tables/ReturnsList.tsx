import React from 'react';

interface ReturnRequest {
    id: string;
    productName: string;
    quantity: number;
    reason: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy: string;
}

interface ReturnsListProps {
    requests: ReturnRequest[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

const ReturnsList: React.FC<ReturnsListProps> = ({ requests, onApprove, onReject }) => {
    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${req.status === 'pending' ? 'bg-orange-100 text-orange-600' : req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {/* Simple Icon Placeholder */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">{req.productName}</h4>
                            <p className="text-xs text-gray-500">Solicitado por: {req.requestedBy} • {req.date}</p>
                            <div className="mt-1 flex items-center space-x-2">
                                <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">Cant: {req.quantity}</span>
                                <span className="text-xs text-gray-500 italic">"{req.reason}"</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {req.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => onApprove(req.id)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                                >
                                    Aprobar
                                </button>
                                <button
                                    onClick={() => onReject(req.id)}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Rechazar
                                </button>
                            </>
                        )}
                        {req.status !== 'pending' && (
                            <span className={`text-xs font-bold uppercase ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                {req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReturnsList;
