/**
 * reservation controller
 */

import { factories } from '@strapi/strapi'

interface ReservationEntry {
  id: number;
  documentId: string;
  locale?: string;
  createdAt?: string;
  in?: string;
  out?: string;
  publishedAt?: string;
  stat?: 'requested' | 'confirmed' | 'cancelled' | 'denied';
  updatedAt?: string;
  user?: { id: number };
}

type PopulatedReservationEntry = Omit<ReservationEntry, 'user'> & { user: { id: number } };

export default factories.createCoreController('api::reservation.reservation', {
  async find(ctx) {
    if (ctx.state.user) {

      //document service
      const entries = await strapi.entityService.findMany('api::reservation.reservation', {
        filters: {
          in: {
            $gte: new Date()
          },
          $or: [
            {
              stat: 'confirmed'
            },
            {
              stat: 'requested',
              user: ctx.state.user.id
            }
          ]
        },
        populate: [ 'user' ]
      }) as ReservationEntry[];

      if (!Array.isArray(entries)) {
        return ctx.send([]);
      }

      const populatedEntries = entries as PopulatedReservationEntry[];

      const transformed = populatedEntries.map(({ user, ...entry }) => ({
        ...entry,
        own: user?.id === ctx.state.user.id
      }));

      return ctx.send(transformed);
    } else {
      return ctx.send([]);
    }
  }
});
