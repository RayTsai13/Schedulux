import React from 'react';
import { CheckCircle, MapPin, Instagram } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  description?: string;
  avatarUrl?: string;
  instagram?: string;
  location: string;
  verified: boolean;
}

export default function ProfileHeader({
  name,
  description,
  avatarUrl,
  instagram,
  location,
  verified,
}: ProfileHeaderProps) {
  return (
    <div className="max-w-3xl mx-auto text-center px-4 py-8">
      {/* Avatar */}
      <div className="mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-v3-surface shadow-lg mx-auto object-cover"
          />
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-v3-surface shadow-lg mx-auto bg-gradient-to-br from-v3-accent to-purple-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name + Verified Badge */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <h1 className="text-4xl font-bold text-v3-primary">{name}</h1>
        {verified && (
          <CheckCircle className="h-8 w-8 text-blue-500 flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-lg text-v3-secondary max-w-md mx-auto mb-6">
          {description}
        </p>
      )}

      {/* Location */}
      <div className="flex items-center justify-center gap-2 mb-4 text-v3-secondary">
        <MapPin className="h-5 w-5 text-v3-accent" />
        <span>{location}</span>
      </div>

      {/* Instagram Pill */}
      {instagram && (
        <a
          href={`https://instagram.com/${instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-zinc-100 text-v3-secondary rounded-full px-4 py-2 hover:bg-zinc-200 transition-colors"
        >
          <Instagram className="h-4 w-4" />
          <span className="text-sm font-medium">@{instagram.replace('@', '')}</span>
        </a>
      )}
    </div>
  );
}
