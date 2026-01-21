import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'pendiente' | 'en-progreso' | 'hecha';
export type TaskPriority = 'baja' | 'media' | 'alta';

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'El contenido del comentario es requerido'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: mongoose.Types.ObjectId[];
  projectId: mongoose.Types.ObjectId;
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'El título de la tarea es requerido'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pendiente', 'en-progreso', 'hecha'],
      default: 'pendiente',
      required: true,
    },
    priority: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media',
      required: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El proyecto es requerido'],
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índices
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ status: 1 });

// Evitar redefinir modelos en hot-reload
export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
