import fs from 'fs';
import path from 'path';

// Load admin list from JSON file
let adminEmails: Set<string>;

/**
 * Loads the admin email list from the admins.json configuration file
 * This is called once at module load time
 */
function loadAdminList(): Set<string> {
  try {
    const adminsPath = path.join(__dirname, '../config/admins.json');
    const adminsData = JSON.parse(fs.readFileSync(adminsPath, 'utf-8'));
    const emails = new Set<string>(adminsData.adminEmails.map((email: string) => email.toLowerCase()));
    console.log(`Loaded ${emails.size} admin email(s) from configuration`);
    return emails;
  } catch (error) {
    console.error('Failed to load admin configuration:', error);
    return new Set<string>(['admin@example.com']); // Fallback
  }
}

// Initialize admin list on module load
adminEmails = loadAdminList();

/**
 * Check if an email address is in the admin list
 * @param email - Email address to check
 * @returns true if the email is in the admin list
 */
export function isAdminEmail(email: string): boolean {
  return adminEmails.has(email.toLowerCase());
}

/**
 * Get the appropriate role for a user based on their email
 * @param email - Email address to check
 * @returns 'admin' if email is in admin list, otherwise 'user'
 */
export function getRoleForEmail(email: string): 'admin' | 'user' {
  return isAdminEmail(email) ? 'admin' : 'user';
}

/**
 * Reload the admin list from the configuration file
 * Useful if the config file is updated and you want to reload without restarting
 */
export function reloadAdminList(): void {
  adminEmails = loadAdminList();
}

