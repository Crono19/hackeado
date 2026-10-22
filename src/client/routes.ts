import type { ExperienceRole } from '../shared/types';

export interface RoleRoute {
  path: string;
  role: ExperienceRole;
  label: string;
  eyebrow: string;
  description: string;
}

export const roleRoutes: RoleRoute[] = [
  {
    path: '/victima',
    role: 'victim',
    label: 'Víctima',
    eyebrow: 'Windows · participante',
    description: 'Mensajes, decisiones, permisos y recuperación.',
  },
  {
    path: '/atacante',
    role: 'attacker',
    label: 'Atacante',
    eyebrow: 'Mac · operador',
    description: 'Permisos, acciones y cronología del incidente.',
  },
  {
    path: '/publico',
    role: 'audience',
    label: 'Público',
    eyebrow: 'Proyector · audiencia',
    description: 'Misterio, revelación y reto colectivo.',
  },
  {
    path: '/coordinacion',
    role: 'coordinator',
    label: 'Coordinación',
    eyebrow: 'Control · estación',
    description: 'Sesión, tiempo, fases y parada de emergencia.',
  },
];
