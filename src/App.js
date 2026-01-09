import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './Admin/AppRouter';

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AppRouter />
        </QueryClientProvider>
    );
};

export default App;
