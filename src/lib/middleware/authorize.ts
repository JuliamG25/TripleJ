import type { APIContext } from 'astro';
import { UserRole, IUser } from '../models/User.js';
import { Project } from '../models/Project.js';
import { authenticate, AuthenticatedContext } from './auth.js';

/**
 * Middleware para autorizar acceso basado en roles
 */
export const authorize = (...roles: UserRole[]) => {
  return async (context: APIContext, user: IUser): Promise<boolean> => {
    if (!roles.includes(user.role as UserRole)) {
      return false;
    }
    return true;
  };
};

/**
 * Verificar si el usuario es el líder del proyecto
 */
export const isProjectLeader = async (
  context: APIContext,
  user: IUser,
  projectId: string
): Promise<boolean> => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return false;
    }

    // Administradores y líderes del proyecto pueden acceder
    if (
      user.role === 'administrador' ||
      project.leader.toString() === user._id.toString()
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Verificar si el usuario es miembro del proyecto
 */
export const isProjectMember = async (
  context: APIContext,
  user: IUser,
  projectId: string
): Promise<boolean> => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return false;
    }

    // Administradores, líderes y miembros pueden acceder
    if (
      user.role === 'administrador' ||
      project.leader.toString() === user._id.toString() ||
      project.members.some(member => member.toString() === user._id.toString())
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};
