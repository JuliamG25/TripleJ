import type { APIRoute } from 'astro';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { authenticate } from '@/lib/middleware/auth';
import { authorize } from '@/lib/middleware/authorize';
import { connectDB } from '@/lib/config/database';
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
    const projectId = context.params.id;

    // Verificar que el usuario tenga permisos (administrador o líder del proyecto)
    const project = await Project.findById(projectId);
    
    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Proyecto no encontrado',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solo administradores o líderes del proyecto pueden gestionar miembros
    const isLeader = project.leader.toString() === user._id.toString();
    const isAdmin = user.role === 'administrador';

    if (!isAdmin && !isLeader) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permisos para gestionar miembros de este proyecto',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId } = await context.request.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Se requiere action (add/remove) y userId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    if (action === 'add') {
      // Agregar miembro si no está ya en el proyecto
      if (!project.members.some((m: any) => m.toString() === userId)) {
        project.members.push(userIdObj);
        await project.save();
      }
    } else if (action === 'remove') {
      // No permitir quitar al líder
      if (project.leader.toString() === userId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No se puede quitar al líder del proyecto',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Quitar miembro
      project.members = project.members.filter(
        (m: any) => m.toString() !== userId
      );
      await project.save();

      // Reasignar tareas del miembro removido al líder del proyecto
      const tasksToReassign = await Task.find({
        projectId: projectId,
        assignees: userIdObj,
      });

      if (tasksToReassign.length > 0) {
        console.log(`🔄 Reasignando ${tasksToReassign.length} tareas al líder del proyecto`);
        
        for (const task of tasksToReassign) {
          // Remover al usuario de los assignees y agregar al líder si no está ya
          const assigneesArray = (task.assignees || []).filter(
            (a: any) => a.toString() !== userId
          );
          
          // Agregar al líder si no está ya en los assignees
          if (!assigneesArray.some((a: any) => a.toString() === project.leader.toString())) {
            assigneesArray.push(project.leader);
          }
          
          task.assignees = assigneesArray;
          await task.save();
        }
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Action debe ser "add" o "remove"',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Poblar el proyecto actualizado
    const updatedProject = await Project.findById(projectId)
      .populate('leader', 'name email role')
      .populate('members', 'name email role');

    return new Response(
      JSON.stringify({
        success: true,
        message: action === 'add' ? 'Miembro agregado correctamente' : 'Miembro removido correctamente',
        data: { project: updatedProject },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error en PUT /api/projects/[id]/members:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error al gestionar miembros: ${error.message || 'Error desconocido'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
