export default (config, { strapi }) => {
  return async (ctx, next) => {
    const originalSet = ctx.cookies.set;
    ctx.cookies.set = (name, value, opts) => {
      const isSecure = ctx.request.headers['x-forwarded-proto'] === 'https';
      originalSet.call(ctx.cookies, name, value, {
        ...opts,
        secure: false,
      });
    };
    await next();
  };
};