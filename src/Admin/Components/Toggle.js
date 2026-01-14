/**
 * Premium toggle switch component with smooth animations and dark mode support.
 * 
 * @param {Object} props
 * @param {boolean} props.enabled - Current toggle state
 * @param {function} props.onChange - Callback when toggle is clicked
 * @param {boolean} props.darkMode - Dark mode state
 * @param {boolean} props.disabled - Whether the toggle is disabled
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 */
const Toggle = ({ enabled, onChange, darkMode, disabled = false, size = 'md' }) => {
    const sizes = {
        sm: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
        md: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
        lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
    };

    const { track, thumb, translate } = sizes[size] || sizes.md;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`
                ${track} 
                relative inline-flex items-center rounded-full 
                transition-all duration-300 ease-in-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${enabled
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30'
                    : darkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                }
            `}
        >
            <span className="sr-only">Toggle</span>
            <span
                className={`
                    ${thumb}
                    absolute left-0.5 top-0.5
                    inline-block rounded-full bg-white shadow-md
                    transform transition-all duration-300 ease-in-out
                    ${enabled ? translate : 'translate-x-0'}
                    ${enabled ? 'shadow-lg' : 'shadow'}
                `}
            />
        </button>
    );
};

export default Toggle;
