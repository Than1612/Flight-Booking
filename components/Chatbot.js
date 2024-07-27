import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, setFlights, setFlightDetails, setBookingStatus } from '../store/store';

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [awaitingFlightSelection, setAwaitingFlightSelection] = useState(false);
  const [awaitingCancellationConfirmation, setAwaitingCancellationConfirmation] = useState(false);
  const dispatch = useDispatch();
  const conversation = useSelector((state) => state.chatbot.conversation);
  const flights = useSelector((state) => state.chatbot.flights);
  const flightDetails = useSelector((state) => state.chatbot.flightDetails);
  const bookingStatus = useSelector((state) => state.chatbot.bookingStatus);

  useEffect(() => {
    dispatch(addMessage({ sender: 'bot', text: 'Welcome! How can I assist you today? You can book a flight or ask for help.' }));
  }, [dispatch]);

  const sendMessage = (message) => {
    dispatch(addMessage({ sender: 'user', text: message }));
    handleUserMessage(message);
    setInput('');
  };

  const handleUserMessage = async (message) => {
    dispatch(addMessage({ sender: 'bot', text: 'Processing...' }));
    console.log('User message:', message);

    const getFutureDate = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    setTimeout(async () => {
      if (awaitingFlightSelection) {
        if (message.match(/^\d+$/)) {
          const flightIndex = parseInt(message, 10) - 1;
          if (flightIndex >= 0 && flightIndex < flights.length) {
            const selectedFlight = flights[flightIndex];
            dispatch(setFlightDetails(selectedFlight));
            dispatch(addMessage({
              sender: 'bot',
              text: `You selected flight ${selectedFlight.segments[0].carrierCode}${selectedFlight.segments[0].number} with ${selectedFlight.seatsAvailable} seats available. Please provide the booking date in the format YYYY-MM-DD.`,
            }));
            setAwaitingFlightSelection(false);
          } else {
            dispatch(addMessage({ sender: 'bot', text: 'Invalid selection. Please select a flight by its serial number.' }));
          }
        } else {
          dispatch(addMessage({ sender: 'bot', text: 'Invalid input. Please select a flight by its serial number.' }));
        }
      } else if (awaitingCancellationConfirmation) {
        if (message.toLowerCase() === 'yes') {
          dispatch(addMessage({ sender: 'bot', text: 'Your booking has been canceled. How else can I assist you?' }));
          setAwaitingCancellationConfirmation(false);
        } else if (message.toLowerCase() === 'no') {
          dispatch(addMessage({ sender: 'bot', text: 'Okay, your booking remains unchanged. How else can I assist you?' }));
          setAwaitingCancellationConfirmation(false);
        } else {
          dispatch(addMessage({ sender: 'bot', text: 'Please respond with "yes" or "no".' }));
        }
      } else if (message.toLowerCase().includes('book a flight from')) {
        const match = message.match(/from (.*?) to (.*?)(?:\s|$)/i); // Expecting city names
        if (match) {
          const originCity = match[1].trim();
          const destinationCity = match[2].trim();
          console.log('Extracted origin and destination:', { originCity, destinationCity });
          const departureDate = getFutureDate(7); // 7 days from today
          const response = await fetch('/api/searchFlights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin: originCity, destination: destinationCity, departureDate }),
          });
          const data = await response.json();
          console.log('searchFlights response:', data);
          if (data.flights && data.flights.length > 0) {
            const flightsTable = generateFlightsTable(data.flights);
            console.log('Generated flights table:', flightsTable);
            dispatch(setFlights(data.flights));
            dispatch(addMessage({
              sender: 'bot',
              text: `Here are the available flights from ${originCity} to ${destinationCity}:<br>${flightsTable}<br>Please select a flight by its serial number.`,
            }));
            setAwaitingFlightSelection(true);
          } else {
            dispatch(addMessage({ sender: 'bot', text: `Could not find flights from ${originCity} to ${destinationCity}. Please try again.` }));
          }
        } else {
          dispatch(addMessage({ sender: 'bot', text: 'Could not parse your message. Please use city names.' }));
        }
      } else if (message.toLowerCase().includes('cancel')) {
        dispatch(addMessage({ sender: 'bot', text: 'Are you sure you want to cancel your booking? Please respond with "yes" or "no".' }));
        setAwaitingCancellationConfirmation(true);
      } else if (message.match(/^\d{4}-\d{2}-\d{2}$/)) { // Date in YYYY-MM-DD format
        const selectedFlight = flightDetails;
        if (selectedFlight) {
          const updatedFlightDetails = { ...selectedFlight, date: message };
          dispatch(setFlightDetails(updatedFlightDetails));
          dispatch(addMessage({ sender: 'bot', text: 'Please provide the name(s) of the passenger(s) separated by commas if more than one.' }));
        } else {
          dispatch(addMessage({ sender: 'bot', text: 'No flight selected. Please start by selecting a flight.' }));
        }
      } else if (message.toLowerCase().includes(',')) { // Assuming names are separated by commas
        const passengers = message.split(',').map(name => name.trim());
        console.log('Extracted passengers:', passengers);
        const response = await fetch('/api/bookFlight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flightNumber: flightDetails.segments[0].carrierCode + flightDetails.segments[0].number, date: flightDetails.date, passengers }),
        });
        const data = await response.json();
        console.log('bookFlight response:', data);
        dispatch(setBookingStatus(data.bookingConfirmation.status));
        dispatch(addMessage({ sender: 'bot', text: 'Thank you! Your flight has been booked.' }));
      } else if (message.trim().length > 0) { // Single passenger name
        const passengers = [message.trim()];
        console.log('Extracted passenger:', passengers);
        const response = await fetch('/api/bookFlight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flightNumber: flightDetails.segments[0].carrierCode + flightDetails.segments[0].number, date: flightDetails.date, passengers }),
        });
        const data = await response.json();
        console.log('bookFlight response:', data);
        dispatch(setBookingStatus(data.bookingConfirmation.status));
        dispatch(addMessage({ sender: 'bot', text: 'Thank you! Your flight has been booked.' }));
      } else {
        dispatch(addMessage({ sender: 'bot', text: 'I didn\'t understand that. Can you please clarify?' }));
      }
    }, 2000); // 2000 milliseconds = 2 seconds delay
  };

  const generateFlightsTable = (flights) => {
    let table = '<div class="table-container"><table><thead><tr><th>Serial No.</th><th>Flight Name</th><th>Departure Time</th><th>Arrival Time</th><th>Seats Available</th></tr></thead><tbody>';
    flights.forEach((flight, index) => {
      const segments = flight.segments;
      const flightName = segments.map(segment => `${segment.carrierCode}${segment.number}`).join(', ');
      const departureTime = segments.map(segment => new Date(segment.departure.at).toLocaleTimeString()).join(', ');
      const arrivalTime = segments.map(segment => new Date(segment.arrival.at).toLocaleTimeString()).join(', ');
      table += `<tr><td>${index + 1}</td><td>${flightName}</td><td>${departureTime}</td><td>${arrivalTime}</td><td>${flight.seatsAvailable}</td></tr>`;
    });
    table += '</tbody></table></div>';
    return table;
  };

  return (
    <div className="chatbot-container">
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === 'user' ? 'User' : 'Bot'}: </strong><span dangerouslySetInnerHTML={{ __html: msg.text }} />
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type a message..."
        />
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </div>
  );
}
