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

export default {
	async afterCreate(event: LifecycleEvent) {
		const { result } = event;
		if (result.stat === 'requested' && result.publishedAt !== null) {
			try {
				await strapi.plugin('email').service('email').send({
					to: process.env.ADMIN_EMAIL,
					from: process.env.MANAGER_EMAIL,
					replyTo: result.user.email,
					subject: `Reservation Requested: ${textDate(result.in)} - ${textDate(result.out)}`,
					text: ``,
					html: `A new reservation has been requested by ${result.user.email}<br/><br/><b>Check-in:</b> ${textDate(result.in)}<br/><b>Check-out:</b> ${textDate(result.out)}<br/><br/>Reply to this email to speak with them.`
				});
			} catch(e) {}
		}
	}
}