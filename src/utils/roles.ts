import type { Role } from '../types';

const ADMINISTRATOR_ROLE_NAME = 'Administrator';

export const isAdministratorRole = (role: Role | null | undefined): boolean => role?.name === ADMINISTRATOR_ROLE_NAME;
