const request = require('supertest');
const app = require('../../server'); // Adjust path if needed
const { sequelize, Event } = require('../../models'); // Adjust path

// Helper to create a dummy event for testing
async function createTestEvent() {
    return Event.create({
        name: 'Test Triathlon',
        slug: 'test-triathlon',
        month: 'August',
        description: 'A test event.',
        locationName: 'Test Lake',
        latitude: 50.7,
        longitude: 15.1
    });
}

// Jest hooks for setup and teardown
beforeAll(async () => {
    // Ensure database is synced before tests run
    // Use force: true ONLY in test environment to clear DB between test runs
    await sequelize.sync({ force: true });
    // Create necessary seed data for tests
    await createTestEvent();
});

afterAll(async () => {
    // Clean up the database after tests
    // await sequelize.drop(); // Drop all tables
    await sequelize.close(); // Close connection
});

describe('Event Routes', () => {

    // Test GET /events/:eventSlug for an existing event
    it('should GET /events/test-triathlon and return status 200 with event details', async () => {
        const res = await request(app).get('/events/test-triathlon');

        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toMatch(/html/); // Check if HTML is returned
        expect(res.text).toContain('Test Triathlon'); // Check if event name is in the response body
        expect(res.text).toContain('A test event.'); // Check description
        expect(res.text).toContain('id="map"'); // Check if map container exists
        expect(res.text).toContain('Register for Test Triathlon'); // Check if registration section is present
    });

    // Test GET /events/:eventSlug for a non-existent event
    it('should GET /events/non-existent-event and return status 404', async () => {
        const res = await request(app).get('/events/non-existent-event');

        expect(res.statusCode).toEqual(404);
        expect(res.headers['content-type']).toMatch(/html/);
        // You might want to check for specific text in your 404 page view
        expect(res.text).toContain('Page Not Found'); // Assuming your 404.ejs contains this
    });

    // Add more tests for registration POST requests (success and validation failure)
    // describe('POST /register/:eventId', () => {
    //     it('should successfully register a user for an event', async () => { ... });
    //     it('should return validation errors if required fields are missing', async () => { ... });
    // });

});
