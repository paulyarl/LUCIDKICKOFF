import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/service', () => {
  const authAdmin = {
    listUsers: vi.fn(),
    getUserById: vi.fn(),
  };
  const from = vi.fn();
  const eq = vi.fn();
  const select = vi.fn();
  const insert = vi.fn();
  const _delete = vi.fn();
  const chain = { select, insert, delete: _delete, eq, from } as any;
  return {
    createServiceClient: () => ({
      auth: { admin: authAdmin },
      from: (tbl: string) => {
        chain.from = vi.fn().mockReturnValue(chain);
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.insert = vi.fn().mockResolvedValue({ error: null });
        chain.delete = vi.fn().mockReturnValue(chain);
        return chain;
      },
    }),
    __mocks: { authAdmin, chain },
  };
});

import { listUsersByRole, findUserByEmail, linkParentChild, unlinkParentChild } from '@/lib/admin';
import { createServiceClient as _real } from '@/lib/supabase/service';

const svc: any = _real as any;

describe('admin utilities', () => {
  beforeEach(() => {
    // reset mocks
    svc.__mocks.authAdmin.listUsers.mockReset();
    svc.__mocks.authAdmin.getUserById?.mockReset?.();
  });

  it('paginates listUsersByRole and filters by role', async () => {
    svc.__mocks.authAdmin.listUsers
      .mockResolvedValueOnce({ data: { users: [
        { id: 'p1', email: 'p1@example.com', user_metadata: { role: 'parent' } },
        { id: 'c1', email: 'c1@example.com', user_metadata: { role: 'child' } },
      ] } })
      .mockResolvedValueOnce({ data: { users: [] } });

    const res = await listUsersByRole('parent');
    expect(res).toEqual([{ id: 'p1', email: 'p1@example.com' }]);
    expect(svc.__mocks.authAdmin.listUsers).toHaveBeenCalled();
  });

  it('findUserByEmail finds matching email across pages', async () => {
    svc.__mocks.authAdmin.listUsers
      .mockResolvedValueOnce({ data: { users: [
        { id: 'x', email: 'x@example.com', user_metadata: {} },
      ] } })
      .mockResolvedValueOnce({ data: { users: [
        { id: 'target', email: 'match@example.com', user_metadata: {} },
      ] } });

    const res = await findUserByEmail('match@example.com');
    expect(res).toEqual({ id: 'target', email: 'match@example.com' });
  });

  it('linkParentChild inserts relationship', async () => {
    await expect(linkParentChild('p1', 'c1')).resolves.toBeUndefined();
  });

  it('unlinkParentChild deletes relationship', async () => {
    await expect(unlinkParentChild('p1', 'c1')).resolves.toBeUndefined();
  });
});
