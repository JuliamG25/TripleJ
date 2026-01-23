import mongoose, { Schema, Document } from 'mongoose';

export type MeetingType = 'presencial' | 'virtual';
export type MeetingStatus = 'programada' | 'en-curso' | 'completada' | 'cancelada';

export interface IMeeting extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: MeetingType;
  meetLink?: string;
  projectId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: MeetingStatus;
  location?: string; // Para reuniones presenciales
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'El título de la reunión es requerido'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'La fecha y hora de inicio es requerida'],
    },
    endDate: {
      type: Date,
      required: [true, 'La fecha y hora de fin es requerida'],
    },
    type: {
      type: String,
      enum: ['presencial', 'virtual'],
      default: 'virtual',
      required: true,
    },
    meetLink: {
      type: String,
      required: false,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El proyecto es requerido'],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El creador es requerido'],
    },
    status: {
      type: String,
      enum: ['programada', 'en-curso', 'completada', 'cancelada'],
      default: 'programada',
      required: true,
    },
    location: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
MeetingSchema.index({ projectId: 1 });
MeetingSchema.index({ participants: 1 });
MeetingSchema.index({ startDate: 1 });
MeetingSchema.index({ createdBy: 1 });

// Validación: endDate debe ser después de startDate
MeetingSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  } else {
    next();
  }
});

// Evitar redefinir modelos en hot-reload
export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
