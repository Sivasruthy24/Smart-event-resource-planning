import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch resources from the Backend when the page loads
  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      // This matches your app.get('/api/resources') route
      const response = await axios.get('http://localhost:5000/api/resources');
      setResources(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // 2. Handle the "Book Now" logic
  const handleBooking = async (resourceName) => {
    try {
      // This matches your app.post('/api/bookings') route
      const response = await axios.post('http://localhost:5000/api/bookings', {
        resourceName: resourceName,
        studentName: localStorage.getItem('currentUser') || "Student",
        date: new Date().toISOString().split('T')[0],
        purpose: "General Usage"
      });

      alert(response.data.message);
      fetchResources(); // Refresh the list to show the "Pending" status
    } catch (error) {
      // This catches the "This slot is already taken!" error from your backend
      alert(error.response?.data?.error || "Booking failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800">Smart Event Resource Planning</h1>
        <p className="text-slate-500 mt-2 text-lg">Resource Allocation & Management System</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {resources.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  item.status === 'Available' ? 'bg-green-100 text-green-700' : 
                  item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  • {item.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{item.name}</h2>
              <p className="text-slate-600 mt-3 line-clamp-2">{item.description}</p>
            </div>

            <button
              onClick={() => handleBooking(item.name)}
              disabled={item.status !== 'Available'}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all ${
                item.status === 'Available' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {item.status === 'Available' ? 'Book Now →' : 'Unavailable'}
            </button>
          </div>
        ))}
      </main>
    </div>
  );
};

export default App;