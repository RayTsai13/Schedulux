import { useParams } from 'react-router-dom';

/**
 * The handle from a /@slug URL. React Router can't match "@:slug" inside a
 * segment, so routes capture the whole segment and this strips the "@".
 * Returns null for segments that aren't handles.
 */
export function useHandle(): string | null {
  const { handle } = useParams<{ handle: string }>();
  return handle?.startsWith('@') && handle.length > 1 ? handle.slice(1).toLowerCase() : null;
}
