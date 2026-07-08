export function Notifications({ notifications }) {
    return (
        <div className="w-full max-w-4xl space-y-4">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {notifications.map((message, index) => (
                <div className="rounded-lg border bg-card p-4 text-sm" key={`${message}-${index}`}>
                    {message}
                </div>
            ))}
        </div>
    )
}
