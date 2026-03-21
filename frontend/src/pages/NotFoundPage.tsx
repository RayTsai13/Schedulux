import AppScaffold from '../components/layout/AppScaffold';
import UniversalButton from '../components/universal/UniversalButton';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <AppScaffold>
            <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-8xl font-bold text-on-surface mb-4">404</h1>
                    <p className="text-xl text-on-surface-variant mb-8">Page not found</p>
                    <UniversalButton variant="primary" size="lg" onClick={() => navigate('/explore')}>
                        Browse marketplace
                    </UniversalButton>
                </div>
            </div>
        </AppScaffold>
    );
}
