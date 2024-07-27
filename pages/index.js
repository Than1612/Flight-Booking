import { Provider } from 'react-redux';
import { store } from '../store/store';
import Chatbot from '../components/Chatbot';

export default function Home() {
  return (
    <Provider store={store}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center' }}>
        <h1>Flight Booking Assistant</h1>
        <Chatbot />
      </div>
    </Provider>
  );
}

