import { useNavigate } from 'react-router-dom';
import AppScaffold from '../components/layout/AppScaffold';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppScaffold>
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-8">
        <div className="text-center max-w-lg">
          {/* Decorative icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-surface-container-low flex items-center justify-center">
            <Icon name="explore_off" className="text-5xl text-outline-variant" />
          </div>

          <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
            Trail Not Found
          </span>

          <h1 className="text-7xl md:text-8xl font-headline font-extrabold text-primary mb-4 tracking-tighter">
            404
          </h1>

          <p className="text-xl text-on-surface-variant mb-8 leading-relaxed">
            This path doesn't lead anywhere. The page may have been moved, removed, or perhaps it never existed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/explore')}
              className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              <Icon name="explore" className="text-lg" />
              Browse Marketplace
            </button>
            <button
              onClick={() => navigate(-1)}
              className="border border-outline-variant text-primary px-8 py-3 rounded-md font-bold hover:bg-surface-container transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </AppScaffold>
  );
}
