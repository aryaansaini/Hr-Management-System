'use client';

import { useRouter, usePathname } from 'next/navigation';

const SUB_NAV = [
    {
        key: '/admin/onboarding',
        label: 'Dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
        key: '/admin/onboarding/employees',
        label: 'Employees',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    {
        key: '/admin/onboarding/document-requests',
        label: 'Document Requests',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
        key: '/admin/onboarding/checklist',
        label: 'Checklist',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
    },
    {
        key: '/admin/onboarding/reports',
        label: 'Reports',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    }
];

function NavIcon({ path }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
        >
            <path d={path} />
        </svg>
    );
}

export default function OnboardingLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const bestMatch = SUB_NAV.reduce((best, nav) => {
        if (
            pathname === nav.key ||
            pathname.startsWith(nav.key + '/')
        ) {
            if (!best || nav.key.length > best.length) {
                return nav.key;
            }
        }

        return best;
    }, null);

    return (
        <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Secondary Sub-navigation Sidebar */}
            <nav className="w-full sm:w-56 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 sticky top-6 space-y-1">

                {SUB_NAV.map((item) => {
                    const active = item.key === bestMatch;

                    return (
                        <button
                            key={item.key}
                            onClick={() => router.push(item.key)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all border-l-4 text-left ${
                                active
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-600 dark:border-blue-400 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                            }`}
                        >
                            <NavIcon path={item.icon} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}

            </nav>

            {/* Main Page Content */}
            <main className="flex-1 min-w-0 w-full">
                {children}
            </main>

        </div>
    );
}