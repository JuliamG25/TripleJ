import mongoose from 'mongoose';
import { connectDB } from '../lib/config/database.js';
import { User } from '../lib/models/User.js';
import { Project } from '../lib/models/Project.js';
import { Task } from '../lib/models/Task.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de seed para poblar la base de datos con datos de ejemplo
 * 
 * Este script:
 * - Limpia todos los datos existentes
 * - Crea usuarios de prueba (administrador, líder, desarrolladores)
 * - Crea proyectos de ejemplo
 * - Crea tareas asignadas a los proyectos
 * 
 * Uso: npm run seed
 */
const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de base de datos...\n');
    
    await connectDB();
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar datos existentes
    console.log('🗑️  Limpiando datos existentes...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('✅ Datos anteriores eliminados\n');

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const users = await User.create([
      {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@fesc.edu.co',
        password: 'demo123',
        role: 'administrador',
      },
      {
        name: 'María García',
        email: 'maria.garcia@fesc.edu.co',
        password: 'demo123',
        role: 'lider',
      },
      {
        name: 'Juan Pérez',
        email: 'juan.perez@fesc.edu.co',
        password: 'demo123',
        role: 'desarrollador',
      },
      {
        name: 'Ana Martínez',
        email: 'ana.martinez@fesc.edu.co',
        password: 'demo123',
        role: 'desarrollador',
      },
    ]);

    console.log(`✅ ${users.length} usuarios creados:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // Crear proyectos
    console.log('📁 Creando proyectos...');
    const projects = await Project.create([
      {
        name: 'Sistema de Gestión Académica',
        description: 'Plataforma integral para la administración de procesos académicos de la FESC, incluyendo inscripciones, calificaciones y seguimiento estudiantil.',
        leader: users[1]._id, // María García (líder)
        members: [users[2]._id, users[3]._id], // Juan Pérez y Ana Martínez (sin duplicar al líder)
      },
      {
        name: 'App Móvil Estudiantil',
        description: 'Aplicación móvil para que los estudiantes accedan a sus horarios, calificaciones y notificaciones institucionales.',
        leader: users[1]._id, // María García (líder)
        members: [users[3]._id], // Ana Martínez (sin duplicar al líder)
      },
    ]);

    console.log(`✅ ${projects.length} proyectos creados:`);
    projects.forEach(project => {
      console.log(`   - ${project.name}`);
      console.log(`     Líder: ${users.find(u => u._id.toString() === project.leader.toString())?.name}`);
      console.log(`     Miembros: ${project.members.length}`);
    });
    console.log('');

    // Crear tareas
    console.log('📋 Creando tareas...');
    const tasks = await Task.create([
      {
        title: 'Implementar autenticación de usuarios',
        description: 'Desarrollar el sistema de login con validación de credenciales y manejo de sesiones.',
        status: 'en-progreso',
        priority: 'alta',
        assignees: [users[2]._id], // Juan Pérez
        projectId: projects[0]._id,
        comments: [],
      },
      {
        title: 'Diseñar interfaz del dashboard',
        description: 'Crear el diseño visual del panel principal siguiendo la identidad FESC.',
        status: 'hecha',
        priority: 'alta',
        assignees: [users[3]._id], // Ana Martínez
        projectId: projects[0]._id,
        comments: [],
      },
      {
        title: 'Configurar base de datos',
        description: 'Establecer la estructura de tablas y relaciones para el sistema.',
        status: 'pendiente',
        priority: 'media',
        assignees: [users[2]._id], // Juan Pérez
        projectId: projects[0]._id,
        comments: [],
      },
      {
        title: 'Crear módulo de reportes',
        description: 'Implementar generación de reportes en PDF con estadísticas del proyecto.',
        status: 'pendiente',
        priority: 'baja',
        assignees: [], // Sin asignar
        projectId: projects[0]._id,
        comments: [],
      },
      {
        title: 'Investigar frameworks de frontend',
        description: 'Evaluar opciones tecnológicas para el desarrollo del frontend.',
        status: 'hecha',
        priority: 'media',
        assignees: [users[3]._id], // Ana Martínez
        projectId: projects[1]._id,
        comments: [],
      },
      {
        title: 'Definir arquitectura del sistema',
        description: 'Documentar la arquitectura técnica y patrones de diseño a utilizar.',
        status: 'en-progreso',
        priority: 'alta',
        assignees: [users[1]._id, users[3]._id], // María García (líder) y Ana Martínez (múltiples asignados)
        projectId: projects[1]._id,
        comments: [],
      },
    ]);

    console.log(`✅ ${tasks.length} tareas creadas:`);
    tasks.forEach(task => {
      const assigneesNames = task.assignees.length > 0
        ? task.assignees.map(aid => users.find(u => u._id.toString() === aid.toString())?.name).filter(Boolean).join(', ')
        : 'Sin asignar';
      console.log(`   - ${task.title} [${task.status}] - Asignado a: ${assigneesNames}`);
    });
    console.log('');

    console.log('🎉 Seed completado exitosamente!\n');
    console.log('📝 Credenciales de prueba:');
    console.log('   👑 Administrador: carlos.rodriguez@fesc.edu.co / demo123');
    console.log('   👔 Líder: maria.garcia@fesc.edu.co / demo123');
    console.log('   👨‍💻 Desarrollador: juan.perez@fesc.edu.co / demo123');
    console.log('   👩‍💻 Desarrollador: ana.martinez@fesc.edu.co / demo123');
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error en seed:', error);
    if (error.message) {
      console.error('   Mensaje:', error.message);
    }
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ejecutar seed
seedData();
