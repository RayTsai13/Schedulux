import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/Storefront', () => ({
  StorefrontModel: {
    findById: vi.fn(),
    findByVendorId: vi.fn(),
    findPublicBySlug: vi.fn(),
    slugExists: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../../models/Service', () => ({ ServiceModel: { findActiveByStorefrontId: vi.fn() } }));

import { StorefrontService } from '../StorefrontService';
import { StorefrontModel } from '../../models/Storefront';
import { makeStorefront } from './fixtures';

const VENDOR_ID = 100;

beforeEach(() => {
  vi.mocked(StorefrontModel.findByVendorId).mockResolvedValue([]);
  vi.mocked(StorefrontModel.slugExists).mockResolvedValue(false);
  vi.mocked(StorefrontModel.create).mockImplementation(async (vendorId, data) =>
    makeStorefront({ vendor_id: vendorId, ...data })
  );
  vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ vendor_id: VENDOR_ID }));
  vi.mocked(StorefrontModel.update).mockImplementation(async (id, data) => makeStorefront({ id, ...data }));
});

describe('StorefrontService.create', () => {
  it('creates the page with a lowercased slug', async () => {
    const page = await StorefrontService.create(VENDOR_ID, { name: 'Midnight Barber', slug: 'Midnight-Barber' });
    expect(page.slug).toBe('midnight-barber');
  });

  it('allows only one page per vendor', async () => {
    vi.mocked(StorefrontModel.findByVendorId).mockResolvedValue([makeStorefront()]);
    await expect(StorefrontService.create(VENDOR_ID, { name: 'Second', slug: 'second' })).rejects.toThrow(
      'You already have a booking page'
    );
  });

  it.each(['ab', '-dash-first', 'has space', 'x'.repeat(31), 'emoji-🙂'])('rejects the malformed slug %s', async (slug) => {
    await expect(StorefrontService.create(VENDOR_ID, { name: 'Page', slug })).rejects.toThrow('Invalid slug');
  });

  it.each(['dashboard', 'playground', 'manage'])('rejects the reserved slug %s', async (slug) => {
    await expect(StorefrontService.create(VENDOR_ID, { name: 'Page', slug })).rejects.toThrow('Slug is already taken');
  });

  it('rejects a slug someone else holds', async () => {
    vi.mocked(StorefrontModel.slugExists).mockResolvedValue(true);
    await expect(StorefrontService.create(VENDOR_ID, { name: 'Page', slug: 'taken' })).rejects.toThrow(
      'Slug is already taken'
    );
  });
});

describe('StorefrontService.update', () => {
  it('passes through only vendor-editable fields', async () => {
    await StorefrontService.update(1, VENDOR_ID, {
      name: 'New Name',
      vendor_id: 999,
      'name = name; DROP TABLE users; --': 'x',
    } as never);
    expect(StorefrontModel.update).toHaveBeenCalledWith(1, { name: 'New Name' });
  });

  it('checks availability only when the slug actually changes', async () => {
    await StorefrontService.update(1, VENDOR_ID, { slug: 'test-storefront' });
    expect(StorefrontModel.slugExists).not.toHaveBeenCalled();

    await StorefrontService.update(1, VENDOR_ID, { slug: 'fresh-handle' });
    expect(StorefrontModel.slugExists).toHaveBeenCalledWith('fresh-handle', 1);
  });

  it("refuses to edit another vendor's page", async () => {
    await expect(StorefrontService.update(1, 555, { name: 'Mine now' })).rejects.toThrow('Forbidden');
  });
});

describe('StorefrontService.isSlugAvailable', () => {
  it('is false for reserved, malformed, or taken slugs and true otherwise', async () => {
    expect(await StorefrontService.isSlugAvailable('login')).toBe(false);
    expect(await StorefrontService.isSlugAvailable('no')).toBe(false);
    expect(await StorefrontService.isSlugAvailable('Fresh-Handle')).toBe(true);
    vi.mocked(StorefrontModel.slugExists).mockResolvedValue(true);
    expect(await StorefrontService.isSlugAvailable('fresh-handle')).toBe(false);
  });
});
