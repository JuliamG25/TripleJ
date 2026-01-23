import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'task_assigned' | 'comment_added' | 'task_overdue' | 'task_updated';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['task_assigned', 'comment_added', 'task_overdue', 'task_updated'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Índices
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Evitar redefinir modelos en hot-reload
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
