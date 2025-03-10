interface LifecycleEvent {
  result: {
    id: number;
    stat: 'requested' | 'confirmed' | 'denied' | 'cancelled';
    in: string;
    out: string;
    publishedAt: string | null;
    user: { id: number, email: string }
  };
}

interface Reservation {
	id: number;
  stat: 'requested' | 'confirmed' | 'denied' | 'cancelled';
  in: string;
  out: string;
  publishedAt: string | null;
  user?: { id: number, email: string }
}

function textDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month - 1]} ${ordinalSuffix(day)}, ${year}`;
}

function abbrDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
}

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}
function capitalize(str) {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default {
	async afterUpdate(event: LifecycleEvent) {
		const { result } = event;

		//document service
		const { user } = await strapi.entityService.findOne('api::reservation.reservation', result.id, { populate: [ 'user' ] }) as Reservation;

		try {
			await strapi.plugin('email').service('email').send({
				to: user.email,
				from: process.env.MANAGER_EMAIL,
				replyTo: process.env.ADMIN_EMAIL,
				subject: `${capitalize(result.stat)}: ${textDate(result.in)} - ${textDate(result.out)}`,
				text: ``,
				html: `Reservation ${capitalize(result.stat)}: ${textDate(result.in)} - ${textDate(result.out)}`
			});
		} catch(e) {}

		if (result.stat === 'confirmed') {
			const actions = ['cancel', 'deny'];
			const tokens: Record<string, string> = {};

			for (const action of actions) {
				const token = await strapi
				  .plugin('users-permissions')
				  .service('jwt')
				  .issue( {
				  	id: result.id,
				  	action,
				  });

				tokens[action] = token;
			}

      const username = user.email.split('@')[0];

			const baseUrl = process.env.BACK_URL;
	    const cancelUrl = `${baseUrl}/api/reservations/action?token=${tokens.cancel}`;
	    const denyUrl = `${baseUrl}/api/reservations/action?token=${tokens.deny}`;

	    try {
				await strapi.plugin('email').service('email').send({
					to: process.env.ADMIN_EMAIL,
					from: process.env.MANAGER_EMAIL,
					replyTo: process.env.MANAGER_EMAIL,
					subject: `${capitalize(username)} Confirmed: ${textDate(result.in)} - ${textDate(result.out)}`,
					text: ``,
					html: `Confirmed: ${user.email}<br/>
					  ${textDate(result.in)} - ${textDate(result.out)}<br/>
					  <br/>
					  <div style="display:flex">
					    <a style="margin-right:10%;display:flex;text-decoration:none" href="${cancelUrl}">
					      <div style="padding:1em;padding-top:0.69em;padding-bottom:0.69em;border:2px solid gray;border-radius:0.5em;color:gray;font-weight:bold;">Cancel</div>
					    </a>
					    <a style="display:flex;text-decoration:none" href="${denyUrl}">
					      <div style="padding:1em;padding-top:0.69em;padding-bottom:0.69em;border:2px solid red;border-radius:0.5em;color:red;font-weight:bold;">Deny</div>
					    </a>
					  </div>`
				});
			} catch(e) {}
		}
	},
	async afterCreate(event: LifecycleEvent) {
		const { result } = event;
		if (result.stat === 'requested' && result.publishedAt !== null) {

			const actions = ['confirm', 'cancel', 'deny'];
			const tokens: Record<string, string> = {};

			for (const action of actions) {
				const token = await strapi
				  .plugin('users-permissions')
				  .service('jwt')
				  .issue( {
				  	id: result.id,
				  	action,
				  });

				tokens[action] = token;
			}

			const username = result.user.email.split('@')[0];

			const baseUrl = process.env.BACK_URL;
			const confirmUrl = `${baseUrl}/api/reservations/action?token=${tokens.confirm}`;
	    const cancelUrl = `${baseUrl}/api/reservations/action?token=${tokens.cancel}`;
	    const denyUrl = `${baseUrl}/api/reservations/action?token=${tokens.deny}`;

			try {
				await strapi.plugin('email').service('email').send({
					to: process.env.ADMIN_EMAIL,
					from: process.env.MANAGER_EMAIL,
					replyTo: result.user.email,
					subject: `${capitalize(username)} Requests: ${textDate(result.in)} - ${textDate(result.out)}`,
					text: ``,
					html: `A new reservation has been requested by ${result.user.email}<br/><br/><b>Check-in:</b> ${textDate(result.in)}<br/><b>Check-out:</b> ${textDate(result.out)}<br/><br/>Reply to this email to speak with them.`
				});
			} catch(e) {}

			try {
				await strapi.plugin('email').service('email').send({
					to: process.env.ADMIN_EMAIL,
					from: process.env.MANAGER_EMAIL,
					replyTo: process.env.MANAGER_EMAIL,
					subject: `${capitalize(username)} Controls: ${textDate(result.in)} - ${textDate(result.out)}`,
					text: ``,
					html: `${result.user.email}<br/>
					  ${textDate(result.in)} - ${textDate(result.out)}<br/>
					  <br/>
					  <div style="display:flex">
					    <a style="margin-right:10%;display:flex;text-decoration:none" href="${confirmUrl}">
					      <div style="padding:1em;padding-top:0.69em;padding-bottom:0.69em;border:2px solid green;border-radius:0.5em;color:green;font-weight:bold;">Confirm</div>
					    </a>
					    <a style="margin-right:10%;display:flex;text-decoration:none" href="${cancelUrl}">
					      <div style="padding:1em;padding-top:0.69em;padding-bottom:0.69em;border:2px solid gray;border-radius:0.5em;color:gray;font-weight:bold;">Cancel</div>
					    </a>
					    <a style="display:flex;text-decoration:none" href="${denyUrl}">
					      <div style="padding:1em;padding-top:0.69em;padding-bottom:0.69em;border:2px solid red;border-radius:0.5em;color:red;font-weight:bold;">Deny</div>
					    </a>
					  </div>`
				});
			} catch(e) {}
		}
	}
}