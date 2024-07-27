export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { flightNumber, date, passengers } = req.body;
  
      // Dummy booking response
      const bookingConfirmation = {
        flightNumber,
        date,
        passengers,
        status: 'Confirmed',
      };
  
      res.status(200).json({ bookingConfirmation });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }
  