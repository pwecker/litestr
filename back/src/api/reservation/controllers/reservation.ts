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
  async action(ctx) {
    try {
      const { token } = ctx.query;
      if (!token) {
        return ctx.badRequest('Missing token');
      }

      const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
      if (!decoded || !decoded.id || !decoded.action) {
        return ctx.unauthorized('Invalid token');
      }

      //document service
      const reservation = await strapi.entityService.findOne('api::reservation.reservation', decoded.id);
      if (!reservation) {
        return ctx.notFound('Reservation not found');
      }

      let updatedStat;
      if (decoded.action === 'confirm') {
        updatedStat = 'confirmed';
      } else if (decoded.action === 'cancel') {
        updatedStat = 'cancelled';
      } else if (decoded.action === 'deny') {
        updatedStat = 'denied';
      }

      //document service
      await strapi.entityService.update('api::reservation.reservation', decoded.id, {
        data: { stat: updatedStat }
      });

      return ctx.send(`Reservation ${updatedStat}.`)
    } catch(e) {
      return ctx.internalServerError('Error processing request');
    }

  },
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
