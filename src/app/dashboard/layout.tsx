import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="flex min-h-screen w-full flex-col">
                {children}
            </div>
        </AuthGuard>
    )
}