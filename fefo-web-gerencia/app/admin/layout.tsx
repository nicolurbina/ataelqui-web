'use client';

import React, { ReactNode } from 'react';
import Sidebar from '@/components/layouts/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    );
}
