import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminInventory = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newResource, setNewResource] = useState({ name: '', category: '', description: '', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/resources');
      setResources(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/resources', newResource);
      setNewResource({ name: '', category: '', description: '', imageUrl: '' });
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource forever?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/resources/${id}`);
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource.');
    }
  };

  const handleEditSave = async (id, updatedResource) => {
    try {
      await axios.put(`http://localhost:5000/api/resources/${id}`, updatedResource);
      setEditingId(null);
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Failed to update resource.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800">Manage Inventory</h1>
        <p className="text-slate-500 mt-2">Add, Edit, or Remove physical resources from the internal database.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD RESOURCE FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-10">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Create New Resource</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Name</label>
                <input required value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Category (e.g., Venue, Equipment)</label>
                <input required value={newResource.category} onChange={e => setNewResource({...newResource, category: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <textarea required value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} rows="3" className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Image URL</label>
                <input value={newResource.imageUrl} onChange={e => setNewResource({...newResource, imageUrl: e.target.value})} placeholder="https://unsplash.com/..." className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Save to Database</button>
            </form>
          </div>
        </div>

        {/* RESOURCE LIST */}
        <div className="lg:col-span-2 space-y-4">
          {resources.map(resource => (
            <div key={resource.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-6 items-start">
              {editingId === resource.id ? (
                <div className="w-full space-y-3">
                  <input defaultValue={resource.name} id={`edit-name-${resource.id}`} className="block w-full rounded-md border-slate-200 shadow-sm p-2 border font-bold" />
                  <input defaultValue={resource.category} id={`edit-cat-${resource.id}`} className="block w-full rounded-md border-slate-200 shadow-sm p-2 border text-sm" />
                  <textarea defaultValue={resource.description} id={`edit-desc-${resource.id}`} className="block w-full rounded-md border-slate-200 shadow-sm p-2 border text-sm" rows="2" />
                  <div className="flex gap-2">
                    <button onClick={() => {
                        handleEditSave(resource.id, {
                          name: document.getElementById(`edit-name-${resource.id}`).value,
                          category: document.getElementById(`edit-cat-${resource.id}`).value,
                          description: document.getElementById(`edit-desc-${resource.id}`).value
                        })
                    }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save Changes</button>
                    <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{resource.category}</span>
                        <h3 className="text-xl font-bold text-slate-800 mt-2">{resource.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(resource.id)} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-md transition border border-blue-200">Edit</button>
                        <button onClick={() => handleDelete(resource.id)} className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-3 py-1 rounded-md transition border border-red-200">Delete</button>
                      </div>
                    </div>
                    <p className="text-slate-600 mt-3 text-sm leading-relaxed">{resource.description}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminInventory;
