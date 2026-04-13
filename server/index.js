const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    resourceName: { type: String, required: true },
    studentName: { type: String, required: true },
    date: { type: String, required: true },
    purpose: { type: String },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

bookingSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String }
}, { timestamps: true });

resourceSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Resource = mongoose.model('Resource', resourceSchema);

const resourcesData = require('./data');

const seedDatabase = async () => {
    try {
        const count = await Resource.countDocuments();
        if (count === 0) {
            console.log("Seeding initial resources into MongoDB...");
            const seedData = resourcesData.map(({id, image, ...rest}) => ({...rest, imageUrl: image}));
            await Resource.insertMany(seedData);
            console.log("Database seeded successfully.");
        }
    } catch (err) {
        console.error("Error seeding database:", err);
    }
};

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    seedDatabase();
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Basic route to confirm linkage
app.get('/api/greeting', (req, res) => {
    res.json({ message: 'Hello from the Smart Club Manager backend!' });
});

// GET route to fetch all resources and dynamically resolve their statuses from the DB
app.get('/api/resources', async (req, res) => {
    try {
        const dbResources = await Resource.find({});
        const dbBookings = await Booking.find({});
        
        const bookedResourceNames = dbBookings.filter(b => b.status === 'Booked').map(b => b.resourceName);
        const pendingResourceNames = dbBookings.filter(b => b.status === 'Pending').map(b => b.resourceName);

        const updatedResources = dbResources.map(doc => {
            const resource = doc.toJSON();
            if (bookedResourceNames.includes(resource.name)) {
                return { ...resource, status: 'Booked' };
            }
            if (pendingResourceNames.includes(resource.name)) {
                return { ...resource, status: 'Pending' };
            }
            return { ...resource, status: 'Available' };
        });

        res.json(updatedResources);
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// POST route to add a new resource
app.post('/api/resources', async (req, res) => {
    console.log('RECEIVED DATA:', req.body);
    try {
        const newResource = new Resource(req.body);
        await newResource.save();
        res.status(201).json({ message: 'Resource added successfully!', resource: newResource });
    } catch (error) {
        console.error("POST /api/resources Error:", error);
        res.status(500).json({ error: 'Failed to add resource' });
    }
});

// PUT route to edit a resource
app.put('/api/resources/:id', async (req, res) => {
    try {
        const updatedResource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedResource) {
            res.json({ message: 'Resource updated successfully!', resource: updatedResource });
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

// DELETE route to drop a resource
app.delete('/api/resources/:id', async (req, res) => {
    try {
        const deletedResource = await Resource.findByIdAndDelete(req.params.id);
        if (deletedResource) {
            res.json({ message: 'Resource deleted successfully!' });
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// GET route to fetch all bookings from MongoDB
app.get('/api/bookings', async (req, res) => {
    try {
        const dbBookings = await Booking.find().sort({ createdAt: -1 });
        res.json(dbBookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// PATCH route to update a booking status (Admin View)
app.patch('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
        if (updatedBooking) {
            res.json({ message: `Booking status updated to ${status}` });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// POST route to save a new booking into MongoDB
app.post('/api/bookings', async (req, res) => {
    try {
        const { resourceName, studentName, date, purpose } = req.body;
        
        console.log(`[POST] /api/bookings - Student: ${studentName}, Resource: ${resourceName}`);
        
        // Prevent double booking overlap for explicitly approved and pending cases
        const existingBooking = await Booking.findOne({
            resourceName,
            date,
            status: { $in: ['Pending', 'Booked'] }
        });
        
        if (existingBooking) {
            return res.status(400).json({ error: 'This slot is already taken!' });
        }

        const newBooking = await Booking.create({
            resourceName,
            studentName,
            date,
            purpose,
            status: 'Pending'
        });
        
        res.status(201).json({ message: `Booking request received for ${resourceName}!`, booking: newBooking });
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).json({ error: 'Failed to save booking' });
    }
});

// POST route for /api/book
app.post('/api/book', (req, res) => {
    console.log('[POST] /api/book - Data received:', req.body);
    res.json({ message: 'Booking Successful!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
