/**
 * reservation controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::reservation.reservation', {
  async find(ctx) {
    if (ctx.state.user) {
      const entries = await strapi.entityService.findMany('api::reservation.reservation', {
        filters: {
          in: {
            $gt: new Date()
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
      });
      return ctx.send(entries);
    } else {
      return ctx.send();
    }
  }
});
