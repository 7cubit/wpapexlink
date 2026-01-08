import { __ } from '@wordpress/i18n';

const App = () => {
    return (
        <div className="wp-neurolink-admin">
            <h1>{__('WP NeuroLink Dashboard', 'wp-neurolink')}</h1>
            <p>{__('Welcome to the Neural Architecture Engine.', 'wp-neurolink')}</p>
        </div>
    );
};

export default App;
