import type { APIRoute } from 'astro';
import { User } from '@/lib/models/User';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { authenticate } from '@/lib/middleware/auth';
import { connectDB } from '@/lib/config/database';
import { canCreateRole } from '@/lib/utils/permissions';
import mongoose from 'mongoose';

export const PUT: APIRoute = async (context) => {
  try {
    await connectDB();
    
    const authResult = await authenticate(context);
    
    if (!authResult) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    const body = await context.request.json();
    const { name, email, password, role } = body;

    // Buscar el usuario a actualizar
    const userToUpdate = await User.findById(context.params.id);
    
    if (!userToUpdate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuario no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos: solo administradores pueden editar cualquier usuario
    // Los líderes solo pueden editar desarrolladores
    if (user.role === 'lider') {
      if (userToUpdate.role !== 'desarrollador') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permisos para editar este usuario',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Los líderes no pueden cambiar el rol de desarrolladores
      if (role && role !== 'desarrollador') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No puedes cambiar el rol de un desarrollador',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role !== 'administrador') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para editar usuarios',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userToUpdate._id.toString() === user._id.toString()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No puedes editar tu propio usuario desde aquí',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar campos
    if (name !== undefined) userToUpdate.name = name;
    if (email !== undefined) {
      // Verificar si el email ya está en uso por otro usuario
      if (email !== userToUpdate.email) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser._id.toString() !== userToUpdate._id.toString()) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'El email ya está en uso por otro usuario',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      userToUpdate.email = email.toLowerCase();
    }
    if (password && password.length >= 6) {
      userToUpdate.password = password; // El pre-save hook se encargará de hashear
    }
    if (role && canCreateRole(user as any, role as any)) {
      userToUpdate.role = role;
    }

    await userToUpdate.save();

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = userToUpdate.toObject();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: {
          user: {
            id: String(userWithoutPassword._id),
            name: userWithoutPassword.name,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
            avatar: userWithoutPassword.avatar,
            createdAt: userWithoutPassword.createdAt,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return new Response(
        JSON.stringify({
          success: false,
          message: messages.join(', '),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al actualizar usuario: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    await connectDB();
    
    const authResult = await authenticate(context);
    
    if (!authResult) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autenticado',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    // Buscar el usuario a eliminar
    const userToDelete = await User.findById(context.params.id);
    
    if (!userToDelete) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuario no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos: solo administradores pueden eliminar cualquier usuario
    // Los líderes solo pueden eliminar desarrolladores
    if (user.role === 'lider') {
      if (userToDelete.role !== 'desarrollador') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permisos para eliminar este usuario',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (user.role !== 'administrador') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para eliminar usuarios',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userToDelete._id.toString() === user._id.toString()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No puedes eliminar tu propio usuario',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = userToDelete._id;
    const userRole = userToDelete.role;

    // Manejar tareas y proyectos según el rol del usuario
    if (userRole === 'desarrollador') {
      // Si es desarrollador, pasar sus tareas al líder del proyecto
      const tasksAssigned = await Task.find({ assignees: userId })
        .populate('projectId');

      if (tasksAssigned.length > 0) {

        for (const task of tasksAssigned) {
          const project = task.projectId as any;
          
          if (project && project.leader) {
            // Remover al desarrollador de los assignees
            const assigneesArray = (task.assignees || []).filter(
              (a: any) => a.toString() !== userId.toString()
            );
            
            // Agregar al líder si no está ya en los assignees
            const leaderId = project.leader.toString();
            if (!assigneesArray.some((a: any) => a.toString() === leaderId)) {
              assigneesArray.push(new mongoose.Types.ObjectId(leaderId));
            }
            
            task.assignees = assigneesArray;
            await task.save();
          } else {
            // Si el proyecto no tiene líder, solo remover al desarrollador
            task.assignees = (task.assignees || []).filter(
              (a: any) => a.toString() !== userId.toString()
            );
            await task.save();
          }
        }
      }

      // Remover al desarrollador de los miembros de proyectos
      await Project.updateMany(
        { members: userId },
        { $pull: { members: userId } }
      );

    } else if (userRole === 'lider') {
      // Si es líder, dejar proyectos y tareas sin líder
      const projectsLed = await Project.find({ leader: userId });

      if (projectsLed.length > 0) {

        // Para cada proyecto, buscar tareas donde el líder está asignado
        for (const project of projectsLed) {
          const tasksInProject = await Task.find({ 
            projectId: project._id,
            assignees: userId 
          });

          // Remover al líder de las tareas asignadas
          for (const task of tasksInProject) {
            task.assignees = (task.assignees || []).filter(
              (a: any) => a.toString() !== userId.toString()
            );
            await task.save();
          }

          // Remover al líder del proyecto (dejar null)
          // El proyecto quedará sin líder hasta que el administrador asigne uno nuevo
          project.leader = null;
          await project.save();
        }
      }

      // Remover al líder de los miembros de proyectos donde no es líder
      await Project.updateMany(
        { members: userId, leader: { $ne: userId } },
        { $pull: { members: userId } }
      );

      // Remover al líder de tareas donde está asignado pero no es líder del proyecto
      const tasksAssigned = await Task.find({ assignees: userId })
        .populate('projectId');

      for (const task of tasksAssigned) {
        const project = task.projectId as any;
        // Solo remover si no es el líder del proyecto
        if (!project || project.leader?.toString() !== userId.toString()) {
          task.assignees = (task.assignees || []).filter(
            (a: any) => a.toString() !== userId.toString()
          );
          await task.save();
        }
      }

    } else if (userRole === 'administrador') {
      // Si es administrador, remover de tareas y proyectos donde está asignado
      // pero no eliminar proyectos ni tareas
      await Task.updateMany(
        { assignees: userId },
        { $pull: { assignees: userId } }
      );

      await Project.updateMany(
        { members: userId },
        { $pull: { members: userId } }
      );

      // Si es líder de algún proyecto, dejarlo sin líder
      const adminProjectsLed = await Project.find({ leader: userId });
      for (const project of adminProjectsLed) {
        // Remover al administrador de las tareas asignadas en estos proyectos
        const tasksInProject = await Task.find({ 
          projectId: project._id,
          assignees: userId 
        });
        for (const task of tasksInProject) {
          task.assignees = (task.assignees || []).filter(
            (a: any) => a.toString() !== userId.toString()
          );
          await task.save();
        }
        // Dejar el proyecto sin líder
        project.leader = null;
        await project.save();
      }
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(context.params.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: userRole === 'lider' 
          ? 'Usuario eliminado correctamente. Los proyectos quedaron sin líder. El administrador debe asignar un nuevo líder.'
          : 'Usuario eliminado correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al eliminar usuario: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
