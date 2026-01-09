import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Key, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ActivateLicense = ({ onActivate, darkMode }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleActivate = async (e) => {
        e.preventDefault();
        if (!licenseKey) return;

        setLoading(true);
        try {
            const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';
            const response = await fetch(`${baseUrl}/license/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ license_key: licenseKey })
            });

            const data = await response.json();
            console.log('[ApexLink] License activation response:', data);

            if (data.success) {
                toast.success(__('License activated successfully!', 'wp-apexlink'));
                if (onActivate) onActivate(data.data);
            } else {
                toast.error(data.message || __('Activation failed.', 'wp-apexlink'));
            }
        } catch (error) {
            console.error('Activation error:', error);
            toast.error(__('An error occurred during activation.', 'wp-apexlink'));
        }
        setLoading(false);
    };

    return (
        <div className={`max-w-md mx-auto mt-20 p-8 rounded-3xl shadow-xl border animate-in zoom-in-95 duration-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-indigo-50 text-neuro-brain mb-4">
                    <Key className="w-8 h-8" />
                </div>
                <h2 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Activate ApexLink', 'wp-apexlink')}</h2>
                <p className="text-gray-500 text-sm">{__('Enter your license key to unlock the neural engine.', 'wp-apexlink')}</p>
            </div>

            <form onSubmit={handleActivate} className="space-y-6">
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('License Key', 'wp-apexlink')}</label>
                    <input 
                        type="text" 
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-neuro-brain focus:border-neuro-brain transition-all font-mono text-center tracking-widest ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading || !licenseKey}
                    className="w-full bg-neuro-brain hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <ShieldCheck className="w-5 h-5 mr-2" />
                    )}
                    {loading ? __('Activating...', 'wp-apexlink') : __('Activate Now', 'wp-apexlink')}
                </button>
            </form>

            <div className={`mt-8 p-4 rounded-xl border flex items-start text-xs ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>{__('Don\'t have a key? Visit apexlink.io to get your API credentials.', 'wp-apexlink')}</p>
            </div>
        </div>
    );
};

export default ActivateLicense;
