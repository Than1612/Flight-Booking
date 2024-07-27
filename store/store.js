import { configureStore, createSlice } from '@reduxjs/toolkit';

// Define the initial state for the chatbot slice
const initialState = {
  conversation: [],
  flights: [],
  flightDetails: null,
  bookingStatus: '',
};

// Create the chatbot slice
const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.conversation.push(action.payload);
    },
    setFlights: (state, action) => {
      state.flights = action.payload;
    },
    setFlightDetails: (state, action) => {
      state.flightDetails = action.payload;
    },
    setBookingStatus: (state, action) => {
      state.bookingStatus = action.payload;
    },
  },
});

// Export the actions
export const { addMessage, setFlights, setFlightDetails, setBookingStatus } = chatbotSlice.actions;

// Export the reducer
export default chatbotSlice.reducer;

// Configure the store with the chatbot reducer
export const store = configureStore({
  reducer: {
    chatbot: chatbotSlice.reducer,
  },
});
