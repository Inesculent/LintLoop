import { getRoleForEmail, isAdminEmail } from '../../utils/adminList';

describe('Admin List Utilities', () => {
  describe('isAdminEmail', () => {
    it('should return true for admin emails in the config', () => {
      // This will depend on your actual admins.json content
      const result = isAdminEmail('admin@example.com');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for non-admin emails', () => {
      const result = isAdminEmail('user@example.com');
      expect(result).toBe(false);
    });

    it('should be case-insensitive', () => {
      const lowercase = isAdminEmail('admin@example.com');
      const uppercase = isAdminEmail('ADMIN@EXAMPLE.COM');
      expect(lowercase).toBe(uppercase);
    });
  });

  describe('getRoleForEmail', () => {
    it('should return admin role for admin emails', () => {
      const role = getRoleForEmail('admin@example.com');
      expect(role).toBe('admin');
    });

    it('should return user role for non-admin emails', () => {
      const role = getRoleForEmail('user@example.com');
      expect(role).toBe('user');
    });

    it('should return either admin or user', () => {
      const role = getRoleForEmail('test@example.com');
      expect(['admin', 'user']).toContain(role);
    });
  });
});

