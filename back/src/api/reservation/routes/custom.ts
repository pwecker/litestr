export default {
	routes: [
		{
      method: 'GET',
      path: '/reservations/action',
      handler: 'reservation.action',
      config: {
        auth: false
      }
    }
  ]
};