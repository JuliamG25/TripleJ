import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  leader: mongoose.Types.ObjectId | null;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del proyecto es requerido'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Permitir null temporalmente cuando se elimina un líder
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índices
ProjectSchema.index({ leader: 1 });
ProjectSchema.index({ members: 1 });

// Evitar redefinir modelos en hot-reload
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
