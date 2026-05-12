type IconProps = {
    className?: string
}

export default function LogsIcon({
    className = 'w-5 h-5',
}: IconProps) {
    return (
        <svg 
            className={className} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" 
            />
        </svg>
    )
}